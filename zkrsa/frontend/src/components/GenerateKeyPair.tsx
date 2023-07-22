import bigInt from 'big-integer';
import { Dispatch, FunctionComponent, SetStateAction, useState } from 'react';
import { generateRSAKeyPair } from '../utils/crypto';

interface GenerateKeyPair {
    setkeyPair: Dispatch<SetStateAction<null | CryptoKeyPair>>;
    setjsonPublicKey: Dispatch<SetStateAction<null | JsonWebKey>>;
}

interface KeyPairDisplay {
    keypair: null | JsonWebKey;
}

export const KeyPairDisplay: FunctionComponent<KeyPairDisplay> = ({
    keypair,
}) => {
    const hexPubKey = keypair
        ? bigInt(
              Buffer.from(keypair.n!, 'base64').toString('hex'),
              16
          ).toString()
        : null;
    return (
        <>
            <div>{hexPubKey}</div>
        </>
    );
};

export const GenerateKeyPair: FunctionComponent<GenerateKeyPair> = ({
    setkeyPair,
    setjsonPublicKey,
}) => {
    return (
        <>
            <div className="my-5 ml-10">
                <button
                    onClick={async () => {
                        const keypair = await generateRSAKeyPair();
                        setkeyPair(keypair);
                        const jsonPubKey = await window.crypto.subtle.exportKey(
                            'jwk',
                            keypair.publicKey
                        );
                        setjsonPublicKey(jsonPubKey);
                    }}
                    className="border-black border-2"
                >
                    Generate key pair
                </button>
            </div>
        </>
    );
};
