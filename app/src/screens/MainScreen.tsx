import React, { useState} from 'react';
import { YStack, XStack, Text, Button } from 'tamagui';
import { SizableText, Tabs, H5, styled } from 'tamagui'
import CircleText from '../components/CircleText';
import { ChevronLeft, BadgeInfo , Scan, UserCheck} from '@tamagui/lucide-icons'; 
import ScanScreen from './ScanScreen';
import ProveScreen from './ProveScreen';

const MainScreen = (
    {onStartCameraScan,
    nfcScan,
passportData,
disclosure,
handleDisclosureChange,
address,
setAddress,
generatingProof}
) => {
  // placeholder function for button press
  const [selectedTab, setSelectedTab] = useState("scan");
  const handleOpenCamera = () => {
    console.log('Camera button pressed');
    // your camera opening logic goes here
  };
  return (
    <YStack f={1} ai="center" jc="space-between" p="$4" bc="#fff">
        <XStack w="100%" jc="space-between" ai="center" ph="$4" pv="$2" bc="#fff">
            <XStack></XStack>
            <Text>{selectedTab==="scan"?"Scan":"Prove"}</Text>
            <BadgeInfo />
        </XStack>


        <Tabs f={1} defaultValue="scan" orientation='horizontal' dir='ltr' shadowColor="black" onValueChange={(newValue) => setSelectedTab(newValue)}>
            <YStack f={1} ai="center"  jc="space-between" >
                <XStack/>

                <Tabs.Content value="scan">
                    <ScanScreen
                      onStartCameraScan={onStartCameraScan}
                      nfcScan = {nfcScan}/>
                </Tabs.Content>
                <Tabs.Content value="generate">
                <ProveScreen
        passportData={passportData}
        disclosure={disclosure}
        handleDisclosureChange={handleDisclosureChange}
        address={address}
        setAddress={setAddress}
        generatingProof={generatingProof}
      />                </Tabs.Content>

                <Tabs.List>
                    <Tabs.Tab unstyled value="scan" w="50%" backgroundColor="transparent" >
                        <YStack ai="center">
                            <Scan color={selectedTab=== "scan"? 'blue' : 'black'} /> 
                            <SizableText color={selectedTab=== "scan"? 'blue' : 'black'}>Scan</SizableText>
                        </YStack>
                    </Tabs.Tab>

                    <Tabs.Tab unstyled value="generate" w="50%" backgroundColor="transparent">
                        <YStack ai="center">
                            <UserCheck  color={selectedTab=== "generate"? 'blue' : 'black'}/> 
                            <SizableText color={selectedTab=== "generate"? 'blue' : 'black'}>Prove</SizableText>
                        </YStack>
                    </Tabs.Tab>
                </Tabs.List>
            </YStack>
        </Tabs>      
    </YStack>
  );
};

export default MainScreen;
