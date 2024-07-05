import React, { useState } from 'react';
import { YStack, XStack, Text, Button, Image, Fieldset, Input, ScrollView } from 'tamagui';
import { Eraser, Info, Lock } from '@tamagui/lucide-icons';
import NFC from '../images/nfc_icon.png'
import { borderColor, componentBgColor, textColor1, textColor2 } from '../utils/colors';
import { Platform } from 'react-native';
import { Steps } from '../utils/utils';
import useNavigationStore from '../stores/navigationStore';
import useUserStore from '../stores/userStore';

const IntroScreen = () => {
  const { setStep, toast } = useNavigationStore()
  const { sivUserID, update } = useUserStore()

  const [input, setInput] = useState("");

  return (
    <ScrollView flex={1}>
      <YStack px="$4" f={1} mb="$4" minHeight="100%">
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
            {sivUserID
              ? "This app allows 3rd parties to securely confirm your citizenship. No other passport data ever leaves your device: not name, id number, DOB, or picture."
              : "No election has been selected. Please go back to the website which sent you here and input the voter code:"
            }
          </Text>

          {sivUserID
            ? <XStack alignItems='center' mt="$6" bg={componentBgColor} borderRadius={100} borderWidth={1} borderColor={borderColor} py="$2.5" px="$3">
                <Info alignSelf='center' size={24} color={textColor1} />
                <Text ml="$3" pr="$6" fontSize="$5" color={textColor1}>Retrieve your passport then press begin</Text>
              </XStack>
            : <Fieldset gap="$0" horizontal>
                <Input
                  color={"#000000"}
                  h="$5"
                  flex={1}
                  id="sivUserID"
                  onChangeText={(text: any) => {
                    setInput(text)
                  }}
                  value={input}
                  keyboardType="default"
                />
              </Fieldset>
          }
          {sivUserID
            ? <Button
                alignSelf='center'
                onPress={() => setStep(Steps.MRZ_SCAN)}
                borderWidth={1.3} borderColor={borderColor} borderRadius="$10" bg="#3185FC"
                w="50%"
              >
                <Lock color="white"/><Text color="white" fontSize="$8">Begin</Text>
              </Button>
            : <Button
                alignSelf='center'
                onPress={() => {
                  if (isNaN(Number(input))) {
                    toast.show('Please enter a valid number', {
                      customData: {
                        type: "error",
                      },
                    });
                    return;
                  }

                  update({sivUserID: input})
                }}
                borderWidth={1.3} borderColor={borderColor} borderRadius="$10" bg="#3185FC"
                w="50%"
              >
                <Text color="white" fontSize="$8">Submit</Text>
              </Button>
          }
        </YStack>
      </YStack>
    </ScrollView>
  );
};

export default IntroScreen;