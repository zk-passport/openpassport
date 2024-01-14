import React from 'react';
import { 
  Checkbox, 
  Text, 
  Input, 
  Button, 
  Spinner, 
  YStack, // Tamagui's version of View with flex direction column
  XStack, // for row layout 
  Theme, // for accessing theme values
  useTheme
} from 'tamagui';
import { getFirstName } from '../../utils/utils';
import { 
  SafeAreaView, 
  ScrollView, 
  StatusBar, 
  StyleSheet, 
  useColorScheme, 
  NativeModules, 
  DeviceEventEmitter, 
  TextInput 
} from 'react-native';

const ProveScreen = ({
  passportData,
  disclosure,
  handleDisclosureChange,
  address,
  setAddress,
  generatingProof,
}) => {
  const { space } = useTheme(); // for margins and padding

  return (
    <YStack space="$4" padding="$4">
      <Text size="$4" fontWeight="bold" textAlign="center">
        Hi {getFirstName(passportData.mrz)}
      </Text>
      <YStack space="$2">
        <Text>Signature algorithm: {passportData.signatureAlgorithm}</Text>
        <Text>What do you want to disclose?</Text>
        {Object.keys(disclosure).map((key) => {
          // ... your logic for mapping disclosure keys
          return (
            <XStack key={key} space="$2" width="100%">
              <YStack flex={1}>
                {/* ... your text components */}
              </YStack>
              <Checkbox
                value={key}
                checked={disclosure[key]}
                onChange={() => handleDisclosureChange(key)}
                size="$4"
              />
            </XStack>
          );
        })}
      </YStack>
      <Text>Enter your address or ens</Text>
      <Input
        variant="outline"
        size="$4"
        space="$2"
        value={address}
        onChangeText={setAddress}
        placeholder="Your Address or ens name"
      />
      <Button onPress={generatingProof ? handleProve : undefined}>
        {generatingProof ? (
          <>
            <Spinner size="$2" />
            <Text>Generating zk proof</Text>
          </>
        ) : (
          <Text>Generate zk proof</Text>
        )}
      </Button>
    </YStack>
  );
};


const styles = StyleSheet.create({
    view: {
      flex: 1,
    },
    sectionContainer: {
      marginTop: 32,
      paddingHorizontal: 24,
    },
    sectionTitle: {
      fontSize: 24,
      fontWeight: '600',
    },
    sectionDescription: {
      marginTop: 8,
      fontSize: 18,
      fontWeight: '400',
    },
    highlight: {
      fontWeight: '700',
    },
    header: {
      fontSize: 22,
      fontWeight: 'bold',
      textAlign: 'center',
      marginTop: 20,
    },
    testSection: {
      backgroundColor: '#f2f2f2', // different background color
      padding: 10,
      borderTopWidth: 1,
      borderTopColor: '#dcdcdc', // adding a border top with a light color
      marginTop: 15,
    },
  });

export default ProveScreen;
