import { Dispatch, SetStateAction } from 'react';
import { splitToWords } from './crypto';

export enum InputInvalidity {
    MISSING = 'missing',
    INVALID_CHARACTER = 'input should be integers only.',
    INVALID_PROOF_FILE = 'proof file is invalid.',
    INVALID_PASSPORT_NUMBER = 'invalid passport number (e.g. 12AB34567).',
}

export const isValidIntegerInput = (
    value: string,
    setvalue: Dispatch<SetStateAction<any | null>>,
    seterror: Dispatch<SetStateAction<any | null>>
) => {
    try {
        const _ignore = splitToWords(value, 64, 32, 'sign');
        setvalue(value);
        seterror(null);
        return true;
    } catch (error) {
        seterror(InputInvalidity.INVALID_CHARACTER);
        return false;
    }
};

function isValidPassportId(passportId: string): boolean {
    // Define a regex pattern: 2 digits followed by 2 uppercase letters followed by 5 digits
    const regex = /^[0-9]{2}[A-Z]{2}[0-9]{5}$/;

    // Test the passportId against the regex
    return regex.test(passportId);
}

export const isValidPassportInput = (
    value: string,
    setvalue: Dispatch<SetStateAction<any | null>>,
    seterror: Dispatch<SetStateAction<any | null>>
) => {
    try {
        if (!isValidPassportId(value)) throw Error();
        console.log('hey');
        setvalue(value);
        seterror(null);
        return true;
    } catch (error) {
        seterror(InputInvalidity.INVALID_PASSPORT_NUMBER);
        return false;
    }
};

export const validateProofJSON = (proofFile: any) => {
    const expectedKeys = ['proof', 'publicSignals'];
    if (Object.keys(proofFile).length != 2)
        throw Error('Proof file has too many keys');
    Object.keys(proofFile).map((k, i) => {
        if (expectedKeys[i] !== k)
            throw Error('Proof file does not have required keys');
    });
    return true;
};
