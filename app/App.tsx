import React, {useEffect, useState} from 'react';
import type {PropsWithChildren} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  Button,
  NativeModules,
  DeviceEventEmitter,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import RNFS from 'react-native-fs';

import {
  Colors,
  DebugInstructions,
  Header,
  LearnMoreLinks,
  ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';
// @ts-ignore
import PassportReader from 'react-native-passport-reader';
import {checkInputs} from './utils/checks';

// const {PassportReaderModule} = NativeModules;

function App(): JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const [passportNumber, setPassportNumber] = useState('19HA34828');
  const [dateOfBirth, setDateOfBirth] = useState('000719');
  const [dateOfExpiry, setDateOfExpiry] = useState('291209');
  const [address, setAddress] = useState('');
  const [step, setStep] = useState('enterDetails');
  const [firstName, setFirstName] = useState('');

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  useEffect(() => {
    const logEventListener = DeviceEventEmitter.addListener('LOG_EVENT', e => {
      console.log(e);
    });

    return () => {
      logEventListener.remove();
    };
  }, []);

  async function handleResponse(response: any) {
    const {
      firstName,
      lastName,
      gender,
      issuer,
      nationality,
      photo,
      dg1File,
      dg2File,
      dg2InSave,
      publicKey,
      publicKeyOldSchool,
      dataGroupHashes,
      sodFile,
      signedData,
      eContent,
      encryptedDigest,
    } = response;

    // const responseJSON = JSON.stringify(response, null, 2);
    // const responseJSONPath = RNFS. + '/response.json';

    // console.log('responseJSONPath', responseJSONPath);

    // RNFS.writeFile(responseJSONPath, responseJSON, 'utf8')
    //   .then(success => console.log('FILE WRITTEN!'))
    //   .catch(err => console.log(err.message));

    console.log('firstName', firstName);
    console.log('lastName', lastName);
    console.log('gender', gender);
    console.log('issuer', issuer);
    console.log('nationality', nationality);
    console.log('photo', photo);
    console.log('dg1File', JSON.parse(dg1File));
    // console.log('dg2File', JSON.parse(dg2File));
    console.log('dg2InSave', JSON.parse(dg2InSave));
    console.log('publicKey', publicKey);
    console.log('publicKeyOldSchool', publicKeyOldSchool);
    // console.log('dataGroupHashes', JSON.parse(dataGroupHashes));
    console.log('eContent', JSON.parse(eContent));
    console.log('encryptedDigest', JSON.parse(encryptedDigest));
    console.log('sodFile', JSON.parse(sodFile));
    console.log('signedData', JSON.parse(signedData));

    // copilot, please write dg2File and dg2InSave to disk as JSON files, in js

    fetch('http://192.168.1.22:3000/data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: sodFile,
    })
      .then(response => response.json())
      .then(data => console.log(data))
      .catch(error => {
        console.error('Error:', error);
      });

    setFirstName(firstName);

    const {base64, width, height} = photo;

    // 1. Compute the eContent from the dg1File

    // 2. Format all the data as calldata for the verifier contract

    // 3. Call the verifier contract with the calldata

    setStep('scanCompleted');
  }

  async function scan() {
    checkInputs(passportNumber, dateOfBirth, dateOfExpiry);
    // 1. start a scan
    // 2. press the back of your android phone against the passport
    // 3. wait for the scan(...) Promise to get resolved/rejected
    console.log('scanning...');
    setStep('scanning');
    try {
      const response = await PassportReader.scan({
        documentNumber: passportNumber,
        dateOfBirth: dateOfBirth,
        dateOfExpiry: dateOfExpiry,
      });
      console.log('scanned');
      handleResponse(response);
    } catch (e) {
      console.log('error :', e);
    }
  }

  const handleMint = () => {
    // mint "Proof of Passport" NFT to the address logic here
  };

  const handleNative = async () => {
    const value = await NativeModules.PassportReader.scanPassport();
    console.log(`native tells us ${value}`);
  };

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={backgroundStyle}>
        <View
          style={{
            backgroundColor: isDarkMode ? Colors.black : Colors.white,
          }}>
          {step === 'enterDetails' ? (
            <View style={styles.sectionContainer}>
              <Text style={styles.header}>Enter Your Passport Details</Text>
              <TextInput
                style={styles.input}
                onChangeText={setPassportNumber}
                value={passportNumber}
                placeholder="Passport Number"
              />
              <TextInput
                style={styles.input}
                onChangeText={setDateOfBirth}
                value={dateOfBirth}
                placeholder="Date of Birth (YYYY-MM-DD)"
              />
              <TextInput
                style={styles.input}
                onChangeText={setDateOfExpiry}
                value={dateOfExpiry}
                placeholder="Date of Expiry (YYYY-MM-DD)"
              />
              <Button title="Scan Passport with NFC" onPress={scan} />
              <Button title="Call native method" onPress={handleNative} />
            </View>
          ) : null}
          {step === 'scanning' ? (
            <View style={styles.sectionContainer}>
              <Text style={styles.header}>Put your phone on your passport</Text>
              <ActivityIndicator
                size="large"
                color="#00ff00"
                style={{marginTop: 20}}
              />
            </View>
          ) : null}
          {step === 'scanCompleted' ? (
            <View style={styles.sectionContainer}>
              <Text style={styles.header}>Connection successful</Text>
              <Text style={styles.sectionDescription}>Hi {firstName} </Text>
              <Text style={styles.header}>Input your address or ens</Text>
              <TextInput
                style={styles.input}
                onChangeText={setAddress}
                value={address}
                placeholder="Your Address or ens name"
              />
              <Button title="Mint Proof of Passport" onPress={handleMint} />
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
  },
  input: {
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 10,
  },
});

export default App;
