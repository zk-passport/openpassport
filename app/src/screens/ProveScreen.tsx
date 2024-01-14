import { View, Text, Checkbox, Input, Button } from 'tamagui';
import { CheckIcon, ButtonSpinner, ButtonText, InputField, CheckboxIndicator } from '@tamagui/lucide-icons'; 
import { getFirstName } from '../../utils/utils';
import { attributeToPosition } from '../../../common/src/constants/constants';
const PassportDataComponent = ({ passportData, disclosure, handleDisclosureChange, address, setAddress, generatingProof, handleProve }) => {


    const attributeToPosition = {
        issuing_state: [2, 5],
        name: [5, 44],
        passport_number: [44, 52],
        nationality: [54, 57],
        date_of_birth: [57, 63],
        gender: [64, 65],
        expiry_date: [65, 71],
      }

  return (
    <View>
      <Text f={2} mb="$4">Hi {getFirstName(passportData.mrz)}</Text>
      
      <View my="$4">
        <Text mb="$2">Signature algorithm: {passportData.signatureAlgorithm}</Text>
        <Text mb="$4">What do you want to disclose ?</Text>
         
        {Object.keys(disclosure).map((key) => {
          const keyy = key as keyof typeof disclosure;
          const indexes = attributeToPosition[keyy];
          const keyFormatted = keyy.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
          const mrzAttribute = passportData.mrz.slice(indexes[0], indexes[1]);
          const mrzAttributeFormatted = mrzAttribute.replace(/</g, ' ');

          return (
            <View key={key} m="$2" w="$full" flexDirection="row" jc="space-between">
              <View maxW="83%">
                <Text fw="bold">{keyFormatted}: </Text>
                <Text>{mrzAttributeFormatted}</Text>
              </View>
              {/* 
              <Checkbox
                value={key}
                checked={disclosure[keyy]}
                onChange={() => handleDisclosureChange(keyy)}
                size="lg"
                aria-label={key}
              >
                <CheckboxIndicator mr="$2">
                  <CheckIcon />
                </CheckboxIndicator>
              </Checkbox>
              */}
            </View>
          );
        })}  
      </View>
      {/*
      <Text>Enter your address or ens</Text>
      <Input variant="outline" size="md" mb="$4" mt="$2">
        <InputField
          value={address}
          onChangeText={setAddress}
          placeholder="Your Address or ens name"
        />
      </Input>
      {generatingProof ?
        <Button onPress={handleProve}>
          <ButtonSpinner mr="$1" />
          <ButtonText>Generating zk proof</ButtonText>
        </Button> :
        <Button onPress={handleProve}>
          <ButtonText>Generate zk proof</ButtonText>
        </Button>
      } */}
    </View>
  );
};

export default PassportDataComponent;
