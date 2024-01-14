import React, {useState} from 'react';
import { YStack, Text } from 'tamagui'; // Ensure correct import paths based on your project setup

const ScanScreen = ({onStartCameraScan,nfcScan}) => {

    const [step,setStep] = useState("camera");
    const cameraPress = () => {
    setStep("scan");
    onStartCameraScan();
  };

  return (
    <YStack mb="$5">
      <Text textAlign='center' fow="bold">1</Text>
      <Text textAlign='center'>Scan the machine readable zone on the main page of your passport</Text>
      <Text textAlign='center' fow="bold" mt="$6">2</Text>
      <Text textAlign='center'>Hold your passport against your device to read the biometric chip</Text>
      <YStack w="100%" ai="center">
        <Text onPress={cameraPress} mt="$6" size="$4" br="$2" color="blue">Open camera</Text>
        {step==="camera"?
        <Text mt="$4" size="$4" br="$2" color="transparent" >Scan passport with NFC</Text>
        :
        <Text mt="$4" size="$4" br="$2" color="blue" onPress={nfcScan}>Scan passport with NFC</Text>
        }
      </YStack>
    </YStack>
  );
};

export default ScanScreen;
