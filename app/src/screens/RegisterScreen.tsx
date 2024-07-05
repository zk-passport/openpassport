import React, { useState } from 'react';
import { YStack, XStack, Text, Button, Spinner, Image, Progress, ScrollView } from 'tamagui';
import { borderColor, textColor1, textColor2 } from '../utils/colors';
import { Platform } from 'react-native';
import useUserStore from '../stores/userStore';
import useNavigationStore from '../stores/navigationStore';
import USA from '../images/usa.png'

const RegisterScreen: React.FC = () => {
  const [registering, setRegistering] = useState(false);
  const [registerStep, setRegisterStep] = useState<string | null>(null);

  const { isZkeyDownloading, zkeyDownloadProgress } = useNavigationStore();

  const handleRegister = async () => {
    setRegistering(true);
    setRegisterStep("Generating certificate...");
    await new Promise((resolve) => setTimeout(resolve, 10));
    useUserStore.getState().doProof();
  }

  const buttonTextColor = (registering || isZkeyDownloading.register_sha256WithRSAEncryption_65537)
    ? '#3185FC'  // Use the button's background color for contrast
    : textColor1;

  return (
    <ScrollView flex={1}>
      <YStack px="$4" f={1} mb={Platform.OS === 'ios' ? "$5" : "$0"} minHeight="100%">
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
            borderWidth={1.3}
            borderColor={borderColor}
            borderRadius="$10"
            bg={(registering || isZkeyDownloading.register_sha256WithRSAEncryption_65537) ? "white" : "#3185FC"}
            mb="$6"
            w="100%"
          >
            <XStack gap="$3">
              {(registering || isZkeyDownloading.register_sha256WithRSAEncryption_65537) && <Spinner color={buttonTextColor} size="small" />}
              <Text color={buttonTextColor} fontSize="$5">
                {
                  isZkeyDownloading.register_sha256WithRSAEncryption_65537
                    ? "Preparing certification..."
                    : (registerStep || "Generate certificate")}
              </Text>
            </XStack>
          </Button>
          {isZkeyDownloading.register_sha256WithRSAEncryption_65537 && (
            <YStack w="100%" alignItems="center">
              <Progress value={zkeyDownloadProgress.register_sha256WithRSAEncryption_65537 * 100} w="100%">
                <Progress.Indicator />
              </Progress>
              <Text fontSize="$3" color={textColor2} mt="$2">
                {`Downloading: ${Math.round(zkeyDownloadProgress.register_sha256WithRSAEncryption_65537 * 100)}%`}
              </Text>
            </YStack>
          )}
          <Text
            fontSize={10}
            color={registering ? "#a0a0a0" : "#161616"}
            py="$2"
            alignSelf='center'
          >
            This operation can take up to 20s, phone may freeze during this time
          </Text>
        </YStack>
      </YStack>
    </ScrollView>
  );
};

export default RegisterScreen;