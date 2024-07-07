import { groth16 } from "snarkjs";
import path from 'path';
import { numberToString } from "./common/src/utils/siv";

const path_register_vkey = path.join(__dirname, '..', '..', 'circuits', 'register_sha256WithRSAEncryption_65537_vkey.json');
const vkey_register = require(path_register_vkey);



// verify the proofs
export async function verifyProofs(proof: Proof) {
    const verified_register = await groth16.verify(
        vkey_register,
        proof.publicSignals,
        proof.proof as any
    );
    return verified_register;
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