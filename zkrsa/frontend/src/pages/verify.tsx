import type { NextPage } from 'next';
import { theme } from '../components/Buttons';
import { Title, NavMenu, Description, Footer } from '../components/Navigation';
import { useState } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import { ThemeProvider } from '@mui/material/styles';
import { InputProof } from '../components/Inputs';
import { DownloadableProof, PropsAppPage } from '../types';
import { downloadVerifier, validity } from '../utils/zk';

const Verify: NextPage = ({}) => {
    const [uploadedProof, setuploadedProof] =
        useState<DownloadableProof | null>(null);
    const [proofValidity, setproofValidity] = useState<boolean | null>(null);
    const [verifying, setverifying] = useState(false);

    return (
        <div>
            <Title></Title>
            <Description></Description>
            <NavMenu></NavMenu>
            <div className="flex justify-center">
                <InputProof setuploadedProof={setuploadedProof}></InputProof>
            </div>
            <div className="flex w-3/4 justify-end my-5">
                {verifying ? (
                    <ThemeProvider theme={theme}>
                        <CircularProgress
                            disableShrink
                            size={40}
                            color="primary"
                        />
                    </ThemeProvider>
                ) : (
                    <button
                        onClick={async () => {
                            setverifying(true);
                            if (uploadedProof) {
                                const vkeyVerifier = downloadVerifier(
                                    process.env[
                                        'NEXT_PUBLIC_VKEY_VERIFIER_URL'
                                    ] as string
                                );
                                const proofValidity = await validity(
                                    vkeyVerifier,
                                    uploadedProof.proof,
                                    uploadedProof.publicSignals
                                );
                                setproofValidity(proofValidity);
                            }
                            setverifying(false);
                        }}
                        className="font-work-sans shadow-xl disabled:text-gray-400 disabled:border-gray-400 focus:outline-none text-beige border-2 rounded-lg border-beige hover:border-gold px-3 py-2"
                        disabled={uploadedProof ? false : true}
                    >
                        Verify
                    </button>
                )}
            </div>
            {proofValidity != null ? (
                <div className="flex justify-center text-beige text-xl">
                    {proofValidity ? `Valid proof ✅` : `Invalid proof ❌`}
                </div>
            ) : null}
            <Footer></Footer>
        </div>
    );
};

export default Verify;
