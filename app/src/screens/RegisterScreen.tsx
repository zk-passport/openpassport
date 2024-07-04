import React, { useState } from 'react';
import { YStack, XStack, Text, Button, Spinner, Image } from 'tamagui';
import { borderColor, textColor1, textColor2 } from '../utils/colors';
import { Platform } from 'react-native';
import useUserStore from '../stores/userStore';
import useNavigationStore from '../stores/navigationStore';
import USA from '../images/certificate.png'

const RegisterScreen: React.FC = () => {

  const [registering, setRegistering] = useState(false);
  const [registerStep, setRegisterStep] = useState<string | null>(null);

  const { isZkeyDownloading } = useNavigationStore.getState();

  const handleRegister = async () => {
    setRegistering(true);
    useUserStore.getState().registerCommitment();
    setRegisterStep("Generating certificate...");
  }

  return (
    <YStack px="$4" f={1} mb={Platform.OS === 'ios' ? "$5" : "$0"}>
      <YStack flex={1} mx="$2" gap="$2">
        <YStack alignSelf='center' my="$8">
          <Image
            w={320}
            h={190}
            borderRadius={"$6"}
            source={{
              uri: USA,
            }}
          />
        </YStack>
        <Text color={textColor1} fontSize="$8" my="$1" textAlign='center' fontWeight="bold">
          Generate certificate of US citizenship
        </Text>
        <Text color={textColor2} fontSize="$6" my="$1" textAlign='center'>
          This certificate can be taken outside this app to prove you are a US citizen, without revealing your name, age, or anything else.
        </Text>

        <Button
          disabled={isZkeyDownloading.register_sha256WithRSAEncryption_65537}
          mt="$8"
          alignSelf='center'
          onPress={handleRegister}
          borderWidth={1.3} borderColor={borderColor} borderRadius="$10" bg={isZkeyDownloading.register_sha256WithRSAEncryption_65537 ? "gray" : "#3185FC"}
          mb="$6"
          w="100%"
        >
          <XStack gap="$3">
            {(registering || isZkeyDownloading.register_sha256WithRSAEncryption_65537) && <Spinner color="white" size="small" />}
            <Text color={textColor1} fontSize="$5" >
              {
                isZkeyDownloading.register_sha256WithRSAEncryption_65537
                  ? "Preparing certification..."
                  : (registerStep || "Generate certificate")}
            </Text>
          </XStack>
        </Button>
      </YStack >
    </YStack >
  );
};

export default RegisterScreen;