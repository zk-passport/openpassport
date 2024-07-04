import React from 'react';
import { YStack, XStack, Text, Button, Image } from 'tamagui';
import { Info } from '@tamagui/lucide-icons';
import NFC from '../images/nfc_icon.png'
import { borderColor, componentBgColor, textColor1, textColor2 } from '../utils/colors';
import { Platform } from 'react-native';
import { Steps } from '../utils/utils';
import useNavigationStore from '../stores/navigationStore';
import { Lock } from '@tamagui/lucide-icons';

const IntroScreen: React.FC = () => {
  const { setStep } = useNavigationStore()

  return (
    <YStack px="$4" f={1} mb={Platform.OS === 'ios' ? "$5" : "$0"}>
      <YStack flex={1} mx="$2" gap="$5">
        <YStack alignSelf='center' my="$8">
          <Image
            w={171}
            h={105}
            source={{
              uri: NFC,
            }}
          />
        </YStack>
        <Text color={textColor1} fontSize="$9" my="$3" textAlign='center' fontWeight="bold">
          Proof of Passport
        </Text>
        <Text color={textColor2} fontSize="$6" my="$1" textAlign='center'>
          This app allows 3rd parties to securely confirm your citizenship. No other passport data ever leaves your device: not name, id number, DOB, or picture.
        </Text>

        <YStack f={1} />

        <XStack alignItems='center' mt="$6" bg={componentBgColor} borderRadius={100} borderWidth={1} borderColor={borderColor} py="$2.5" px="$3">
          <Info alignSelf='center' size={24} color={textColor1} />
          <Text ml="$3" pr="$6" fontSize="$5" color={textColor1}>Retrieve your passport then press begin</Text>
        </XStack>
        <Button
          mt="$4"
          alignSelf='center'
          onPress={() => setStep(Steps.MRZ_SCAN)}
          borderWidth={1.3} borderColor={borderColor} borderRadius="$10" bg="#3185FC"
          mb="$12"
          w="50%"
        >
          <Lock color="white"/><Text color="white" fontSize="$8">Begin</Text>
        </Button>
      </YStack >
    </YStack >
  );
};

export default IntroScreen;