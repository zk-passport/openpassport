pragma circom 2.1.9;

include "circomlib/circuits/bitify.circom";
include "../utils/crypto/hasher/shaBytes/shaBytesDynamic.circom";
include "circomlib/circuits/comparators.circom";
include "../utils/crypto/hasher/hash.circom";
include "circomlib/circuits/poseidon.circom";
include "@zk-kit/binary-merkle-root.circom/src/binary-merkle-root.circom";
include "../utils/passport/customHashers.circom";
include "../utils/passport/signatureAlgorithm.circom";
include "../utils/passport/signatureVerifier.circom";
include "../utils/crypto/utils/WordToBytes.circom";
include "../utils/passport/constants.circom";
include "../utils/passport/dsc/StandardizePubKeyTo35Words.circom";
include "../utils/passport/dsc/ExtractPublicKey.circom";

///@input dsc_pubKey_offset offset of the DSC public key in the certificate
///@input dsc_pubkey_length_bytes length of the DSC public key in bytes. For ECDSA, it is x+y length
template DSC(signatureAlgorithm, n_csca, k_csca, max_cert_bytes, nLevels) {
    var maxPubkeyBytesLength = getMaxDscPubKeyLength();
   
    // variables verification
    assert(max_cert_bytes % 64 == 0);
    // assert(n_csca * k_csca > max_cert_bytes);
    assert(n_csca <= (255 \ 2));

    var hashLength = getHashLength(signatureAlgorithm);
    var kLengthFactor = getKLengthFactor(signatureAlgorithm);
    var kScaled = k_csca * kLengthFactor;

    signal input raw_dsc_cert[max_cert_bytes];
    signal input raw_dsc_cert_padded_bytes;
    signal input csca_pubKey[kScaled];
    signal input signature[kScaled];
    signal input dsc_pubKey_offset;
    signal input dsc_pubkey_length_bytes;
    signal input merkle_root;
    signal input path[nLevels];
    signal input siblings[nLevels];
    signal input salt;

    // check offsets refer to valid ranges
    signal dscPubkeyOffsetInRange <== LessEqThan(14)([dsc_pubKey_offset + dsc_pubkey_length_bytes, raw_dsc_cert_padded_bytes]); 
    dscPubkeyOffsetInRange === 1;

    // leaf
    signal leaf <== CustomHasher(kScaled)(csca_pubKey);

    signal computed_merkle_root <== BinaryMerkleRoot(nLevels)(leaf, nLevels, path, siblings);
    merkle_root === computed_merkle_root;
    
    // verify certificate signature
    signal hashedCertificate[hashLength] <== ShaBytesDynamic(hashLength, max_cert_bytes)(raw_dsc_cert, raw_dsc_cert_padded_bytes);
    SignatureVerifier(signatureAlgorithm, n_csca, k_csca)(hashedCertificate, csca_pubKey, signature);

    signal extracted_pubkey[maxPubkeyBytesLength] <== SelectSubArray(max_cert_bytes, maxPubkeyBytesLength)(raw_dsc_cert, dsc_pubKey_offset, dsc_pubkey_length_bytes);

    log("extracted_pubkey[0]", extracted_pubkey[0]);
    log("extracted_pubkey[1]", extracted_pubkey[1]);
    log("extracted_pubkey[2]", extracted_pubkey[2]);

    log("extracted_pubkey[254]", extracted_pubkey[254]);
    log("extracted_pubkey[255]", extracted_pubkey[255]);
    log("extracted_pubkey[256]", extracted_pubkey[256]);
    log("extracted_pubkey[257]", extracted_pubkey[257]);
    log("extracted_pubkey[524]", extracted_pubkey[524]);

    signal standardized_pubkey[35] <== SplitBytesToWords(maxPubkeyBytesLength, 120, 35)(extracted_pubkey);

    for (var i = 0; i < 35; i++) {
        log("standardized_pubkey[", i, "]", standardized_pubkey[i]);
    }

    signal pubKey_dsc_hash <== CustomHasher(35)(standardized_pubkey);
    signal pubKey_csca_hash <== CustomHasher(kScaled)(csca_pubKey);
    
    log("salt", salt);
    log("dsc_pubkey_length_bytes", dsc_pubkey_length_bytes);
    log("pubKey_dsc_hash", pubKey_dsc_hash);
    log("pubKey_csca_hash", pubKey_csca_hash);

    // Compute glue values
    signal output glue <== Poseidon(4)([salt, dsc_pubkey_length_bytes, pubKey_dsc_hash, pubKey_csca_hash]);
}