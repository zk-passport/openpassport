import {
    Dispatch,
    FunctionComponent,
    SetStateAction,
    useEffect,
    useRef,
    useState,
} from 'react';
import { splitToWords } from '../utils/crypto';
//@ts-ignore
import snarkjs from 'snarkjs';
import { ethers } from 'ethers';

//@ts-ignore
import axios from 'axios';
import CircularProgress from '@mui/material/CircularProgress';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import {
    SetVkeyProof,
    PropsButtonGenerateProof,
    Proof,
    PropsButtonExportProof,
    PropsButtonSearchPassport,
    PropsButtonMint,
    PropsButtonRequest,
} from '../types';
import bigInt from 'big-integer';
import {
    useAccount,
    useContractWrite,
    usePrepareContractWrite,
    useSendTransaction,
} from 'wagmi';
import ProofOfBaguette from '../ProofOfBaguette.json';

const exp = '65537';
const devHash = process.env['NEXT_PUBLIC_HASH'] as string | null;
const devSignature = process.env['NEXT_PUBLIC_SIGNATURE'] as string | null;
const devPublicKey = process.env['NEXT_PUBLIC_MODULUS'] as string | null;

export const theme = createTheme({
    palette: {
        primary: {
            main: '#EFAD5F',
        },
    },
});

export const ButtonGenerateProof: FunctionComponent<
    PropsButtonGenerateProof
> = ({
    setpublicSignals,
    setproof,
    hash,
    signature,
    publicKey,
    address,
    vkeyProof,
}) => {
    const buttonDisabled = hash && signature && publicKey ? false : true;
    const [loading, setloading] = useState(false);
    const workerRef = useRef<Worker>();
    const [currentStep, setcurrentStep] = useState('');
    const [errorMessage, seterrorMessage] = useState<string | null>(null);
    useEffect(() => {
        workerRef.current = new Worker(
            new URL('../worker/generateProof.ts', import.meta.url)
        );
        workerRef.current.onmessage = (
            e: MessageEvent<{ proof: Proof; publicSignals: string[] }>
        ) => {
            setproof(e.data.proof);
            setpublicSignals(e.data.publicSignals);
            setloading(false);
        };
        return () => {
            workerRef.current?.terminate();
        };
    }, [setproof, setpublicSignals]);

    return (
        <div className="flex my-5 w-1/3 self-end">
            {loading ? (
                <div className="flex w-1/2 flex-col ml-5">
                    <div className="self-center h-1/2">
                        <ThemeProvider theme={theme}>
                            <CircularProgress
                                disableShrink
                                size={40}
                                color="primary"
                            />
                        </ThemeProvider>
                    </div>
                    <div className="self-center my-3 text-center text-gold">
                        {currentStep}
                    </div>
                </div>
            ) : (
                <div className="self-center space-y-4 font-roboto-light-300">
                    <button
                        disabled={buttonDisabled}
                        onClick={async () => {
                            try {
                                console.log('address:', address);
                                // const a = bigInt(
                                //     (address as string).substring(2),
                                //     16
                                // );
                                // console.log('a', a);
                                // console.log('a.toString(10)', a.toString(10));

                                setloading(true);
                                seterrorMessage(null);
                                // if (devHash) {
                                //     // @dev handle dev environment here
                                //     hash = devHash;
                                //     signature = devSignature;
                                //     publicKey = devPublicKey;
                                // }
                                setcurrentStep(
                                    'Downloading circuit and vkeys...'
                                );
                                console.log('Downloading circuit and vkeys...');
                                const data = await (
                                    await axios.get(
                                        process.env[
                                            'NEXT_PUBLIC_CIRCUIT_URL'
                                        ] as any
                                    )
                                ).data;
                                console.log('got circuit');
                                const circuit = new snarkjs.Circuit(data);
                                const vkeyProof = (
                                    await axios.get(
                                        process.env[
                                            'NEXT_PUBLIC_VKEY_URL'
                                        ] as string
                                    )
                                ).data;
                                console.log('got vKey');
                                const input = Object.assign(
                                    {},
                                    splitToWords(signature, 64, 32, 'sign'),
                                    splitToWords(exp, 64, 32, 'exp'),
                                    splitToWords(publicKey, 64, 32, 'modulus'),
                                    splitToWords(hash, 64, 4, 'hashed')
                                );
                                if (!address) {
                                    console.log('no address');
                                    return;
                                }
                                console.log('address:', address);
                                input.address = bigInt(
                                    address.substring(2),
                                    16
                                ).toString(10);
                                console.log('input:', input);

                                const witness = circuit.calculateWitness(input);
                                console.log('Generating proof...');
                                setcurrentStep('Generating proof...');
                                console.log('witness:', witness);
                                console.log('vkeyProof:', vkeyProof);
                                console.log('circuit:', circuit);
                                workerRef.current!.postMessage({
                                    vkeyProof,
                                    witness,
                                });
                            } catch (error) {
                                setloading(false);
                                console.log('error', error);
                                seterrorMessage(
                                    'An error was encountered during proof generation.'
                                );
                            }
                        }}
                        className="font-work-sans shadow-xl disabled:text-gray-400 disabled:border-gray-400 focus:outline-none text-beige border-2 rounded-lg border-beige hover:border-gold px-3 py-2"
                    >
                        Generate proof
                    </button>
                    <div className="text-gold">{errorMessage}</div>
                </div>
            )}
        </div>
    );
};

export const ButtonExportProof: FunctionComponent<PropsButtonExportProof> = ({
    proof,
    publicSignals,
}) => {
    return (
        <>
            {proof ? (
                <div className="flex w-1/3 self-end">
                    <button className="shadow-xl disabled:text-gray-400 disabled:border-gray-400 focus:outline-none text-beige font-work-sans border-2 rounded-lg border-beige hover:border-gold px-3 py-2">
                        <a
                            href={`data:text/json;charset=utf-8,${encodeURIComponent(
                                JSON.stringify({ proof, publicSignals })
                            )}`}
                            download="proof_public_signals.json"
                        >
                            Download
                        </a>
                    </button>
                </div>
            ) : null}
        </>
    );
};

export const ButtonMint: FunctionComponent<PropsButtonMint> = ({
    proof,
    publicSignals,
    a,
    b,
    c,
    inputs,
    tx,
}) => {
    const { address } = useAccount();
    const { data, isLoading, isSuccess, sendTransaction } = useSendTransaction({
        to: '0x64390f86E8986FEb2f0E2E38e9392d5eBa0d0C48',
        data: tx,
    });

    useEffect(() => {
        console.log(proof);
        console.log(publicSignals);
        console.log(address);
    }, [address]);

    const sendToChain = () => {
        try {
            sendTransaction();
        } catch (error) {
            console.log(error);
        }
    };

    return (
        <>
            {true ? (
                <div className="flex w-1/3 mb-4 self-end">
                    <button
                        onClick={sendToChain}
                        className="shadow-xl disabled:text-gray-400 disabled:border-gray-400 focus:outline-none text-beige font-work-sans border-2 rounded-lg border-beige hover:border-gold px-3 py-2"
                    >
                        Mint
                    </button>
                </div>
            ) : null}
        </>
    );
};
export const ButtonRequestAttestation: FunctionComponent<
    PropsButtonRequest
> = ({ proof, publicSignals, a, b, c, inputs }) => {
    const { address } = useAccount();

    const request = async () => {
        try {
            // send an axios post request to the /easRequest endpoint with the proof and public signals
            const res = await axios.post('/api/easRequest', {
                proof,
                publicSignals,
                address: address ?? '',
            });

            // const newAttestationUID = await tx.wait();

            // console.log('New attestation UID:', newAttestationUID, tx);

            console.log(res);
        } catch (error) {
            console.log(error);
        }
    };

    return (
        <>
            {true ? (
                <div className="flex w-1/3 self-end">
                    <button
                        onClick={request}
                        className="shadow-xl disabled:text-gray-400 disabled:border-gray-400 focus:outline-none text-beige font-work-sans border-2 rounded-lg border-beige hover:border-gold px-3 py-2"
                    >
                        Request Attestation
                    </button>
                </div>
            ) : null}
        </>
    );
};

export const ButtonSearchPassport: FunctionComponent<
    PropsButtonSearchPassport
> = ({ passport, setHash, setSignature, setPublicKey }) => {
    const [notFound, setNotFound] = useState(false);

    const searchPassport = async (passport: string) => {
        try {
            const passportData = await axios.get(
                `/api/signature?id=${passport}`
            );

            if (passportData.status === 404) {
                setNotFound(true);
            }

            console.log('passportData.data', passportData.data);

            const data = Buffer.from(passportData.data.digest, 'hex');
            const hash = ethers.sha256(data);

            const decimalHash = BigInt(hash).toString();
            const decimalSig = bigInt(
                passportData.data.signature,
                16
            ).toString();
            const decimalPubkey = bigInt(
                passportData.data.publickey,
                16
            ).toString();

            setHash(decimalHash);
            setSignature(decimalSig);
            setPublicKey(decimalPubkey);
            console.log('set hash to', decimalHash);
            console.log('set decimalSig to', decimalSig);
            console.log('set decimalPubkey to', decimalPubkey);

            setNotFound(false);
            return passportData.data;
        } catch (error) {
            setNotFound(true);
        }
    };

    return (
        <>
            {passport ? (
                <div>
                    <div className="flex w-1/3 self-end m-auto">
                        <button
                            onClick={() => searchPassport(passport)}
                            className="w-full shadow-xl disabled:text-gray-400 disabled:border-gray-400 focus:outline-none text-beige font-work-sans border-2 rounded-lg border-beige hover:border-gold px-3 py-2"
                        >
                            Search
                        </button>
                    </div>
                    {notFound ? (
                        <div className="text-gold text-center mt-8">
                            Passport not found. Please try again.
                        </div>
                    ) : null}
                </div>
            ) : null}
        </>
    );
};

interface ButtonInitializeVerifier {
    setvkeyState: Dispatch<SetStateAction<string>>;
    setvkeyProof: SetVkeyProof;
    setvkeyVerifier: Dispatch<SetStateAction<any | null>>;
}

export const ButtonInitializeVerifier: FunctionComponent<
    ButtonInitializeVerifier
> = ({ setvkeyState, setvkeyProof, setvkeyVerifier }) => {
    const [disabled, setdisabled] = useState(false);
    const [loading, setloading] = useState(false);
    const [buttonText, setbuttonText] = useState('Initialize');
    return (
        <div className="flex">
            {loading ? (
                <div className="self-center">
                    <ThemeProvider theme={theme}>
                        <CircularProgress
                            size={25}
                            disableShrink
                            color="primary"
                        ></CircularProgress>
                    </ThemeProvider>
                </div>
            ) : (
                <button
                    disabled={disabled}
                    className="self-center shadow-xl disabled:text-gray-400 disabled:border-gray-400 focus:outline-none text-beige font-work-sans border-2 rounded-lg border-beige hover:border-gold px-3 py-2"
                    onClick={async () => {
                        setloading(true);
                        setvkeyState('Downloading verifier...');
                        const vkeyProof = await axios.get(
                            process.env['NEXT_PUBLIC_VKEY_URL'] as string
                        );
                        const vkeyVerifier = await axios.get(
                            process.env[
                                'NEXT_PUBLIC_VKEY_VERIFIER_URL'
                            ] as string
                        );
                        setvkeyProof(vkeyProof.data);
                        setvkeyVerifier(vkeyVerifier.data);
                        setvkeyState('Verifier ready.');
                        setdisabled(true);
                        setloading(false);
                    }}
                >
                    {buttonText}
                </button>
            )}
        </div>
    );
};
