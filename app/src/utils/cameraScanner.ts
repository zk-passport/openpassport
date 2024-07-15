import { NativeModules, Platform } from 'react-native';
import { formatDateToYYMMDD, extractMRZInfo, Steps } from './utils';
import * as amplitude from '@amplitude/analytics-react-native';
import useUserStore from '../stores/userStore';
import useNavigationStore from '../stores/navigationStore';

export const startCameraScan = async () => {
  const { toast, setStep } = useNavigationStore.getState();
  const start = Date.now();
  amplitude.track('Start camera scan', {
    os: Platform.OS,
  });

  if (Platform.OS === 'ios') {
    try {
      const result = await NativeModules.MRZScannerModule.startScanning();
      const end = Date.now();
      console.log("Scan result:", result);
      console.log(`Document Number: ${result.documentNumber}, Expiry Date: ${result.expiryDate}, Birth Date: ${result.birthDate}`);

      useUserStore.setState({
        passportNumber: result.documentNumber,
        dateOfBirth: formatDateToYYMMDD(result.birthDate),
        dateOfExpiry: formatDateToYYMMDD(result.expiryDate),
      })

      setStep(Steps.MRZ_SCAN_COMPLETED);
      toast.show("✅", {
        message: 'Scan successful',
        customData: {
          type: "success"
        },
      })
      amplitude.track('Camera scan successful', {
        os: Platform.OS,
        status: 'success',
        duration_seconds: (end - start) / 1000
      });
    } catch (e) {
      const end = Date.now();
      console.error(e);
      amplitude.track('Camera scan failure', {
        os: Platform.OS,
        status: 'failure',
        duration_seconds: (end - start) / 1000
      });
    }
  } else {
    NativeModules.CameraActivityModule.startCameraActivity()
      .then((mrzInfo: string) => {
        const end = Date.now();
        try {
          const { documentNumber, birthDate, expiryDate } = extractMRZInfo(mrzInfo);

          useUserStore.setState({
            passportNumber: documentNumber,
            dateOfBirth: birthDate,
            dateOfExpiry: expiryDate,
          })

          setStep(Steps.MRZ_SCAN_COMPLETED);
          amplitude.track('Camera scan successful', {
            os: Platform.OS,
            status: 'success',
            duration_seconds: (end - start) / 1000
          });
          toast.show("✅", {
            message: 'Scan successful',
            customData: {
              type: "success",
              duration_seconds: (end - start) / 1000
            },
          })
        } catch (error: any) {
          console.error('Invalid MRZ format:', error.message);
          amplitude.track('Camera scan failure', {
            os: Platform.OS,
            status: 'failure',
            duration_seconds: (end - start) / 1000
          });
        }
      })
      .catch((error: any) => {
        console.error('Camera Activity Error:', error);
        amplitude.track('Camera scan failure', {
          os: Platform.OS,
          status: 'failure',
        });
      });
  }
};