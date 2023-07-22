import '../../styles/globals.css';

import type { AppProps } from 'next/app';
import { useState } from 'react';
import { Proof } from '../types';
import {
    EthereumClient,
    w3mConnectors,
    w3mProvider,
} from '@web3modal/ethereum';
import { Web3Modal } from '@web3modal/react';
import { configureChains, createConfig, WagmiConfig } from 'wagmi';
import { arbitrum, mainnet, polygon } from 'wagmi/chains';

const chains = [mainnet];
const projectId = '995f7eebe283b9908e661cf08b88b492';

const { publicClient } = configureChains(chains, [w3mProvider({ projectId })]);
const wagmiConfig = createConfig({
    autoConnect: true,
    connectors: w3mConnectors({ projectId, chains }),
    publicClient,
});
const ethereumClient = new EthereumClient(wagmiConfig, chains);

function MyApp({ Component, pageProps }: AppProps) {
    const [vkeyVerifier, setvkeyVerifier] = useState<null | any>(null);
    const [vkeyProof, setvkeyProof] = useState<null | any>(null); // typing for vkey?
    const [vkeyState, setvkeyState] = useState('Verifier not initialized');
    const [proof, setproof] = useState<null | Proof>(null);

    return (
        <div>
            <WagmiConfig config={wagmiConfig}>
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
            </WagmiConfig>

            <Web3Modal projectId={projectId} ethereumClient={ethereumClient} />
        </div>
    );
}

export default MyApp;
