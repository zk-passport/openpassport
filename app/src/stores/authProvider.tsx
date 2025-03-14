import React, {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import ReactNativeBiometrics from 'react-native-biometrics';

type SignedPayload<T> = { signature: string; data: T };
const _getSecurely = async function <T>(
  fn: () => Promise<string | false>,
  formatter: (dataString: string) => T,
): Promise<SignedPayload<T> | null> {
  console.log('Starting _getSecurely');

  const keysExist = await biometrics.biometricKeysExist();
  console.log('Biometric keys exist:', keysExist.keysExist);

  if (!keysExist.keysExist) {
    console.log('Creating new biometric keys');
    await biometrics.createKeys();
  }

  const dataString = await fn();
  console.log('Got data string:', dataString ? 'exists' : 'not found');

  if (dataString === false) {
    console.log('No data string available');
    return null;
  }

  try {
    const simpleCheck = await biometrics.simplePrompt({
      promptMessage: 'Allow access to identity',
    });

    if (!simpleCheck.success) {
      throw new Error('Authentication failed');
    }

    return {
      signature: 'authenticated',
      data: formatter(dataString),
    };
  } catch (error) {
    console.error('Error in _getSecurely:', error);
    throw error;
  }
};

async function createSigningKeyPair(): Promise<void> {
  const { available } = await biometrics.isSensorAvailable();
  if (!available) {
    return;
  }

  if ((await biometrics.biometricKeysExist()).keysExist) {
    return;
  }
  console.log('No enrolled public key. Creating a public key from biometrics');
  try {
    await biometrics.createKeys();
  } catch (e) {
    console.error(
      "User has biometrics but somehow it wasn't able to create keys",
    );
    throw e;
  }
}

const biometrics = new ReactNativeBiometrics({
  allowDeviceCredentials: true,
});

interface AuthProviderProps extends PropsWithChildren {
  authenticationTimeoutinMs?: number;
}
interface IAuthContext {
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  loginWithBiometrics: () => Promise<void>;
  createSigningKeyPair: () => Promise<void>;
  _getSecurely: typeof _getSecurely;
}
export const AuthContext = createContext<IAuthContext>({
  isAuthenticated: false,
  isAuthenticating: false,
  loginWithBiometrics: () => Promise.resolve(),
  createSigningKeyPair: () => Promise.resolve(),
  _getSecurely,
});

export const AuthProvider = ({
  children,
  authenticationTimeoutinMs = 15 * 60 * 1000,
}: AuthProviderProps) => {
  const [_, setAuthenticatedTimeout] =
    useState<ReturnType<typeof setTimeout>>();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthenticatingPromise, setIsAuthenticatingPromise] =
    useState<Promise<{ success: boolean; error?: string }> | null>(null);

  const loginWithBiometrics = useCallback(async () => {
    if (isAuthenticatingPromise) {
      await isAuthenticatingPromise;
      return;
    }

    const promise = biometrics.simplePrompt({
      promptMessage: 'Confirm your identity to access the stored secret',
    });
    setIsAuthenticatingPromise(promise);
    const { success, error } = await promise;
    if (error) {
      setIsAuthenticatingPromise(null);
      // handle error
      throw error;
    }
    if (!success) {
      // user canceled
      throw new Error('Canceled by user');
    }

    setIsAuthenticatingPromise(null);
    setIsAuthenticated(true);
    setAuthenticatedTimeout(previousTimeout => {
      if (previousTimeout) {
        clearTimeout(previousTimeout);
      }
      return setTimeout(
        () => setIsAuthenticated(false),
        authenticationTimeoutinMs,
      );
    });
  }, [isAuthenticatingPromise, authenticationTimeoutinMs]);

  const state: IAuthContext = useMemo(
    () => ({
      isAuthenticated,
      isAuthenticating: !!isAuthenticatingPromise,
      loginWithBiometrics,
      createSigningKeyPair,
      _getSecurely,
    }),
    [isAuthenticated, isAuthenticatingPromise, loginWithBiometrics],
  );

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
