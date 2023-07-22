import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
import fs from 'fs';
import { InputInvalidity } from '../src/utils/inputs';

global.TextEncoder = TextEncoder;
//@ts-ignore
global.TextDecoder = TextDecoder;

export const validProof = fs.readFileSync('__mocks__/proofs/correct.json');
export const invalidProof = fs.readFileSync('__mocks__/proofs/incorrect.json');
export const verifier = fs.readFileSync('__mocks__/vk/verifier.json');
export const correctFileName = 'correctProof.json';
export const validProofFile = new File([validProof], correctFileName, {
    type: 'json',
});
export const incorrectFileName = 'incorrectProof.json';
export const invalidProofFile = new File([invalidProof], incorrectFileName, {
    type: 'json',
});
export const invalidProofFileError = `${incorrectFileName} ${InputInvalidity.INVALID_PROOF_FILE}`;
