//@ts-ignore
import { unstringifyBigInts } from 'snarkjs/src/stringifybigint';
//@ts-ignore
import snarkjs from 'snarkjs';
import axios from 'axios';

export const downloadVerifier = async (url: string) => {
    const vkeyVerifier = (
        await axios.get(process.env['NEXT_PUBLIC_VKEY_VERIFIER_URL'] as string)
    ).data;
    return vkeyVerifier;
};

export const validity = async (
    vkeyVerifier: any,
    proof: any,
    publicSignals: any
) => {
    return snarkjs.original.isValid(
        unstringifyBigInts(vkeyVerifier),
        unstringifyBigInts(proof),
        unstringifyBigInts(publicSignals)
    );
};
