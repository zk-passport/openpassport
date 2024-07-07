import React, { useState } from 'react';
import { YStack, Text, XStack, Button, ScrollView } from 'tamagui';
import { Nfc } from '@tamagui/lucide-icons';
import { blueColorDark, blueColorLight, borderColor, componentBgColor2, greenColorDark, greenColorLight, redColorDark, redColorLight, textColor1, textColor2 } from '../utils/colors';
import { Platform } from 'react-native';
import { Carousel } from '../components/Carousel';
import NFCHelp from '../images/nfc_help.png'
import PASSPORT from '../images/passportphotopage.png'
import BLACK_SQUARE from '../images/blacksquarepng.png'
import PHONE_ON_PASSPORT from '../images/passportphotopage2_2.png'
import PHONE_ON_PASSPORT_2 from '../images/passportphotopage3.png'
import US_PASSPORT from '../images/us-passport.png'

interface NfcScreenProps {
  handleNFCScan: () => void;
}

const NfcScreen: React.FC<NfcScreenProps> = ({ handleNFCScan }) => {
  const [isLastSlideReached, setIsLastSlideReached] = useState(false);
  const carouselImages = [US_PASSPORT, PASSPORT, PHONE_ON_PASSPORT, PHONE_ON_PASSPORT_2,]; // Add actual images as needed

  const handleSlideChange = (index: number) => {
    if (index === carouselImages.length - 1) {
      setIsLastSlideReached(true);
    }
  };

  return (
    <ScrollView flex={1} contentContainerStyle={{ flexGrow: 1 }}>
      <YStack f={1} p="$3" space="$4">
        <Text fontSize="$8" fow="bold" mt="$1.5" mb="$1" color={textColor1} textAlign='center'>Verify your passport using NFC</Text>

        <Carousel
          images={carouselImages}
          height={300}
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
              onPress={handleNFCScan}
              gap="$1"
            >
              <Nfc color={textColor1} rotate="180deg" />
              <Text fontSize="$6" color={textColor1}>Start scanning</Text>
              <Nfc color={textColor1} />

            </Button>
          )}
        </YStack>

      </YStack>
    </ScrollView >
  );
};

export default NfcScreen;
