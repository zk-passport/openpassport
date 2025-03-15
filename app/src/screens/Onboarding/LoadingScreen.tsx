import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { StaticScreenProps, useNavigation } from '@react-navigation/native';
import LottieView from 'lottie-react-native';

import failAnimation from '../../assets/animations/loading/fail.json';
import miscAnimation from '../../assets/animations/loading/misc.json';
import successAnimation from '../../assets/animations/loading/success.json';
import useHapticNavigation from '../../hooks/useHapticNavigation';
import { usePassport } from '../../stores/passportDataProvider';
import { ProofStatusEnum, useProofInfo } from '../../stores/proofProvider';
import analytics from '../../utils/analytics';
import {
  checkPassportSupported,
  isPassportNullified,
  isUserRegistered,
  registerPassport,
} from '../../utils/proving/payload';

const { trackEvent } = analytics();

type LoadingScreenProps = StaticScreenProps<{}>;

const LoadingScreen: React.FC<LoadingScreenProps> = ({}) => {
  const goToSuccessScreen = useHapticNavigation('AccountVerifiedSuccess');
  const goToErrorScreen = useHapticNavigation('Launch');
  const goToUnsupportedScreen = useHapticNavigation('UnsupportedPassport');
  const navigation = useNavigation();

  const goToSuccessScreenWithDelay = () => {
    setTimeout(() => {
      goToSuccessScreen();
    }, 3000);
  };
  const goToErrorScreenWithDelay = () => {
    setTimeout(() => {
      goToErrorScreen();
    }, 3000);
  };
  const [animationSource, setAnimationSource] = useState<any>(miscAnimation);
  const { registrationStatus, resetProof } = useProofInfo();
  const { passportData, clearPassportData, setSecret, status } = usePassport();

  useEffect(() => {
    // TODO this makes sense if reset proof was only about passport registration
    resetProof();
  }, []);

  useEffect(() => {
    if (registrationStatus === ProofStatusEnum.SUCCESS) {
      setAnimationSource(successAnimation);
      goToSuccessScreenWithDelay();
      setTimeout(() => resetProof(), 3000);
    } else if (
      registrationStatus === ProofStatusEnum.FAILURE ||
      registrationStatus === ProofStatusEnum.ERROR
    ) {
      setAnimationSource(failAnimation);
      goToErrorScreenWithDelay();
      setTimeout(() => resetProof(), 3000);
    }
  }, [registrationStatus]);

  const processPayloadCalled = useRef(false);
  useEffect(() => {
    if (!processPayloadCalled.current) {
      processPayloadCalled.current = true;
      const processPayload = async () => {
        try {
          if (status !== 'success') {
            return;
          }

          const secret = await setSecret();

          if (!passportData || !secret) {
            console.warn('no passportData or secret');
            navigation.navigate('Launch');
            return;
          }
          const isSupported = await checkPassportSupported(passportData);
          if (isSupported.status !== 'passport_supported') {
            trackEvent('Passport not supported', {
              reason: isSupported.status,
              details: isSupported.details,
            });
            goToUnsupportedScreen();
            console.log('Passport not supported');
            clearPassportData();
            return;
          }
          const isRegistered = await isUserRegistered(
            passportData,
            secret.password,
          );
          console.log('User is registered:', isRegistered);
          if (isRegistered) {
            console.log(
              'Passport is registered already. Skipping to AccountVerifiedSuccess',
            );
            navigation.navigate('AccountVerifiedSuccess');
            return;
          }
          const isNullifierOnchain = await isPassportNullified(passportData);
          console.log('Passport is nullified:', isNullifierOnchain);
          if (isNullifierOnchain) {
            console.log(
              'Passport is nullified, but not registered with this secret. Prompt to restore secret from iCloud or manual backup',
            );
            navigation.navigate('AccountRecoveryChoice');
            return;
          }
          registerPassport(passportData, secret.password);
        } catch (error) {
          console.error('Error processing payload:', error);
          setTimeout(() => resetProof(), 1000);
        }
      };
      processPayload();
    }
  }, [
    clearPassportData,
    goToUnsupportedScreen,
    passportData,
    setSecret,
    navigation.navigate,
    resetProof,
    status,
  ]);

  return (
    <View style={styles.container}>
      <LottieView
        autoPlay
        loop={animationSource === miscAnimation}
        source={animationSource}
        style={styles.animation}
        resizeMode="cover"
        renderMode="HARDWARE"
      />
      <Text style={styles.warningText}>
        This can take up to one minute, don't close the app
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  animation: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  warningText: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    padding: 16,
  },
});

export default LoadingScreen;
