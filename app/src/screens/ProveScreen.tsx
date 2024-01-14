import React from 'react';
import {
    Text,
    GluestackUIProvider,
    Checkbox,
    CheckboxIndicator,
    CheckboxIcon,
    CheckIcon,
    CheckboxLabel,
    Input,
    InputField,
    ButtonText,
    ButtonIcon,
    Button,
    Spinner,
    View,
    ButtonSpinner,
  } from "@gluestack-ui/themed"
import {getFirstName, formatDuration, checkInputs } from '../../utils/utils';
import {
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    useColorScheme,
    NativeModules,
    DeviceEventEmitter,
    TextInput,
  } from 'react-native';
const ProveScreen = ({
  passportData,
  disclosure,
  handleDisclosureChange,
  address,
  setAddress,
  generatingProof,
}) => {

  return (
    <View style={styles.sectionContainer}>
    <Text style={styles.header}>
      Hi {getFirstName(passportData.mrz)}
    </Text>
    <View
      marginTop={20}
      marginBottom={20}
    >
      <Text
        marginBottom={5}
      >
        Signature algorithm: {passportData.signatureAlgorithm}
      </Text>
      <Text
        marginBottom={10}
      >
        What do you want to disclose ?
      </Text>
      {Object.keys(disclosure).map((key) => {
        const keyy = key as keyof typeof disclosure;
        const indexes = attributeToPosition[keyy];
        const keyFormatted = keyy.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        const mrzAttribute = passportData.mrz.slice(indexes[0], indexes[1])
        const mrzAttributeFormatted = mrzAttribute.replace(/</g, ' ')
        
        return (
          <View key={key} margin={2} width={"$full"} flexDirection="row" justifyContent="space-between">
            <View maxWidth={"$5/6"}>
              <Text
                style={{fontWeight: "bold"}}
              >
                {keyFormatted}:{" "}
              </Text>
              <Text>
                {mrzAttributeFormatted}
              </Text>
            </View>
            <Checkbox
              value={key}
              isChecked={disclosure[keyy]}
              onChange={() => handleDisclosureChange(keyy)}
              size="lg"
              aria-label={key}
            >
              <CheckboxIndicator mr="$2">
                <CheckboxIcon as={CheckIcon} />
              </CheckboxIndicator>
            </Checkbox>
          </View>
        )
      })}
    </View>
    <Text>Enter your address or ens</Text>
    <Input
      variant="outline"
      size="md"
      marginBottom={10}
      marginTop={4}
    >
      <InputField
        value={address}
        onChangeText={setAddress}
        placeholder="Your Address or ens name"
      />
    </Input>

    {generatingProof ?
      <Button
        onPress={handleProve}
      >
        <ButtonSpinner mr="$1" />
        <ButtonText>Generating zk proof</ButtonText>
      </Button>
      : <Button
          onPress={handleProve}
        >
          <ButtonText>Generate zk proof</ButtonText>
        </Button>
    }
  </View>
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
