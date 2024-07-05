import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Image } from 'tamagui'; // Assuming you're using Tamagui for UI components
import NFC from '../images/nfc_icon.png'

const SplashScreen = () => {
  const [loadingText, setLoadingText] = useState('Loading');

  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingText((current) => {
        if (current === 'Loading...') return 'Loading';
        return current + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: NFC }}
        style={styles.logo}
      />
      <Text style={styles.loadingText}>{loadingText}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#161616',
  },
  logo: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    color: '#a0a0a0',
  },
});

export default SplashScreen;