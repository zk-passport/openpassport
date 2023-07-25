/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useEffect} from 'react';
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
  // NativeModules,
  DeviceEventEmitter,
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

// const {PassportReaderModule} = NativeModules;

const NewModuleButton = () => {
  const onPress = () => {
    PassportReader.createCalendarEvent('testName', 'testLocation');
  };

  return (
    <Button
      title="Click to invoke your native module!"
      color="#841584"
      onPress={onPress}
    />
  );
};

type SectionProps = PropsWithChildren<{
  title: string;
}>;

function Section({children, title}: SectionProps): JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  useEffect(() => {
    const logEventListener = DeviceEventEmitter.addListener('LOG_EVENT', e => {
      console.log(e);
    });

    return () => {
      logEventListener.remove();
    };
  }, []);

  // useEffect(() => {
  //   const nfcEventListener = DeviceEventEmitter.addListener(
  //     'ReadDataTaskCompleted',
  //     event => {
  //       const passportData = JSON.parse(event.passportData);
  //       console.log('NFC data was read. Data: ', passportData);
  //     },
  //   );

  //   return () => {
  //     nfcEventListener.remove();
  //   };
  // }, []);

  return (
    <View style={styles.sectionContainer}>
      <Text
        style={[
          styles.sectionTitle,
          {
            color: isDarkMode ? Colors.white : Colors.black,
          },
        ]}>
        {title}
      </Text>
      <Text
        style={[
          styles.sectionDescription,
          {
            color: isDarkMode ? Colors.light : Colors.dark,
          },
        ]}>
        {children}
      </Text>
    </View>
  );
}

function App(): JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  async function scan() {
    // 1. start a scan
    // 2. press the back of your android phone against the passport
    // 3. wait for the scan(...) Promise to get resolved/rejected
    console.log('scanning...');
    try {
      const response = await PassportReader.scan({
        documentNumber: '19HA34828',
        dateOfBirth: '000719',
        dateOfExpiry: '291209',
      });
      console.log('scanned');
      handleResponse(response);
    } catch (e) {
      console.log('error :', e);
    }
  }

  async function handleResponse(response: any) {
    const {
      firstName,
      lastName,
      gender,
      issuer,
      nationality,
      photo,
      dg1File,
      publicKey,
      publicKeyOldSchool,
      dataGroupHashes,
      eContent,
      encryptedDigest,
    } = response;

    console.log('firstName', firstName);
    console.log('lastName', lastName);
    console.log('gender', gender);
    console.log('issuer', issuer);
    console.log('nationality', nationality);
    console.log('photo', photo);
    console.log('dg1File', JSON.parse(dg1File));
    console.log('publicKey', publicKey);
    console.log('publicKeyOldSchool', publicKeyOldSchool);
    console.log('dataGroupHashes', JSON.parse(dataGroupHashes));
    console.log('eContent', JSON.parse(eContent));
    console.log('encryptedDigest', JSON.parse(encryptedDigest));

    const {base64, width, height} = photo;

    // Let's compute the eContent from the dg1File
  }

  scan();

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={backgroundStyle}>
        <Header />
        <View
          style={{
            backgroundColor: isDarkMode ? Colors.black : Colors.white,
          }}>
          <Section title="Step One">
            Edit <Text style={styles.highlight}>App.tsx</Text> to change this
            screen and then come back to see your edits.
          </Section>
          <NewModuleButton />
          <Section title="See Your Changes">
            <ReloadInstructions />
          </Section>
          <Section title="Debug">
            <DebugInstructions />
          </Section>
          <Section title="Learn More">
            Read the docs to discover what to do next:
          </Section>
          <LearnMoreLinks />
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
});

export default App;
