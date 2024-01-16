import React, {useState} from 'react';
import { YStack, Text,Spinner , Circle, ZStack, XStack } from 'tamagui'; // Ensure correct import paths based on your project setup
import { Steps } from '../utils/utils';

const ScanScreen = ({onStartCameraScan,nfcScan,step,setStep}) => {

    const [camerastep,setcamerastep] = useState("camera");
    const cameraPress = () => {
    setcamerastep("scan");
    onStartCameraScan();
  };

  return (
    <YStack mb="$5">
      <ZStack alignSelf='center' mb="$2" maxWidth={22} maxHeight={22} width={100} flex={1} space="$0">
        <Circle
          fullscreen
          padding="$2"
          borderColor="$color"
          borderWidth={1.6}
        />
        <Text
          borderColor="$color"
          y={1}
          x={7}
          fow="bold"
        >1</Text>
      </ZStack>

      <Text textAlign='center' px="$4" fow={step === Steps.MRZ_SCAN ?"bold":"normal" } >Scan the machine readable zone on the main page of your passport</Text>
      
      <ZStack alignSelf='center' mt="$8" mb="$2" maxWidth={22} maxHeight={22} width={100} flex={1} space="$0">
        <Circle
          fullscreen
          padding="$2"
          borderColor="$color"
          borderWidth={1.6}
        />
        <Text
          borderColor="$color"
          y={1}
          x={7}
          fow="bold"
        >2</Text>
      </ZStack>
      <Text textAlign='center' px="$4" fow={(step === Steps.MRZ_SCAN_COMPLETED) || (step === Steps.NFC_SCANNING)  ? "bold":"normal" }>Hold your passport against your device to read the biometric chip</Text>
      
      
      <ZStack alignSelf='center' mt="$8" mb="$2" maxWidth={22} maxHeight={22} width={100} flex={1} space="$0">
        <Circle
          fullscreen
          padding="$2"
          borderColor="$color"
          borderWidth={1.6}
        />
        <Text
          borderColor="$color"
          y={1}
          x={7}
          fow="bold"
        >3</Text>
      </ZStack>
      <Text textAlign='center' px="$4" fow={step >= Steps.NFC_SCAN_COMPLETED ? "bold":"normal" }>Generate ZK proof</Text>
      
      <YStack w="100%" ai="center">
      {
  step < Steps.NFC_SCAN_COMPLETED 
    ? (
        step < Steps.MRZ_SCAN_COMPLETED 
          ? <Text onPress={cameraPress} mt="$10" size="$4" br="$2" color="#3185FC">Open camera</Text>
          : (
              <YStack mt="$10">
                <Text mt="$4" size="$4" br="$2" color="#3185FC" onPress={nfcScan}>
                  {step === Steps.NFC_SCANNING ? "Scanning" : "Scan passport with NFC"}
                </Text>
                <Spinner mt="$4" color={step === Steps.NFC_SCANNING ? "#3185FC" : "transparent"} />
              </YStack>
            )
      )
    : <XStack/>
}

      </YStack>
    </YStack>
  );
};

export default ScanScreen;
