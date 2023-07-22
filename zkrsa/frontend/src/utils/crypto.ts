import bigInt from 'big-integer';

export const generateRSAKeyPair = async (): Promise<CryptoKeyPair> => {
    const keyPair = await window.crypto.subtle.generateKey(
        {
            name: 'RSASSA-PKCS1-v1_5',
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: 'SHA-256',
        },
        true,
        ['sign', 'verify']
    );
    return keyPair;
};

export const hash = async (message: string, textEncoder: TextEncoder) => {
    const digest = await window.crypto.subtle.digest(
        'SHA-256',
        textEncoder.encode(message)
    );
    return digest;
};

export const sign = async (
    RSAKeyPair: CryptoKeyPair,
    message: string,
    textEncoder: TextEncoder
) => {
    const signature = await window.crypto.subtle.sign(
        'RSASSA-PKCS1-v1_5',
        RSAKeyPair.privateKey,
        textEncoder.encode(message)
    );
    return signature;
};

//@ts-ignore
export function splitToWords(x, w, n, name) {
    let t = bigInt(x);
    w = bigInt(w);
    n = bigInt(n);
    const words = {};
    for (let i = 0; i < n; ++i) {
        //@ts-ignore
        words[`${name}[${i}]`] = `${t.mod(bigInt(2).pow(w))}`;
        t = t.divide(bigInt(2).pow(w));
    }
    if (!t.isZero()) {
        throw `Number ${x} does not fit in ${w * n} bits`;
    }
    return words;
}
