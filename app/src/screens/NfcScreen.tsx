import React, { useState } from 'react';
import { YStack, Text, XStack, Button, ScrollView } from 'tamagui';
import { Nfc, X } from '@tamagui/lucide-icons';
import { borderColor, textColor1 } from '../utils/colors';
import { Carousel } from '../components/Carousel';
import US_PASSPORT from '../images/us-passport.png'
import REMOVE_CASE from '../images/remove_case.png'
import US_PASSPORT_LASTPAGE from '../images/passport_lastpage_graybg.png'
import US_PASSPORT_LASTPAGE_IOS from '../images/passport_lastpage_iphone.png'
import US_PASSPORT_LASTPAGE_ANDROID from '../images/passport_lastpage_android.png'
import PHONE_SCANBUTTON from "../images/phone_scanbutton.png"

import Dialog from "react-native-dialog";
import NfcManager from 'react-native-nfc-manager';
import { Platform, Linking, Dimensions } from 'react-native';

interface NfcScreenProps {
  handleNFCScan: () => void;
}

const NfcScreen: React.FC<NfcScreenProps> = ({ handleNFCScan }) => {
  const [isLastSlideReached, setIsLastSlideReached] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogMessage, setDialogMessage] = useState('');
  const [isNfcSupported, setIsNfcSupported] = useState(true);
  const carouselImages = [US_PASSPORT, REMOVE_CASE, US_PASSPORT_LASTPAGE, Platform.OS === 'ios' ? US_PASSPORT_LASTPAGE_IOS : US_PASSPORT_LASTPAGE_ANDROID, PHONE_SCANBUTTON,];
  const windowHeight = Dimensions.get('window').height;

  const handleSlideChange = (index: number) => {
    if (index === carouselImages.length - 1) {
      setIsLastSlideReached(true);
    }
  };

  const openNfcSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('App-Prefs:root=General&path=About');
    } else {
      Linking.sendIntent('android.settings.NFC_SETTINGS');
    }
    setDialogVisible(false);
  };

  const checkNfcSupport = async () => {
    const isSupported = await NfcManager.isSupported();
    if (isSupported) {
      const isEnabled = await NfcManager.isEnabled();
      if (!isEnabled) {
        setDialogMessage('NFC is not enabled. Would you like to enable it in settings?');
        setDialogVisible(true);
        setIsNfcSupported(true);
        return false;
      }
      return true;
    } else {
      setDialogMessage("Sorry, your device doesn't seem to have an NFC reader.");
      setDialogVisible(true);
      setIsNfcSupported(false);
      return false;
    }
  };

  const handleNfcScan = async () => {
    const nfcSupported = await checkNfcSupport();
    if (nfcSupported) {
      handleNFCScan();
    }
  };

  return (
    <ScrollView flex={1} contentContainerStyle={{ flexGrow: 1 }}>
      <YStack f={1} p="$3" >
        <Text fontSize="$8" fow="bold" mt="$1.5" mb="$3" color={textColor1} textAlign='center'>Verify your passport using NFC</Text>

        <Carousel
          images={carouselImages}
          height={windowHeight > 700 ? 300 : 270}
          width="100%"
          onSlideChange={handleSlideChange}
        />

        <XStack f={1} />

        {/* <YStack f={1} gap="$2">
          <YStack mt="$2">

            <YStack ml="$3" gap="$2" mt="$3">
              <XStack gap="$1">
                <Text fontSize="$5" color={textColor2}>1.</Text>
                <Text fontSize="$5" color={textColor2}>Open your passport to the photo page.</Text>
              </XStack>
              <XStack gap="$1">
                <Text fontSize="$5" color={textColor2}>2.</Text>
                <Text fontSize="$5" color={textColor2}>
                  {Platform.OS === "android"
                    ? "Press the center of your phone against the top page."
                    : "Press the top half of your phone against the top page, as in the image."
                  }
                </Text>
              </XStack>
              <XStack gap="$1">
                <Text fontSize="$5" color={textColor2}>3.</Text>
                <Text fontSize="$5" color={textColor2}>When device vibrates, hold still until scanning is complete.</Text>
              </XStack>
              <XStack gap="$1">
                <Text fontSize="$5" color={textColor2}>4.</Text>
                <Text fontSize="$5" color={textColor2}>If scanning fails to start, slowly move your phone around the open passport, keeping them pressed close together, until it vibrates and scanning starts. You may need to remove your case.</Text>
              </XStack>
            </YStack>

          </YStack>

        </YStack> */}

        <YStack mb="$6">
          {isLastSlideReached && (
            <Button
              borderWidth={1.3}
              borderColor={borderColor}
              borderRadius="$10"
              bg="#3185FC"
              onPress={handleNfcScan}
              gap="$1"
            >
              <Nfc color={textColor1} rotate="180deg" />
              <Text fontSize="$6" color={textColor1}>Start NFC Scan</Text>
              <Nfc color={textColor1} />
            </Button>
          )}
        </YStack>

        <Dialog.Container visible={dialogVisible}>
          <Dialog.Title>NFC Status</Dialog.Title>
          <Dialog.Description>
            {dialogMessage}
          </Dialog.Description>
          {isNfcSupported ? (
            <XStack>
              <XStack f={1} />
              <Dialog.Button label="Open Settings" onPress={openNfcSettings} />
            </XStack>
          ) : (
            <Dialog.Button label="OK" onPress={() => setDialogVisible(false)} />
          )}
        </Dialog.Container>
      </YStack>
    </ScrollView>
  );
};

export default NfcScreen;
