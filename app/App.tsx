import MainScreen from './src/screens/MainScreen';
import useNavigationStore from './src/stores/navigationStore';
import useUserStore from './src/stores/userStore';
import { bgWhite } from './src/utils/colors';
import { setupUniversalLinkListener } from './src/utils/qrCode';
import { SEGMENT_KEY } from '@env';
import '@ethersproject/shims';
import {
  createClient,
  EventPlugin,
  PluginType,
  SegmentEvent,
} from '@segment/analytics-react-native';
import { useToastController } from '@tamagui/toast';
import { Buffer } from 'buffer';
import React, { useEffect } from 'react';
import 'react-native-get-random-values';
import { YStack } from 'tamagui';

global.Buffer = Buffer;

// Adjust the import path as needed

export class DisableTrackingPlugin extends EventPlugin {
  type = PluginType.before;

  execute(event: SegmentEvent): SegmentEvent {
    // Ensure context exists
    if (!event.context) {
      event.context = {};
    }

    // Ensure device context exists
    if (!event.context.device) {
      event.context.device = {};
    }

    // Force tracking related fields to be disabled
    event.context.device.adTrackingEnabled = false;
    event.context.device.advertisingId = undefined;
    event.context.device.trackingStatus = 'not-authorized';
    event.context.device.id = undefined;

    return event;
  }
}

export const createSegmentClient = () => {
  if (!SEGMENT_KEY) return null;

  const client = createClient({
    writeKey: SEGMENT_KEY,
    trackAppLifecycleEvents: true,
    debug: true,
    collectDeviceId: false,
    defaultSettings: {
      integrations: {
        'Segment.io': {
          apiKey: SEGMENT_KEY,
        },
      },
    },
  });

  client.add({ plugin: new DisableTrackingPlugin() });

  return client;
};

// Export the client variable (will be initialized later)
export let segmentClient: ReturnType<typeof createClient> | null = null;

function App(): React.JSX.Element {
  const toast = useToastController();
  const { setToast, setSelectedTab } = useNavigationStore();
  const initUserStore = useUserStore(state => state.initUserStore);

  useEffect(() => {
    initUserStore();
  }, [initUserStore]);

  useEffect(() => {
    setToast(toast);
  }, [toast, setToast]);

  useEffect(() => {
    setSelectedTab('splash');
  }, [setSelectedTab]);

  useEffect(() => {
    const cleanup = setupUniversalLinkListener();
    return cleanup;
  }, []);

  useEffect(() => {
    // Initialize segment directly without any tracking checks
    segmentClient = createSegmentClient();
  }, []);

  return (
    <YStack f={1} bc={bgWhite} h="100%" w="100%">
      <YStack h="100%" w="100%">
        <MainScreen />
      </YStack>
    </YStack>
  );
}

export default App;
