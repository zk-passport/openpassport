import React from 'react';
import { YStack, Text, XStack, Button, Image, ScrollView } from 'tamagui';
import { Nfc } from '@tamagui/lucide-icons';
import { blueColorDark, blueColorLight, borderColor, componentBgColor2, greenColorDark, greenColorLight, redColorDark, redColorLight, textColor1, textColor2 } from '../utils/colors';
import NFCHelp from '../images/nfc_help.png'
import { Platform } from 'react-native';

interface NfcScreenProps {
  handleNFCScan: () => void;
}

const NfcScreen: React.FC<NfcScreenProps> = ({ handleNFCScan }) => {
  return (
    <ScrollView flex={1} contentContainerStyle={{ flexGrow: 1 }}>
      <YStack f={1} p="$3" space="$4">
        <Image borderRadius="$5"
          alignSelf='center'
          resizeMode="contain"
          w="$12"
          h="$14"
          source={{ uri: NFCHelp }}
        />

        <YStack f={1} gap="$2">
          <YStack mt="$2">
            <Text fontSize="$7" fow="bold" mt="$1" color={textColor1}>Scan the NFC chip in your passport</Text>
            <Text fontSize="$6" color={textColor1} mt="$2">How do I find and scan the NFC chip?</Text>
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

        </YStack>

        <YStack gap="$2" mb="$6">
          <Button borderWidth={1.3} borderColor={borderColor} borderRadius="$10" bg="#3185FC" onPress={handleNFCScan}>
            <Nfc color={textColor1}/>
            <Text color="white" fontSize="$7">Start NFC scan</Text>
          </Button>
        </YStack>

      </YStack>
    </ScrollView>
  );
};

export default NfcScreen;
