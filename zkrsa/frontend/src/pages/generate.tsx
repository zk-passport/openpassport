import { NextPage } from 'next';
import { Title, NavMenu } from '../components/Navigation';
import { HashMessage } from '../components/Hashing';
import { GenerateKeyPair, KeyPairDisplay } from '../components/GenerateKeyPair';
import { FunctionComponent, useEffect, useState } from 'react';
import { sign } from '../utils/crypto';
import bigInt from 'big-integer';
//@ts-ignore
import ab2str from 'arraybuffer-to-string';
import { PropsSignedMessage } from '../types';

export const SignedMessage: FunctionComponent<PropsSignedMessage> = ({
    keypair,
    message,
    setSignedMessage,
    signedMessage,
}) => {
    useEffect(() => {
        (async () => {
            if (message && keypair) {
                const signedMessage = await sign(
                    keypair,
                    message,
                    new TextEncoder()
                );
                setSignedMessage(signedMessage);
            }
        })();
    }, [keypair, message, setSignedMessage]);
    const displayText = signedMessage
        ? bigInt(ab2str(signedMessage, 'hex'), 16).toString()
        : '';
    return <>{displayText}</>;
};

/**
 * Generate a new RSA key pair and sign a message with it.
 * @returns
 */
const Generate: NextPage = () => {
    const [userText, setuserText] = useState<string | null>(null);
    const [hashValue, sethashValue] = useState<string | null>(null);
    const [keyPair, setkeyPair] = useState<null | CryptoKeyPair>(null);
    const [jsonPublicKey, setjsonPublicKey] = useState<null | JsonWebKey>(null);
    const [signedMessage, setsignedMessage] = useState<null | ArrayBuffer>(
        null
    );

    return (
        <div>
            <Title></Title>
            <NavMenu></NavMenu>
            <HashMessage
                userText={userText}
                hashValue={hashValue}
                setuserText={setuserText}
                sethashValue={sethashValue}
            ></HashMessage>
            <GenerateKeyPair
                setjsonPublicKey={setjsonPublicKey}
                setkeyPair={setkeyPair}
            ></GenerateKeyPair>
            <KeyPairDisplay keypair={jsonPublicKey}></KeyPairDisplay>
            <SignedMessage
                signedMessage={signedMessage}
                setSignedMessage={setsignedMessage}
                message={userText}
                keypair={keyPair}
            ></SignedMessage>
        </div>
    );
};

export default Generate;
