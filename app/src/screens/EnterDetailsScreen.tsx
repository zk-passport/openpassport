// src/screens/EnterDetailsScreen.tsx

import React, {useState} from 'react';
import { View, Text, StyleSheet } from 'react-native';
import CustomTextInput from '../components/CustomTextInput';
import Button from '../components/CustomButton'; 

const EnterDetailsScreen = ({ passportNumber, setPassportNumber, dateOfBirth, setDateOfBirth, dateOfExpiry, setDateOfExpiry, onScanPress }) => {

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.header}>Welcome to Proof of Passport</Text>
      <Text style={styles.header2}>Generate ZK proof with your passport data</Text>

      <CustomTextInput
        value={passportNumber}
        onChangeText={setPassportNumber}
        placeholder="Passport Number"
        keyboardType="default"
      />
      <CustomTextInput
        value={dateOfBirth}
        onChangeText={setDateOfBirth}
        placeholder="Date of Birth (YYMMDD)"
        keyboardType="numeric"
      />
      <CustomTextInput
        value={dateOfExpiry}
        onChangeText={setDateOfExpiry}
        placeholder="Date of Expiry (YYMMDD)"
        keyboardType="numeric"
      />
      <Button
        onPress={onScanPress}
        title="Scan Passport with NFC"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 40,
    color: 'black',
  },
  header2: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
    color: 'gray',
  }
});

export default EnterDetailsScreen;
