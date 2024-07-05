import React, { useEffect, useState } from 'react';
import "react-native-get-random-values"
import "@ethersproject/shims"
import MainScreen from './src/screens/MainScreen';
import { Buffer } from 'buffer';
import { YStack } from 'tamagui';
import { useToastController } from '@tamagui/toast';
import useNavigationStore from './src/stores/navigationStore';
import { AMPLITUDE_KEY } from '@env';
import * as amplitude from '@amplitude/analytics-react-native';
import useUserStore from './src/stores/userStore';
import SplashScreen from './src/components/SlpashScreen';
global.Buffer = Buffer;

function App(): JSX.Element {
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToastController();
  const setToast = useNavigationStore((state) => state.setToast);
  const initUserStore = useUserStore((state) => state.initUserStore);

  useEffect(() => {
    setToast(toast);
  }, [toast, setToast]);

  useEffect(() => {
    const initialize = async () => {
      await initUserStore();
      if (AMPLITUDE_KEY) {
        amplitude.init(AMPLITUDE_KEY);
      }
      setIsLoading(false);
    };

    initialize();
  }, []);

  
  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <YStack f={1} bc="#161616" h="100%" w="100%">
      <YStack h="100%" w="100%">
        <MainScreen />
      </YStack>
    </YStack>
  );
}

export default App;
