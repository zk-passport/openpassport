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
import { arbitrum, mainnet, polygon, goerli } from 'wagmi/chains';
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc';

const chains = [goerli];
// const projectId = "995f7eebe283b9908e661cf08b88b492";
const projectId = '34a216df947456c22da1f6034129afa7';

const { publicClient } = configureChains(chains, [
    w3mProvider({ projectId }),
    jsonRpcProvider({
        rpc: (chain: any) => ({
            http: `https://chaotic-twilight-arm.ethereum-goerli.discover.quiknode.pro/923e597570b20405106e4a50d36a5e938baa8d0f/`,
        }),
    }),
]);
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
