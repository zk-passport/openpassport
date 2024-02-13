import React, { useState, useEffect } from 'react';
import { YStack, XStack, Text, Checkbox, Input, Button, Spinner, Image } from 'tamagui';
import { Check, LayoutGrid, Scan } from '@tamagui/lucide-icons';
import { getFirstName, formatDuration } from '../../utils/utils';
import { attributeToPosition } from '../../../common/src/constants/constants';
import { Steps } from '../utils/utils';
import USER from '../images/user.png'
import ProofGrid from '../components/ProofGrid';
import { App } from '../utils/AppClass';
import { Keyboard } from 'react-native';

interface ProveScreenProps {
  selectedApp: App | null;
  passportData: any;
  disclosure: { [key: string]: boolean };
  handleDisclosureChange: (field: string) => void;
  address: string;
  setAddress: (address: string) => void;
  generatingProof: boolean;
  handleProve: () => void;
  handleMint: () => void;
  step: number;
  mintText: string;
  proof: { proof: string, inputs: string } | null;
  proofTime: number;
  hideData: boolean;
}

const ProveScreen: React.FC<ProveScreenProps> = ({
  passportData,
  disclosure,
  selectedApp,
  handleDisclosureChange,
  address,
  setAddress,
  generatingProof,
  handleProve,
  step,
  mintText,
  proof,
  proofTime,
  handleMint,
  hideData
}) => {
  const maskString = (input: string): string => {
    return '*'.repeat(input.length);
  }


  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);


  return (
    <YStack px="$4" f={1}>
      {(step >= Steps.NFC_SCAN_COMPLETED && selectedApp != null) ?
        (step < Steps.PROOF_GENERATED ? (
          <YStack flex={1} m="$2" gap="$2">
            <XStack flex={1} />
            <YStack alignSelf='center'>
              <Image
                w="$12"
                h="$12"
                borderRadius="$10"
                source={{
                  uri: USER
                }}
              />
            </YStack>
            <XStack f={1} />

            <Text mt="$8" fontWeight="bold">Hi {hideData ? maskString(getFirstName(passportData.mrz)) : getFirstName(passportData.mrz)},</Text>
            <Text mt="$2">Enter your address or ens:</Text>
            <Input
              fontSize={13}
              mt="$3"
              placeholder="Your Address or ens name"
              value={address}
              onChangeText={setAddress}
            />
            <YStack mt="$6" f={1}>
              <Text h="$3">{selectedApp?.disclosurephrase}</Text>
              <YStack mt="$1">
                {selectedApp && Object.keys(selectedApp.disclosure).map((key) => {
                  const key_ = key as string;
                  const indexes = attributeToPosition[key_];
                  const keyFormatted = key_.replace(/_/g, ' ').split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                  const mrzAttribute = passportData.mrz.slice(indexes[0], indexes[1]);
                  const mrzAttributeFormatted = mrzAttribute.replace(/</g, ' ');

                  return (
                    <XStack key={key} m="$2" gap="$4">
                      <Checkbox
                        value={key}
                        checked={disclosure[key_]}
                        onCheckedChange={() => handleDisclosureChange(key_)}
                        aria-label={keyFormatted}
                        size="$5"
                      >
                        <Checkbox.Indicator >
                          <Check />
                        </Checkbox.Indicator>
                      </Checkbox>
                      <Text fontWeight="bold">{keyFormatted}: </Text>
                      <Text>{hideData ? maskString(mrzAttributeFormatted) : mrzAttributeFormatted}</Text>
                    </XStack>
                  );
                })}
              </YStack>
            </YStack>
            <XStack f={1} />
            <XStack f={1} />
            <XStack f={1} />
            <Button borderRadius={100} onPress={handleProve} mt="$8" backgroundColor="#3185FC" alignSelf='center' >
              {generatingProof ? (
                <XStack ai="center">
                  <Spinner />
                  <Text color="white" marginLeft="$2" fow="bold" >Generating ZK proof</Text>
                </XStack>
              ) : (
                <Text color="white" fow="bold">Generate ZK proof</Text>
              )}
            </Button>
            <Text fontSize={10} color={generatingProof ? "gray" : "white"} alignSelf='center'>This operation can take up to 2 mn</Text>
            <Text fontSize={9} color={generatingProof ? "gray" : "white"} pb="$2" alignSelf='center'>The application may freeze during this time (hard work)</Text>
          </YStack>
        ) : (
          <YStack flex={1} m="$2" justifyContent='center' alignItems='center' gap="$5">
            <XStack flex={1} />
            <ProofGrid proof={proof} />

            <YStack>
              <Text fontWeight="bold" fontSize="$6" mt="$6">Congrats 🎉</Text>
              <Text fontWeight="bold" fontSize="$5">You just generated this Zero Knowledge proof !</Text>
              <Text color="gray" fontSize="$5" mt="$1" fow="bold" textAlign='left'>You can now share this proof with the selected app.</Text>

              <Text color="gray" mt="$3">Proof generation duration: {formatDuration(proofTime)}</Text>

            </YStack>

            <XStack flex={1} />



            {mintText && <Text color="gray">{mintText}</Text>}

            <Button borderRadius={100} onPress={handleMint} marginTop="$4" mb="$8" backgroundColor="#3185FC">
              <Text color="white" fow="bold" >{selectedApp?.mintphrase}</Text>
            </Button>

          </YStack>
        )
        ) :
        (
          <YStack flex={1} justifyContent='center' alignItems='center'>
            <Text fontSize={17} textAlign='center' fow="bold">Please scan your passport and select an app to generate ZK proof</Text>
            <XStack mt="$8" gap="$7">
              <Scan size="$4" color={step < Steps.NFC_SCAN_COMPLETED ? "black" : "#3185FC"} />
              <LayoutGrid size="$4" color={selectedApp == null ? "black" : "#3185FC"} />
            </XStack>
          </YStack>

        )
      }
    </YStack >
  );
};
export default ProveScreen;     