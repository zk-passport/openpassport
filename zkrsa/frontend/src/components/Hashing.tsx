import bigInt from 'big-integer';
import { FunctionComponent, useEffect } from 'react';
import { hash } from '../utils/crypto';
import { InputText } from './Inputs';
//@ts-ignore
import * as ab2str from 'arraybuffer-to-string';
import { PropsHashMessage, PropsHashText } from '../types';

const HashText: FunctionComponent<PropsHashText> = ({
    text,
    hashValue,
    sethashValue,
}) => {
    useEffect(() => {
        (async function () {
            if (text) {
                const hashValue = await hash(text, new TextEncoder());
                const digestDecimal = bigInt(
                    ab2str(hashValue, 'hex'),
                    16
                ).toString();
                sethashValue(digestDecimal);
            } else {
                sethashValue(null);
            }
        })();
    }, [text, sethashValue]);

    return (
        <>
            <div className="ml-10">Message: {text}</div>
            <div className="ml-10">Hash: {hashValue}</div>
        </>
    );
};

export const HashMessage: FunctionComponent<PropsHashMessage> = ({
    sethashValue,
    setuserText,
    userText,
    hashValue,
}) => {
    return (
        <>
            <InputText setuserText={setuserText}></InputText>
            <HashText
                text={userText}
                hashValue={hashValue}
                sethashValue={sethashValue}
            ></HashText>
        </>
    );
};
