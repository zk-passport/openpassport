import { create } from 'zustand'
import {
  DEFAULT_PNUMBER,
  DEFAULT_DOB,
  DEFAULT_DOE,
} from '@env';
import forge from 'node-forge';
import { mockPassportData_sha256WithRSAEncryption_65537 } from '../../../common/src/utils/mockPassportData';
import { PassportData, Proof } from '../../../common/src/utils/types';
import * as Keychain from 'react-native-keychain';
import * as amplitude from '@amplitude/analytics-react-native';
import useNavigationStore from './navigationStore';
import { Steps } from '../utils/utils';
import { downloadZkey } from '../utils/zkeyDownload';
import { generateCircuitInputsRegister } from '../../../common/src/utils/generateInputs';
import { PASSPORT_ATTESTATION_ID, RPC_URL, SignatureAlgorithm } from '../../../common/src/constants/constants';
import { generateProof } from '../utils/prover';
import { formatSigAlgNameForCircuit } from '../../../common/src/utils/utils';
import { sendRegisterTransaction } from '../utils/transactions';
import { loadPassportData, loadSecret, loadSecretOrCreateIt, storePassportData } from '../utils/keychain';
import { ethers } from 'ethers';
import { isCommitmentRegistered } from '../utils/registration';

interface UserState {
  passportNumber: string
  dateOfBirth: string
  dateOfExpiry: string
  registered: boolean
  passportData: PassportData
  secret: string
  dscCertificate: any
  cscaProof: any | null
  localProof: Proof | null
  dscSecret: string | null
  initUserStore: () => void
  registerPassportData: (passportData: PassportData) => void
  registerCommitment: (passportData?: PassportData) => void
  clearPassportDataFromStorage: () => void
  clearSecretFromStorage: () => void
  clearProofsFromStorage: () => void
  update: (patch: any) => void
  deleteMrzFields: () => void
  setRegistered: (registered: boolean) => void
  setDscSecret: (dscSecret: string) => void
}

const useUserStore = create<UserState>((set, get) => ({
  passportNumber: DEFAULT_PNUMBER ?? "",
  dateOfBirth: DEFAULT_DOB ?? "",
  dateOfExpiry: DEFAULT_DOE ?? "",
  dscSecret: null,
  registered: false,
  passportData: mockPassportData_sha256WithRSAEncryption_65537,
  secret: "",
  dscCertificate: null,
  cscaProof: null,
  localProof: null,
  setRegistered: (registered: boolean) => {
    set({ registered });
  },
  setDscSecret: (dscSecret: string) => {
    set({ dscSecret });
  },

  // When user opens the app, checks presence of passportData
  // - If passportData is not present, starts the onboarding flow
  // - If passportData is present, then secret must be here too (they are always set together). Request the tree.
  // 	- If the commitment is present in the tree, proceed to main screen
  // 	- If the commitment is not present in the tree, proceed to main screen AND try registering it in the background
  initUserStore: async () => {
    // download zkeys if they are not already downloaded
    downloadZkey("register_sha256WithRSAEncryption_65537"); // might move after nfc scanning
    downloadZkey("disclose");

    const secret = await loadSecretOrCreateIt();
    set({ secret });

    const passportData = await loadPassportData();
    if (!passportData) {
      console.log("No passport data found, starting onboarding flow")
      return;
    }

    const isAlreadyRegistered = await isCommitmentRegistered(secret, JSON.parse(passportData));

    if (!isAlreadyRegistered) {
      console.log("not registered but passport data found, skipping to nextScreen")
      set({
        passportData: JSON.parse(passportData),
      });
      useNavigationStore.getState().setStep(Steps.NEXT_SCREEN);
      return;
    }

    console.log("registered and passport data found, skipping to app selection screen")
    set({
      passportData: JSON.parse(passportData),
      registered: true,
    });
    // useNavigationStore.getState().setStep(Steps.REGISTERED);
  },

  // When reading passport for the first time:
  // - Check presence of secret. If there is none, create one and store it
  // 	- Store the passportData and try registering the commitment in the background
  registerPassportData: async (passportData) => {
    const alreadyStoredPassportData = await loadPassportData();

    if (alreadyStoredPassportData) {
      console.log("passportData is already stored, this should never happen in prod")
      console.log("replacing it with the new one")
    }

    await storePassportData(passportData)
    set({ passportData });
  },

  registerCommitment: async (mockPassportData?: PassportData) => {
    const {
      toast,
      setStep,
      update: updateNavigationStore,
    } = useNavigationStore.getState();
    const secret = get().secret;
    let passportData = get().passportData
    if (mockPassportData) {
      passportData = mockPassportData
    }

    const isAlreadyRegistered = await isCommitmentRegistered(secret, passportData);
    if (isAlreadyRegistered) {
      console.log("commitment is already registered")
      toast.show('Identity already registered, skipping', {
        customData: {
          type: "info",
        },
      })
      set({ registered: true });
      setStep(Steps.REGISTERED);
      return;
    }

    let dsc_secret = get().dscSecret;

    try {
      if (get().dscSecret === null) {
        console.log("DSC secret is not set, generating a new one");
        const secretBytes = forge.random.getBytesSync(31);
        dsc_secret = BigInt(`0x${forge.util.bytesToHex(secretBytes)}`).toString();
        console.log('Generated secret:', dsc_secret.toString());
        get().setDscSecret(dsc_secret);
      }
      const inputs = generateCircuitInputsRegister(
        secret,
        dsc_secret as string,
        PASSPORT_ATTESTATION_ID,
        passportData,
        "000000", // THIS IS THE SIV USER ID
        121,
        17

      );

      amplitude.track(`Sig alg supported: ${passportData.signatureAlgorithm}`);
      console.log("userStore - inputs - Object.keys(inputs).forEach((key) => {...")
      Object.keys(inputs).forEach((key) => {
        if (Array.isArray(inputs[key as keyof typeof inputs])) {
          console.log(key, inputs[key as keyof typeof inputs].slice(0, 10), '...');
        } else {
          console.log(key, inputs[key as keyof typeof inputs]);
        }
      });

      const start = Date.now();

      const sigAlgFormatted = formatSigAlgNameForCircuit(passportData.signatureAlgorithm, passportData.pubKey.exponent);
      const sigAlgIndex = SignatureAlgorithm[sigAlgFormatted as keyof typeof SignatureAlgorithm]

      const proof = await generateProof(
        `register_${sigAlgFormatted}`,
        inputs
      );
      console.log('localProof:', proof);
      get().localProof = proof;

      const end = Date.now();
      console.log('Total proof time from frontend:', end - start);
      amplitude.track('Proof generation successful, took ' + ((end - start) / 1000) + ' seconds');


      if ((get().cscaProof !== null) && (get().localProof !== null)) {
        console.log("Proof from Modal server already received, sending transaction");
        const request = {
          proof: proof,
          proof_csca: get().cscaProof,
        }
        const response = await fetch('https://app.proofofpassport.com/apiv3/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        });
        // download merkle tree url: https://app.proofofpassport.com/apiv3/download

        /******* EXAMPLE OF VALID REQUEST *******/
        // !!! proofs are not parsed the same way and that's ok, that's handle in the sdk
        const valid_request = {
          "proof": {
            "proof": {
              "pi_a": [
                "12733177525455704210519736383296538007910749723448031337349078165328039600859",
                "14181709377327981930000007774455891272271055702011632478393451102323630498525",
                "1"
              ],
              "pi_b": [
                [
                  "9066116301746033590215977774729066511987300508308565540193763832156067755636",
                  "11806977446699240989612666877714091098488068694858652319817190053463919382807"
                ],
                [
                  "9910448647578865322696211161889358205934617836993377856120780476627011195827",
                  "5714915200389101862824746186133607267451772162138746689809352482146030052900"
                ],
                [
                  "1",
                  "0"
                ]
              ],
              "pi_c": [
                "5479246894098224285435147620441102718188334563083034100297732451035485693839",
                "18543901252211574973357099146914835902444179612381220090745716552007907988398",
                "1"
              ],
              "protocol": "groth16",
              "curve": "bn128"
            },
            "publicSignals": [
              "3024342369770083205277676417000541928218842535300840137930294206510168723413",
              "15066362206318206511515409011387680432774765424771555470898487410008577014804",
              "11424862102746090112731659330386944024014225755300441279325160764635162268252",
              "8518753152044246090169372947057357973469996808638122125210848696986717482788",
              "101010"
            ]
          },
          "proof_csca": {
            "proof": {
              "a": [
                "15533029549607395896673021122515991436056956102265321923478365775117459960537",
                "3033686094504260167847132321876085811957591680323976890811568893752379553089"
              ],
              "b": [
                [
                  "17196151605774839099811500410019720325584196427006536618242452337848363014719",
                  "19076981946115991463304139460781779550105193636778872817074605260985189781699"
                ],
                [
                  "8980533335809847571882243495881052652890201582600545641106859178113224844186",
                  "16378740801935213914787948042538276049548233207718475709719321460517175671123"
                ]
              ],
              "c": [
                "8951895154524967262780643848991306649629992734449410793953246261212881463662",
                "13171098770720524450716744345981725754693059849386083274832018978888018355584"
              ]
            },
            "publicSignals": [
              "3024342369770083205277676417000541928218842535300840137930294206510168723413",
              "16316565454863929078587512207263992397355881820563880167873574924649587150665"
            ]
          }
        }




        // const provider = new ethers.JsonRpcProvider(RPC_URL);
        // const serverResponse = await sendRegisterTransaction(proof, get().cscaProof as Proof, sigAlgIndex)
        // const txHash = serverResponse?.data.hash;
        // const receipt = await provider.waitForTransaction(txHash);
        // console.log('receipt status:', receipt?.status);
        // if (receipt?.status === 0) {
        //   throw new Error("Transaction failed");
        // }
        set({ registered: true });
        setStep(Steps.REGISTERED);
        toast.show('✅', {
          message: "Registered",
          customData: {
            type: "success",
          },
        })
      }
      else {
        console.log("Proof from Modal server not received, waiting for it...");
      }

    } catch (error: any) {
      console.error(error);
      updateNavigationStore({
        showRegistrationErrorSheet: true,
        registrationErrorMessage: error.message,
      })
      setStep(Steps.NEXT_SCREEN);
      amplitude.track(error.message);
    }
  },


  clearPassportDataFromStorage: async () => {
    await Keychain.resetGenericPassword({ service: "passportData" });
  },

  clearProofsFromStorage: async () => {
    get().cscaProof = null;
    get().localProof = null;
  },

  clearSecretFromStorage: async () => {
    await Keychain.resetGenericPassword({ service: "secret" });
  },

  update: (patch) => {
    set({
      ...get(),
      ...patch,
    });
  },

  deleteMrzFields: () => set({
    passportNumber: "",
    dateOfBirth: "",
    dateOfExpiry: "",
  }),
}))

export default useUserStore