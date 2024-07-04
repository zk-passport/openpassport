pragma circom 2.1.5;

include "circomlib/circuits/poseidon.circom";
include "@zk-email/circuits/utils/bytes.circom";
include "./passport_verifier_sha256WithRSAEncryption_65537.circom";
include "binary-merkle-root.circom";
include "./utils/splitSignalsToWords.circom";

template Register_sha256WithRSAEncryption_65537(n, k, max_datahashes_bytes) {
    signal input mrz[93];
    signal input dg1_hash_offset;
    signal input econtent[max_datahashes_bytes];
    signal input datahashes_padded_length;
    signal input signed_attributes[104];
    signal input signature[k];
    signal input dsc_modulus[k];
    signal input SIV;

    // assert nationality is USA (commented, can be checked with DSC)
    // mrz[54 + 5] === 85;
    // mrz[55 + 5] === 83;
    // mrz[56 + 5] === 65;

    component splitSignalsToWords_signature = SplitSignalsToWords(n,k,230,9);
    splitSignalsToWords_signature.in <== signature;

    component nullifier_hasher = Poseidon(9);
    for (var i= 0; i < 9; i++) {
        nullifier_hasher.inputs[i] <== splitSignalsToWords_signature.out[i];
    }
    signal output nullifier <== nullifier_hasher.out;

    // Verify passport validity
    component PV = PassportVerifier_sha256WithRSAEncryption_65537(n, k, max_datahashes_bytes);
    PV.mrz <== mrz;
    PV.dg1_hash_offset <== dg1_hash_offset;
    PV.dataHashes <== econtent;
    PV.datahashes_padded_length <== datahashes_padded_length;
    PV.eContentBytes <== signed_attributes;
    PV.dsc_modulus <== dsc_modulus;
    PV.signature <== signature;
}

// We hardcode 1 here for sha256WithRSAEncryption_65537
component main { public [ SIV, dsc_modulus] } = Register_sha256WithRSAEncryption_65537(121, 17, 320);
