import React, { useCallback, useEffect } from 'react';
import { StyleSheet } from 'react-native';

import { useNavigation } from '@react-navigation/native';
import LottieView from 'lottie-react-native';

import splashAnimation from '../assets/animations/splash.json';
import { useAuth } from '../stores/authProvider';
import { usePassport } from '../stores/passportDataProvider';
import { useSettingStore } from '../stores/settingStore';
import { black } from '../utils/colors';
import { impactLight } from '../utils/haptic';
import { isUserRegistered } from '../utils/proving/payload';

const SplashScreen: React.FC = ({}) => {
  const navigation = useNavigation();
  const { passportData, secret, status } = usePassport(false);
  const { createSigningKeyPair } = useAuth();
  const { setBiometricsAvailable } = useSettingStore();

  useEffect(() => {
    createSigningKeyPair()
      .then(() => setBiometricsAvailable(true))
      .catch(err => {
        console.warn(
          'Something ELSE and totally unexpected went wrong during keypair creation',
          err,
        );
      });
  }, []);

  const handleAnimationFinish = useCallback(() => {
    setTimeout(async () => {
      impactLight();
      if (status !== 'success') {
        return;
      }

      if (!passportData || !secret) {
        navigation.navigate('Launch');
        return;
      }

      const isRegistered = await isUserRegistered(
        passportData,
        secret.password,
      );
      console.log('User is registered:', isRegistered);
      if (isRegistered) {
        console.log('Passport is registered already. Skipping to HomeScreen');
        navigation.navigate('Home');
        return;
      }
      // Currently, we dont check isPassportNullified(passportData);
      // This could lead to AccountRecoveryChoice just like in LoadingScreen
      // But it looks better right now to keep the LaunchScreen flow
      // In case user wants to try with another passport.
      // Long term, we could also show a modal instead that prompts the user to recover or scan a new passport.

      // Rest of the time, keep the LaunchScreen flow
      navigation.navigate('Launch');
    }, 1000);
  }, [navigation, passportData, secret, status]);

  return (
    <LottieView
      autoPlay
      loop={false}
      source={splashAnimation}
      style={styles.animation}
      onAnimationFinish={handleAnimationFinish}
      resizeMode="cover"
      cacheComposition={true}
      renderMode="HARDWARE"
    />
  );
};

const styles = StyleSheet.create({
  animation: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    height: '100%',
    width: '100%',
    backgroundColor: black,
  },
});

export default SplashScreen;
