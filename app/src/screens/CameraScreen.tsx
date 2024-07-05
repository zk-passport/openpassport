import React from 'react';
import { YStack, Button, Image, Text, ScrollView, XStack } from 'tamagui';
import { Camera, SquarePen, X } from '@tamagui/lucide-icons';
import { bgColor, borderColor, textColor1, textColor2 } from '../utils/colors';
import SCANHelp from '../images/scan_help.png'
import { startCameraScan } from '../utils/cameraScanner';

interface CameraScreenProps {
  sheetIsOpen: boolean
  setSheetIsOpen: (value: boolean) => void
}

const CameraScreen: React.FC<CameraScreenProps> = ({ sheetIsOpen, setSheetIsOpen }) => {
  return (
    <YStack f={1} p="$3">
      <Text ml="$2" mt="$7" color={textColor1} fontSize="$10" fontWeight="bold">
        Scan
      </Text>
      <Text ml="$2" mt="$6" fontSize="$8" color={textColor1}>Scan or type your passport ID</Text>
      <Text ml="$2" mt="$4" fontSize="$5" color={textColor2}>This image will not be saved.</Text>
      <Text ml="$2" mt="$0.5" fontSize="$5" color={textColor2}>The information never leaves your device.</Text>

      <YStack f={1} jc="center" mt="$5">
        <Image borderRadius="$5"
          w="full"
          h="$13"
          source={{ uri: SCANHelp }}
        />
        <XStack f={1} />
        <YStack gap="$2" my="$6">
          <Button borderWidth={1.3} borderColor={borderColor} borderRadius="$10" bg="#3185FC" onPress={startCameraScan}><Camera color={textColor1} size={30} /></Button>
          <Button bg={textColor2} borderColor={borderColor} borderRadius="$10" onPress={() => setSheetIsOpen(true)}><SquarePen size={30} /></Button>
        </YStack>
      </YStack>
    </YStack>
  );
};

export default CameraScreen;
