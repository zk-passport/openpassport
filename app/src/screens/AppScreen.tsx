import React from 'react';
import { Button, Image, ScrollView, Text, XStack, YStack } from 'tamagui';
import CERTIFICATE from '../images/certificate.png'
import { Linking, Platform } from 'react-native';
import { textColor1, textColor2 } from '../utils/colors';
import { Link } from '@tamagui/lucide-icons';
import useUserStore from '../stores/userStore';

const AppScreen: React.FC = () => {
  const {
    localProof,
    dscCertificate,
  } = useUserStore();

  const sendProof = () => {
    const payload = JSON.stringify({ localProof, dscCertificate });
    console.log(payload);
    const url = `https://vote.newamericanprimary.org/verify/?proof=${encodeURIComponent(payload)}`;
    // const url = `http://192.168.1.35:3000/verify/?proof=${encodeURIComponent(payload)}`;
    Linking.openURL(url);
  }

  return (
    // <ScrollView flex={1} contentContainerStyle={{ flexGrow: 1 }}>
    <YStack px="$4" f={1} mb={Platform.OS === 'ios' ? "$5" : "$0"} >
      <YStack alignSelf='center' my="$8">
        <Image
          w={195}
          h={176}
          borderRadius={"$6"}
          resizeMode="contain"
          source={{
            uri: CERTIFICATE,
          }}

        />
      </YStack>
      <Text color={textColor1} fontSize="$9" my="$3" textAlign='center' fontWeight="bold">
        Citizenship certificate generated!
      </Text>
      <Text color={textColor2} fontSize="$7" my="$1" textAlign='center'>
        🗳️ You can now confirm your vote.
      </Text>
      <XStack f={1} />

      <Button
        mt="$8"
        alignSelf='center'
        onPress={sendProof}
        borderWidth={1.3}
        borderRadius="$10"
        bg={"#3185FC"}
        mb="$6"
        w="100%"
      >
        <Link color="white" size={26} />
        <Text color={textColor1} fontSize="$6">
          Back to website
        </Text>
      </Button>
    </YStack>
    // </ScrollView>

  );
}

export default AppScreen;
