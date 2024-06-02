pragma circom 2.1.5;

include "circomlib/circuits/poseidon.circom";
include "./utils/chunk_data.circom";
include "./utils/compute_pubkey_leaf.circom";
include "binary-merkle-root.circom";
include "passport_verifier_sha256WithRSAEncryption_65537.circom";


template Register_sha256WithECDSA_Secp256k1(n, k, max_datahashes_bytes, nLevels, signatureAlgorithm) {
    signal input secret;

    signal input mrz[93];
    signal input econtent[max_datahashes_bytes];
    signal input datahashes_padded_length;
    signal input signed_attributes[104];
    signal input sig_r[k];
    signal input sig_s[k];

    signal input pubkey[2][k];
    signal input merkle_root;
    signal input path[nLevels];
    signal input siblings[nLevels];

    signal input attestation_id;

    // Verify inclusion of the pubkey in the pubkey tree
    signal leaf <== ComputePubkeyLeaf(n, k, signatureAlgorithm)(pubkey[0]);
    signal computed_merkle_root <== BinaryMerkleRoot(nLevels)(leaf, nLevels, path, siblings);
    merkle_root === computed_merkle_root;

    // Verify passport validity
    component PV = PassportVerifier_sha256WithECDSA_Secp256k1(n, k, max_datahashes_bytes);
    PV.mrz <== mrz;
    PV.dataHashes <== econtent;
    PV.datahashes_padded_length <== datahashes_padded_length;
    PV.eContentBytes <== signed_attributes;
    PV.pubkey <== pubkey;
    PV.sig_r <== sig_r;
    PV.sig_s <== sig_s;

    // Generate the commitment
    component poseidon_hasher = Poseidon(6);
    poseidon_hasher.inputs[0] <== secret;
    poseidon_hasher.inputs[1] <== attestation_id;
    poseidon_hasher.inputs[2] <== leaf;

    signal mrz_packed[3] <== PackBytes(93, 3, 31)(mrz);
    for (var i = 0; i < 3; i++) {
        poseidon_hasher.inputs[i + 3] <== mrz_packed[i];
    }
    signal output commitment <== poseidon_hasher.out;

    // Generate the nullifier 
    var chunk_size = 11;  // Since ceil(32 / 3) in integer division is 11
    signal chunked_signature[chunk_size] <== ChunkData(n, k, chunk_size)(signature);
    signal output nullifier <== Poseidon(chunk_size)(chunked_signature);
}

component main { public [ merkle_root, attestation_id ] } = Register_sha256WithECDSA_Secp256k1(64, 32, 320, 16, 6);
