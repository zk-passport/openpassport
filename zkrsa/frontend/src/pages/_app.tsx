import '../../styles/globals.css';

import type { AppProps } from 'next/app';
import { useState } from 'react';
import { Proof } from '../types';

function MyApp({ Component, pageProps }: AppProps) {
    const [vkeyVerifier, setvkeyVerifier] = useState<null | any>(null);
    const [vkeyProof, setvkeyProof] = useState<null | any>(null); // typing for vkey?
    const [vkeyState, setvkeyState] = useState('Verifier not initialized');
    const [proof, setproof] = useState<null | Proof>(null);

    return (
        <Component
            {...pageProps}
            proof={proof}
            setproof={setproof}
            vkeyState={vkeyState}
            setvkeyState={setvkeyState}
            vkeyProof={vkeyProof}
            setvkeyProof={setvkeyProof}
            vkeyVerifier={vkeyVerifier}
            setvkeyVerifier={setvkeyVerifier}
        />
    );
}

export default MyApp;
