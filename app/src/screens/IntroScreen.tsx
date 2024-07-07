import React, { useState } from 'react';
import { YStack, XStack, Text, Button, Image, Fieldset, Input, ScrollView } from 'tamagui';
import { Eraser, Info, Lock, X } from '@tamagui/lucide-icons';
import NFC from '../images/nfc_icon.png'
import { borderColor, componentBgColor, textColor1, textColor2 } from '../utils/colors';
import { Dimensions } from 'react-native';
import { Steps } from '../utils/utils';
import useNavigationStore from '../stores/navigationStore';
import useUserStore from '../stores/userStore';

const IntroScreen = () => {
  const { setStep, toast } = useNavigationStore()
  const { sivUserID, update } = useUserStore()

  const [input, setInput] = useState("");
  // check window dimension
  const windowHeight = Dimensions.get('window').height;
  return (
    // <ScrollView h="100%" bg="red" >
    <YStack f={1} px="$4" >
      <YStack flex={1} mx="$2" gap="$5">
        <YStack alignSelf='center' mt="$6" mb="$2">
          <Image
            w={171}
            h={105}
            source={{
              uri: NFC,
            }}
          />
        </YStack>
        <Text color={textColor1} fontSize={36} textAlign='center' fontWeight="bold">
          Proof of Passport
        </Text>
        {sivUserID
          ? <YStack>
            <Text color={textColor1} fontSize="$6" textAlign='center'>This app allows 3rd parties to securely confirm your citizenship</Text>
            <Text color={textColor2} fontSize="$6" textAlign='center' mt="$2">No other passport data ever leaves your device: not name, id number, DOB, or picture</Text>
          </YStack>
          : <YStack>
            <Text color={textColor1} fontSize="$7" textAlign='center'>No election has been selected</Text>
            <Text color={textColor2} fontSize="$6" textAlign='center' mt="$2">Please go back to the website which sent you here and input the voter code</Text>
          </YStack>

        }

        {sivUserID
          ? <XStack alignItems='center' bg={componentBgColor} borderRadius={100} borderWidth={1} borderColor={borderColor} py="$2.5" px="$3">
            <Info alignSelf='center' size={24} color={textColor1} />
            <Text ml="$3" pr="$6" fontSize="$5" color={textColor1}>Retrieve your passport then press begin</Text>
          </XStack>
          : <XStack>
            <Input
              color={"#000000"}
              h="$5"
              flex={1}
              id="sivUserID"
              onChangeText={(text: string) => {
                setInput(text)
              }}
              value={input}
              keyboardType="default"
              placeholder='Enter voter code here'
            />
          </XStack>
        }
        <XStack f={1} />
        {sivUserID
          ? <Button
            alignSelf='center'
            onPress={() => setStep(Steps.MRZ_SCAN)}
            borderWidth={1.3} borderColor={borderColor} borderRadius="$10" bg="#3185FC"
            w="100%"
            mb="$4"
          >
            <Lock color="white" /><Text color="white" fontSize="$7">Begin</Text>
          </Button>
          : <Button
            width="100%"
            alignSelf='center'
            mb="$4"
            onPress={() => {
              if (isNaN(Number(input))) {
                toast.show('Please enter a valid number', {
                  customData: {
                    type: "error",
                  },
                });
                return;
              }

              update({ sivUserID: input })
            }}
            borderWidth={1.3} borderColor={borderColor} borderRadius="$10" bg="#3185FC"
          >
            <Text color="white" fontSize="$7">Submit</Text>
          </Button>
        }
        {windowHeight > 700 && <XStack h="$0" />}
      </YStack>
    </YStack>
    // </ScrollView>
  );
};

export default IntroScreen;