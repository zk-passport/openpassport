import React, {useEffect, useState} from 'react';
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

import {
  Colors,
  DebugInstructions,
  Header,
  LearnMoreLinks,
  ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';
// @ts-ignore
import PassportReader from 'react-native-passport-reader';
import {checkInputs, getFirstName} from './utils/checks';
import {
  DEFAULT_PNUMBER,
  DEFAULT_DOB,
  DEFAULT_DOE,
  DEFAULT_ADDRESS,
  LOCAL_IP,
} from '@env';
import {PassportData} from './types/passportData';
import {arraysAreEqual, dataHashesObjToArray} from './utils/utils';
import {computeAndCheckEContent} from './utils/computeEContent';

console.log('DEFAULT_PNUMBER', DEFAULT_PNUMBER);

const CACHE_DATA_IN_LOCAL_SERVER = true;
const SKIP_SCAN = false;

function App(): JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const [passportNumber, setPassportNumber] = useState(DEFAULT_PNUMBER ?? '');
  const [dateOfBirth, setDateOfBirth] = useState(DEFAULT_DOB ?? '');
  const [dateOfExpiry, setDateOfExpiry] = useState(DEFAULT_DOE ?? '');
  const [address, setAddress] = useState(DEFAULT_ADDRESS ?? '');
  const [passportData, setPassportData] = useState<PassportData | null>(null);
  const [step, setStep] = useState('enterDetails');
  const [result, setResult] = useState<string>('');
  const [proofResult, setProofResult] = useState<string>('');

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

  if (SKIP_SCAN && passportData === null) {
    console.log('skipping scan step...');
    fetch(`${LOCAL_IP}/passportData`)
      .then(response => response.json())
      .then(data => {
        console.log('passport data fetched');
        setPassportData(data);
        setStep('scanCompleted');
      });
  }

  async function handleResponse(response: any) {
    const {
      mrz,
      modulus,
      dataGroupHashes,
      eContent,
      encryptedDigest,
    } = response;

    const passportData: PassportData = {
      mrz: mrz.replace(/\n/g, ''),
      modulus: modulus,
      dataGroupHashes: dataHashesObjToArray(JSON.parse(dataGroupHashes)),
      eContent: JSON.parse(eContent),
      encryptedDigest: JSON.parse(encryptedDigest),
    };

    console.log('mrz', passportData.mrz);
    console.log('modulus', passportData.modulus);
    console.log('dataGroupHashes', passportData.dataGroupHashes);
    console.log('eContent', passportData.eContent);
    console.log('encryptedDigest', passportData.encryptedDigest);

    setPassportData(passportData);

    if (CACHE_DATA_IN_LOCAL_SERVER) {
      // Caches data in local server to avoid having to scan the passport each time
      // For development purposes only
      fetch(`${LOCAL_IP}/post`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(passportData),
      })
        .then(response => response.json())
        .then(data => console.log(data.message))
        .catch(error => {
          console.log('error caching data in local server', error);
        });
    }

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
      console.log('response', response);
      console.log('scanned');
      handleResponse(response);
    } catch (e) {
      console.log('error :', e);
    }
  }

  const handleProve = async () => {
    if (passportData === null) {
      console.log('passport data is null');
      return;
    }

    // 1. Compute the eContent from the mrzInfo and the dataGroupHashes
    const computedEContent = computeAndCheckEContent(passportData);

    if (!arraysAreEqual(computedEContent, passportData.eContent)) {
      throw new Error(
        'computed eContent does not match the one from passportData',
      );
    }

    // 2. TODO : check RSA signature to make sure the proof will work
    // Did not manage to do it cuz js crypto libs suck

    // 3. Format all the data as inputs for the circuit

    // 4. Generate a proof of passport
  };

  const handleMint = () => {
    // 5. Format the proof and publicInputs as calldata for the verifier contract
    // 6. Call the verifier contract with the calldata
  };

  const callRustLib = async () => {
    NativeModules.RNPassportReader.callRustLib((err: any, res: any) => {
      if (err) {
        console.error(err);
        setResult(err.toString());
      } else {
        console.log(res); // Should log "5"
        setResult(res.toString());
      }
    });
  };

  const proveRust = async () => {
    const start = Date.now();
    NativeModules.RNPassportReader.proveRust((err: any, res: any) => {
      const end = Date.now();
      if (err) {
        console.error(err);
        setProofResult(
          "res:" + err.toString() + ' time elapsed: ' + (end - start) + 'ms',
        );
      } else {
        console.log(res);
        setProofResult(
          "res:" + res.toString() + ' time elapsed: ' + (end - start) + 'ms',
        );
      }
    });
  };

  const handleNative = async () => {
    const value = await NativeModules.PassportReader.scanPassport('', '', '');
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
                placeholder="Date of Birth (YYMMDD)"
              />
              <TextInput
                style={styles.input}
                onChangeText={setDateOfExpiry}
                value={dateOfExpiry}
                placeholder="Date of Expiry (YYMMDD)"
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
              <Text style={styles.header}>
                {passportData && `Hi ${getFirstName(passportData.mrz)} ! `}
              </Text>
              <Text style={styles.header}>Input your address or ens</Text>
              <TextInput
                style={styles.input}
                onChangeText={setAddress}
                value={address}
                placeholder="Your Address or ens name"
              />
              <Button title="Generate zk proof" onPress={handleProve} />
            </View>
          ) : null}
          {step === 'proofGenerated' ? (
            <View style={styles.sectionContainer}>
              <Text style={styles.header}>Zero-knowledge proof generated</Text>
              <Text style={styles.header}>You can now mint your SBT</Text>
              <Button title="Mint Proof of Passport" onPress={handleMint} />
            </View>
          ) : null}
        </View>
        <View style={styles.sectionContainer}>
          <Button title="Call rust though java" onPress={callRustLib} />
          <Text style={styles.header}>{result}</Text>
        </View>
        <View style={styles.sectionContainer}>
          <Button title="Prove" onPress={proveRust} />
          <Text style={styles.header}>{proofResult}</Text>
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
