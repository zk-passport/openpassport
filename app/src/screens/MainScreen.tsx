import React, { useState} from 'react';
import { YStack, XStack, Text, Button } from 'tamagui';
import { SizableText, Tabs, H5, styled } from 'tamagui'
import { BadgeInfo , Scan, UserCheck} from '@tamagui/lucide-icons'; 
import { ThemeableStack } from 'tamagui' // or '@tamagui/stacks'

import ScanScreen from './ScanScreen';
import ProveScreen from './ProveScreen';
import { Steps } from '../utils/utils';

const MainScreen = (
    {onStartCameraScan,
    nfcScan,
    passportData,
    disclosure,
    handleDisclosureChange,
    address,
    setAddress,
    generatingProof,
    handleProve,step,mintText ,proof,proofTime,handleMint,totalTime,setStep}
) => {
  // placeholder function for button press
  const [selectedTab, setSelectedTab] = useState("scan");
  const handleOpenCamera = () => {
    console.log('Camera button pressed');
    // your camera opening logic goes here
  };

  const MyCard = styled(ThemeableStack, {
    hoverTheme: true,
    pressTheme: true,
    focusTheme: true,
    elevate: true
  })

  return (
    <YStack f={1} ai="center" jc="space-between" bc="#fff">
        
        <YStack w="100%">
        <XStack w="100%" jc="space-between" ai="center" ph="$4" pv="$2" bc="#fff" p="$3">
            <XStack></XStack>
            <Text>{selectedTab==="scan"?"Scan":"Prove"}</Text>
            <BadgeInfo />
        </XStack>
        <YStack  w="100%" h={2} backgroundColor="#DCDCDC" opacity={0.16}></YStack>
        </YStack>


        <Tabs f={1} defaultValue="scan" orientation='horizontal' dir='ltr' shadowColor="black" onValueChange={(newValue) => setSelectedTab(newValue)}>
            <YStack f={1} ai="center"  jc="space-between" >
                <XStack/>

                <Tabs.Content value="scan">
                    <ScanScreen
                      onStartCameraScan={onStartCameraScan}
                      nfcScan = {nfcScan}
                      step={step}
                      setStep = {setStep}/>
                </Tabs.Content>
                <Tabs.Content value="generate">
                <ProveScreen
                    passportData={passportData}
                    disclosure={disclosure}
                    handleDisclosureChange={handleDisclosureChange}
                    address={address}
                    setAddress={setAddress}
                    generatingProof={generatingProof}
                    handleProve={handleProve}
                    step={step}
                    mintText={mintText}
                    proof={proof}
                    proofTime={proofTime}
                    handleMint={handleMint}
                    totalTime={totalTime}
                    setStep = {setStep}
                    />
                 </Tabs.Content>
                
                <YStack w="100%" backgroundColor="white">
                <YStack  w="100%" h={2} backgroundColor="#DCDCDC" opacity={0.16}></YStack>
                <Tabs.List w="100%" pt="$4" pb="$3">
                    <Tabs.Tab unstyled value="scan" w="50%" backgroundColor="transparent" >
                        <YStack ai="center">
                            <Scan color={selectedTab=== "scan"? '#3185FC' : 'black'} /> 
                            <SizableText color={selectedTab=== "scan"? '#3185FC' : 'black'}>Scan</SizableText>
                        </YStack>
                    </Tabs.Tab>
                    {step < Steps.NFC_SCAN_COMPLETED ?
                                    <Tabs.Tab unstyled value="scan" w="50%" backgroundColor="transparent">
                                        <YStack ai="center">
                                            <UserCheck  color="gray"/> 
                                            <SizableText color="gray">Prove</SizableText>
                                        </YStack>
                                    </Tabs.Tab>
                                    :
                                    <Tabs.Tab unstyled value="generate" w="50%" backgroundColor="transparent">
                                    <YStack ai="center">
                                        <UserCheck  color={selectedTab=== "generate"? '#3185FC' : 'black'}/> 
                                        <SizableText color={selectedTab=== "generate"? '#3185FC' : 'black'}>Prove</SizableText>
                                    </YStack>
                                </Tabs.Tab>
                    }
                </Tabs.List>
                </YStack>
            </YStack>
        </Tabs>      
    </YStack>
  );
};

export default MainScreen;
