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
import { PASSPORT_ATTESTATION_ID } from '../../../common/src/constants/constants';
import { generateProof } from '../utils/prover';
import { formatSigAlgNameForCircuit } from '../../../common/src/utils/utils';
import { loadPassportData, loadSecretOrCreateIt, storePassportData } from '../utils/keychain';

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
  sivUserID: string | null
  initUserStore: () => Promise<void>
  registerPassportData: (passportData: PassportData) => void
  doProof: (passportData?: PassportData) => void
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
  sivUserID: null,
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
    // downloadZkey("disclose");

    // if (get().localProof && get().dscCertificate) {
    //   useNavigationStore.getState().setStep(Steps.REGISTERED);
    //   return;
    // }

    // const secret = await loadSecretOrCreateIt();
    // set({ secret });

    const passportData = await loadPassportData();
    if (!passportData) {
      console.log("No passport data found, starting onboarding flow")
      return;
    }

    // const isAlreadyRegistered = await isCommitmentRegistered(secret, JSON.parse(passportData));

    // if (!isAlreadyRegistered) {
    //   console.log("not registered but passport data found, skipping to nextScreen")
    //   set({
    //     passportData: JSON.parse(passportData),
    //   });
    //   useNavigationStore.getState().setStep(Steps.NEXT_SCREEN);
    //   return;
    // }

    // console.log("registered and passport data found, skipping to app selection screen")
    // set({
    //   passportData: JSON.parse(passportData),
    //   registered: true,
    // });
  },

  // When reading passport for the first time:
  // - Check presence of secret. If there is none, create one and store it
  // 	- Store the passportData and try registering the commitment in the background
  registerPassportData: async (passportData) => {
    // const alreadyStoredPassportData = await loadPassportData();

    // if (alreadyStoredPassportData) {
    //   console.log("passportData is already stored, this should never happen in prod")
    //   console.log("replacing it with the new one")
    // }

    await storePassportData(passportData)
    set({ passportData });
  },

  doProof: async (mockPassportData?: PassportData) => {
    const {
      toast,
      setStep,
      update: updateNavigationStore,
    } = useNavigationStore.getState();
    // const secret = get().secret;
    let passportData = get().passportData
    if (mockPassportData) {
      passportData = mockPassportData
    }

    try {
      const SIV = get().sivUserID as string
      const inputs = generateCircuitInputsRegister(
        "000",
        "000",
        "000",
        passportData,
        SIV ?? "00", // THIS IS THE SIV USER ID
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

      const proof = await generateProof(
        `register_${sigAlgFormatted}`,
        inputs
      );
      console.log('localProof:', proof);
      set({ localProof: proof });

      const end = Date.now();
      console.log('Total proof time from frontend:', end - start);
      amplitude.track('Proof generation successful, took ' + ((end - start) / 1000) + ' seconds');

      setStep(Steps.REGISTERED);
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