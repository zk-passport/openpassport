import { groth16 } from "snarkjs";
import path from 'path';
import { numberToString } from "./common/src/utils/siv";
import { verifyDSCValidity } from "./utils";
import { splitToWords } from "./common/src/utils/utils";
import { k_dsc, n_dsc } from "./common/src/constants/constants";
import forge from "node-forge";

const path_register_vkey = path.join(__dirname, '..', '..', 'circuits', 'register_sha256WithRSAEncryption_65537_vkey.json');
const vkey_register = require(path_register_vkey);



export async function verifyProofs(proof: Proof, dscCertificate_stringified: any, dev_mode: boolean = false) {
    const verified_register = await groth16.verify(
        vkey_register,
        proof.publicSignals,
        proof.proof as any
    );
    const dscCertificate = forge.pki.certificateFromPem(dscCertificate_stringified);
    console.log("proof verified:" + verified_register);
    const verified_certificate = verifyDSCValidity(dscCertificate, dev_mode);
    console.log("certificate verified:" + verified_register);

    // @ts-ignore
    const dsc_modulus = BigInt(dscCertificate.publicKey.n);
    const dsc_modulus_words = splitToWords(dsc_modulus, BigInt(n_dsc), BigInt(k_dsc));
    console.log("dsc_modulus_words", dsc_modulus_words);
    const modulus_from_proof = getDSCModulus(proof);
    console.log("modulus_from_proof", modulus_from_proof);

    const areArraysEqual = (arr1: string[], arr2: string[]) =>
        arr1.length === arr2.length &&
        arr1.every((value, index) => value === arr2[index]);

    const verified_modulus = areArraysEqual(dsc_modulus_words, modulus_from_proof);
    console.log("modulus verified:" + verified_modulus);
    return verified_register && verified_certificate && verified_modulus;
}
export const check_merkle_root = (merkle_root: string, proof_csca: Proof) => {
    const formatted_public_signals_csca = parsePublicSignals_csca(proof_csca.publicSignals);
    return merkle_root === formatted_public_signals_csca.merkle_root;
}
export const getNullifier = (proof: Proof) => {
    const formatted_public_signals = parsePublicSignals(proof.publicSignals);
    return formatted_public_signals.nullifier;
}

export const getDSCModulus = (proof: Proof) => {
    const formatted_public_signals = parsePublicSignals(proof.publicSignals);
    return formatted_public_signals.dsc_modulus;
}

export const getSIV = (proof: Proof) => {
    const formatted_public_signals = parsePublicSignals(proof.publicSignals);
    return numberToString(BigInt(formatted_public_signals.SIV));
}

export class Proof {
    publicSignals: string[];
    proof: string[];

    constructor(publicSignals: string[], proof: string[]) {
        this.publicSignals = publicSignals;
        this.proof = proof;
    }
}
export function parsePublicSignals(publicSignals) {
    return {
        nullifier: publicSignals[0],
        dsc_modulus: publicSignals.slice(1, 18),
        SIV: publicSignals[18],
    }
}

export function parsePublicSignals_csca(publicSignals) {
    return {
        blinded_dsc_commitment: publicSignals[0],
        merkle_root: publicSignals[1]
    }
}