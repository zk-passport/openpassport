import fs from "fs";
import { groth16 } from "snarkjs";
import path from 'path';

const path_register_vkey = path.join(__dirname, '..', '..', 'circuits', 'register_sha256WithRSAEncryption_65537_vkey.json');
const path_csca_vkey = path.join(__dirname, '..', '..', 'circuits', 'dsc_4096_vkey.json');
const vkey_register = require(path_register_vkey);
const vkey_csca = require(path_csca_vkey);



// verify the proofs
export async function verifyProofs(proof: Proof, proof_csca: Proof) {
    const formatted_public_signals = parsePublicSignals(proof.publicSignals);
    const formatted_public_signals_csca = parsePublicSignals_csca(proof_csca.publicSignals);

    const verified_register = await groth16.verify(
        vkey_register,
        proof.publicSignals,
        proof.proof as any
    );

    // Restructure the CSCA proof to match the expected format
    const restructured_csca_proof = {
        pi_a: (proof_csca.proof as any).a.concat("1"),
        pi_b: [
            (proof_csca.proof as any).b[0],
            (proof_csca.proof as any).b[1],
            ["1", "0"]
        ],
        pi_c: (proof_csca.proof as any).c.concat("1"),
        protocol: 'groth16',
        curve: 'bn128'
    };
    //console.log("restructured_csca_proof :", restructured_csca_proof);
    const verified_csca = await groth16.verify(
        vkey_csca,
        proof_csca.publicSignals,
        restructured_csca_proof
    );
    //console.log("verified_csca :", verified_csca);

    const dsc_commitment_match = formatted_public_signals.blinded_dsc_commitment === formatted_public_signals_csca.blinded_dsc_commitment;
    return verified_register && verified_csca && dsc_commitment_match;
}
export const check_merkle_root = (merkle_root: string, proof_csca: Proof) => {
    const formatted_public_signals_csca = parsePublicSignals_csca(proof_csca.publicSignals);
    return merkle_root === formatted_public_signals_csca.merkle_root;
}
export const getNullifier = (proof: Proof) => {
    const formatted_public_signals = parsePublicSignals(proof.publicSignals);
    return formatted_public_signals.nullifier;
}

export const getCommitment = (proof: Proof) => {
    const formatted_public_signals = parsePublicSignals(proof.publicSignals);
    return formatted_public_signals.commitment;
}

export const getSIV = (proof: Proof) => {
    const formatted_public_signals = parsePublicSignals(proof.publicSignals);
    return formatted_public_signals.SIV;
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
        blinded_dsc_commitment: publicSignals[0],
        nullifier: publicSignals[1],
        commitment: publicSignals[2],
        attestation_id: publicSignals[3],
        SIV: publicSignals[4]
    }
}
export function parsePublicSignals_csca(publicSignals) {
    return {
        blinded_dsc_commitment: publicSignals[0],
        merkle_root: publicSignals[1]
    }
}