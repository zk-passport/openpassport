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
                "16419579113510834491565531160077751610403971604192408854317198387544449540689",
                "19708649717585955207413837582496282420637555884521568035130538512934342820826",
                "1"
              ],
              "pi_b": [
                [
                  "14679909310546314819382083760700898763160700588956691234118749471746302594027",
                  "279560696217401421178401246590943617449792866009942562723162046413282532177"
                ],
                [
                  "21623259974688348674111581930620919412356839321850892018570405257434957183830",
                  "6529926714146902197947935597180036864533483713027945013883950777140902496167"
                ],
                [
                  "1",
                  "0"
                ]
              ],
              "pi_c": [
                "9176329247311006831127738607556982126516918170112475588238899351771973207924",
                "16488819329650057990309385687697374165282191978370257811305402171484159748954",
                "1"
              ],
              "protocol": "groth16",
              "curve": "bn128"
            },
            "publicSignals": [
              "3024342369770083205277676417000541928218842535300840137930294206510168723413",
              "7553636423677555276396119121300202111887470782748270600180491475976791952842",
              "15557922383494890810755516196314262996012424602354678584082040506449040792081",
              "8518753152044246090169372947057357973469996808638122125210848696986717482788"
            ]
          },
          "proof_csca": {
            "proof": {
              "a": [
                "12483942904828891606585845536320462012194273301738676123069757950041032090503",
                "4005902649605338985676669500187884844168350956787551863933189961621555781555"
              ],
              "b": [
                [
                  "1127900237150184710666467700842381335057028112133222501346239738919472300617",
                  "5611860306083973167533484685500662487114811256741194408398892235948902184091"
                ],
                [
                  "13482809225957313830578295365741081331442192857290273490028928364266517373402",
                  "3366070997969506393055448504643789283493502251107544194566213774818740419251"
                ]
              ],
              "c": [
                "6837632445645612930913004811010773675474273430493342453280754571884708562167",
                "14596431856364405762209316166507134341102401651869473426443602039334472098934"
              ]
            },
            "publicSignals": [
              "3024342369770083205277676417000541928218842535300840137930294206510168723413",
              "11406887179192998141316434121926377942525639172220901846038964800699077034561"
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