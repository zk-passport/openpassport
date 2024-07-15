import { AppType } from "../utils/appType";
import { Vote } from '@tamagui/lucide-icons';
import { Text, XStack, YStack } from 'tamagui';
import { generateProof } from "../utils/prover";
import useUserStore from "../stores/userStore";
import { generateCircuitInputsDisclose } from "../../../common/src/utils/generateInputs";
import { revealBitmapFromMapping } from "../../../common/src/utils/revealBitmap";
import useSbtStore from "../stores/sbtStore";
import useNavigationStore from "../stores/navigationStore";
import { Steps } from "../utils/utils";
import * as amplitude from '@amplitude/analytics-react-native';
import { Linking } from "react-native";
import { COMMITMENT_TREE_TRACKER_URL, PASSPORT_ATTESTATION_ID, RPC_URL } from "../../../common/src/constants/constants";
import { poseidon2 } from "poseidon-lite";
import axios from 'axios';
import { LeanIMT } from "@zk-kit/imt";

const usa = () => (
  <YStack ml="$2" p="$2" px="$3" bc="#ed3d4f" borderRadius="$10">
    <Text color="#FFFFFF" fow="bold">US election</Text>
  </YStack>
);

export const electionApp: AppType = {
  id: 'election',

  // AppScreen UI
  title: 'Democratic primaries',
  description: 'Prove you\'re an american citizen to confirm your vote',
  colorOfTheText: 'black',
  selectable: true,
  icon: Vote,
  tags: [usa()],

  // ProveScreen UI
  name: 'Democratic primaries',
  disclosureOptions: {
    nationality: "required",
  },

  // SendProofScreen UI before sending proof
  beforeSendText1: "You can now confirm your vote.",
  beforeSendText2: "",
  sendButtonText: 'Confirm my vote',
  sendingButtonText: 'Confirming...',

  // SendProofScreen UI after sending proof
  successTitle: 'Your vote is confirmed! 🎉',
  successText: ' ',

  successComponent: () => {
    return (<></>)
  },

  finalButtonAction: () => {
    Linking.openURL('https://vote.newamericanprimary.org/');
  },

  finalButtonText: 'Back to website',

  fields: [],

  scope: '3',
  circuit: "disclose",

  handleProve: async () => {
    const {
      update,
      disclosure,
      address,
      majority,
    } = useSbtStore.getState();

    const {
      toast,
      setStep,
    } = useNavigationStore.getState();

    const {
      secret,
      passportData
    } = useUserStore.getState();

    setStep(Steps.GENERATING_PROOF);

    const reveal_bitmap = revealBitmapFromMapping(disclosure);

    const response = await axios.get(COMMITMENT_TREE_TRACKER_URL)
    // const serializedCommitmentTree = "[[\"9366833337168993085050982292715343583458999801189875133285760454940954329736\",\"17067815450997614268337156469331439256078702232208444991806942459610897177755\",\"6218618977460894587557092460164616095207478656436068295742870309857616419830\",\"1009498555512750055176786258919772755314598234878788682229429740456064488924\",\"2317777252282411584898482846587421326341858131145081778162865818517424463113\",\"14350861400343175672772758664935358862843556622155842278173685659399974430673\"],[\"5757843324860707578753413472099376283217223062835733089254074659436006978958\",\"9384382887555344903988763589988369409408141218078864334664000402547342440893\",\"20714514634358291855499138323356766695315870633431415798546884765927810445680\"],[\"6444500081923737565029349850782686417529434309028817508928891238372057960879\",\"20714514634358291855499138323356766695315870633431415798546884765927810445680\"],[\"13949165376611379310020797746578693825960496340786495286952352659551479278661\"]]"
    console.log('response.data:', response.data);

    const imt = new LeanIMT(
      (a: bigint, b: bigint) => poseidon2([a, b]),
      []
    );

    imt.import(response.data);

    const vote = "01"

    try {
      const inputs = generateCircuitInputsDisclose(
        secret,
        PASSPORT_ATTESTATION_ID,
        passportData,
        imt as any,
        majority.toString().split(""),
        reveal_bitmap,
        electionApp.scope,
        vote,
      );

      console.log('inputs:', inputs);

      const start = Date.now();

      const proof = await generateProof(
        electionApp.circuit,
        inputs,
      );

      const end = Date.now();
      console.log('Total proof time from frontend:', end - start);
      amplitude.track('Proof generated', {
        status: 'success',
        duration_seconds: (end - start) / 1000
      });
      //amplitude.track('Proof generation successful, took ' + ((end - start) / 1000) + ' seconds');
      update({
        proof: proof,
        proofTime: end - start,
      });
      setStep(Steps.PROOF_GENERATED);
    } catch (error: any) {
      console.error(error);
      toast.show('Error', {
        message: error.message,
        customData: {
          type: "error",
        },
      })
      setStep(Steps.NEXT_SCREEN);
      //amplitude.track(error.message);
      amplitude.track('Proof generation failed', {
        status: 'failure',
      });
    }
  },

  handleSendProof: async () => {
    const {
      update,
      proof
    } = useSbtStore.getState();

    const {
      toast,
      setStep
    } = useNavigationStore.getState();

    if (!proof) {
      console.error('Proof is not generated');
      return;
    }

    setStep(Steps.PROOF_SENDING);

    toast.show('🚀', {
      message: "Sending proof...",
      customData: {
        type: "info",
      },
    })

    const url = "https://vote.newamericanprimary.org/"

    try {
      setStep(Steps.PROOF_SENT);
      // const serverResponse = await axios.post(url, {
      //   proof: proof,
      // });
      // console.log('serverResponse:', serverResponse);
      toast.show('🎊', {
        message: "Proof sent",
        customData: {
          type: "success",
        },
      })
      update({
        proofSentText: `Proof sent`
      });
    } catch (error: any) {
      setStep(Steps.PROOF_GENERATED);
      update({
        proofSentText: `Error sending Proof.`
      });
      toast.show('Error', {
        message: `Error: mint failed`,
        customData: {
          type: "error",
        },
      })
      if (error.isAxiosError && error.response) {
        const errorMessage = error.response.data.error;
        console.log('Server error message:', errorMessage);
      }
      amplitude.track(error.message);
    }
  }
}

export default electionApp;