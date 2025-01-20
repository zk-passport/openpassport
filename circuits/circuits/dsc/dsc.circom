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
include "@zk-email/circuits/utils/bytes.circom";
include "@zk-email/circuits/utils/array.circom";


template DSC(signatureAlgorithm, n_dsc, k_dsc, n_csca, k_csca, max_cert_bytes, maxPubkeyBytesLength, nLevels) {

    assert(n_dsc * k_dsc == maxPubkeyBytesLength * 8);
   
    // variables verification
    assert(max_cert_bytes % 64 == 0);
    // assert(n_csca * k_csca > max_cert_bytes);
    assert(n_csca <= (255 \ 2));

    var hashLength = getHashLength(signatureAlgorithm);
    var kLengthFactor = getKLengthFactor(signatureAlgorithm);
    var kScaled = k_csca * kLengthFactor;
    var k_dsc_scaled = k_dsc * kLengthFactor;

    signal input raw_dsc_cert[max_cert_bytes]; 
    signal input raw_dsc_cert_padded_bytes;
    signal input csca_pubKey[kScaled];
    signal input signature[kScaled];
    signal input dsc_pubKey[k_dsc_scaled];
    signal input dsc_pubKey_offset;
    signal input dsc_pubkey_length_bytes;
    signal input secret;

    signal input merkle_root;
    signal input path[nLevels];
    signal input siblings[nLevels];


    // leaf
    signal leaf  <== LeafHasher(kScaled)(csca_pubKey, signatureAlgorithm);

    signal computed_merkle_root <== BinaryMerkleRoot(nLevels)(leaf, nLevels, path, siblings);
    merkle_root === computed_merkle_root;
    
    // verify certificate signature
    signal hashedCertificate[hashLength] <== ShaBytesDynamic(hashLength, max_cert_bytes)(raw_dsc_cert, raw_dsc_cert_padded_bytes);
    
    SignatureVerifier(signatureAlgorithm, n_csca, k_csca)(hashedCertificate, csca_pubKey, signature);

    signal pubkey_extracted_2[maxPubkeyBytesLength + 1];
    signal raw_dsc_cert_reversed[max_cert_bytes];
    for (var i=0; i<max_cert_bytes; i++) {
        raw_dsc_cert_reversed[i] <== raw_dsc_cert[max_cert_bytes - 1 - i];
    }

    component shiftLeft2 = VarShiftLeft(max_cert_bytes, maxPubkeyBytesLength);
    shiftLeft2.in <== raw_dsc_cert_reversed;
    //ecdsa
    if (kLengthFactor == 2) {
        signal pubkey_x_extracted[maxPubkeyBytesLength + 1];
        signal pubkey_y_extracted[maxPubkeyBytesLength + 1];

        shiftLeft2.shift <== max_cert_bytes - dsc_pubKey_offset - dsc_pubkey_length_bytes;
        pubkey_x_extracted[maxPubkeyBytesLength] <== 0;
        for (var i=0; i< maxPubkeyBytesLength; i++) {
            pubkey_x_extracted[i] <== shiftLeft2.out[i];
        }

        component shiftLeft3 = VarShiftLeft(max_cert_bytes, maxPubkeyBytesLength);
        shiftLeft3.in <== raw_dsc_cert_reversed;
        shiftLeft3.shift <== max_cert_bytes - (dsc_pubKey_offset + dsc_pubkey_length_bytes) - dsc_pubkey_length_bytes;
        pubkey_y_extracted[maxPubkeyBytesLength] <== 0;
        for (var i=0; i< maxPubkeyBytesLength; i++) {
            pubkey_y_extracted[i] <== shiftLeft3.out[i];
        }

        // component selectX = ByteMaskDynamic(maxPubkeyBytesLength);
        // selectX.in <== pubkey_x_extracted;
        // selectX.maxValidByte <== dsc_pubkey_length_bytes;
        // component selectY = ByteMaskDynamic(maxPubkeyBytesLength);
        // selectY.in <== pubkey_y_extracted;
        // selectY.maxValidByte <== dsc_pubkey_length_bytes;

        component selectX = SelectSubArray(maxPubkeyBytesLength + 1, maxPubkeyBytesLength);
        component selectY = SelectSubArray(maxPubkeyBytesLength + 1, maxPubkeyBytesLength);
        selectX.in <== pubkey_x_extracted;
        selectY.in <== pubkey_y_extracted;
        selectX.startIndex <== 0;
        selectY.startIndex <== 0;
        selectX.length <== dsc_pubkey_length_bytes;
        selectY.length <== dsc_pubkey_length_bytes;

        component wordsToBytes = WordsToBytes(n_dsc, k_dsc * 2, maxPubkeyBytesLength * 2);
        wordsToBytes.words <== dsc_pubKey;
        signal dsc_x_8bit[maxPubkeyBytesLength];
        signal dsc_y_8bit[maxPubkeyBytesLength];

        // Split the output bytes into x and y coordinates
        for (var i = 0; i < maxPubkeyBytesLength; i++) {
            dsc_x_8bit[i] <== wordsToBytes.bytes[i];
            dsc_y_8bit[i] <== wordsToBytes.bytes[i + maxPubkeyBytesLength];
        }

        // Verify both coordinates match
        for (var i = 0; i < maxPubkeyBytesLength; i++) {
            dsc_x_8bit[i] === selectX.out[i];
            dsc_y_8bit[i] === selectY.out[i];
        }
    } else {
        // verify DSC csca_pubKey
///////////////////////// approach 2
        shiftLeft2.shift <== max_cert_bytes - dsc_pubKey_offset - dsc_pubkey_length_bytes;
        pubkey_extracted_2[maxPubkeyBytesLength] <== 0;
        for (var i=0; i< maxPubkeyBytesLength; i++) {
            pubkey_extracted_2[i] <== shiftLeft2.out[i];
        }

        //More constraints in ByteMaskDynamic than in SelectSubArray
        // component byteMask = ByteMaskDynamic(maxPubkeyBytesLength);
        // for (var i=0; i< maxPubkeyBytesLength; i++) {
            // byteMask.in[i] <== pubkey_extracted_2[i];
        // }
        // byteMask.maxValidByte <== dsc_pubkey_length_bytes;
        component selectSubArray = SelectSubArray(maxPubkeyBytesLength + 1, maxPubkeyBytesLength);
        selectSubArray.in <== pubkey_extracted_2;
        selectSubArray.startIndex <== 0;
        selectSubArray.length <== dsc_pubkey_length_bytes;
        signal extracted_pubkey[maxPubkeyBytesLength];
        extracted_pubkey <== selectSubArray.out;

        component wordsToBytes = WordsToBytes(n_dsc, k_dsc, maxPubkeyBytesLength);
        wordsToBytes.words <== dsc_pubKey;

        for (var i=0; i<maxPubkeyBytesLength; i++) {
            extracted_pubkey[i] === wordsToBytes.bytes[i];
        }
    }

    // blinded dsc commitment
    signal pubkeyHash <== CustomHasher(k_dsc_scaled)(dsc_pubKey);
    signal output blinded_dsc_commitment <== Poseidon(2)([secret, pubkeyHash]);
}

template ByteMaskDynamic(maxLength) {
    signal input in[maxLength];
    signal input maxValidByte;
    signal output out[maxLength];

    component lt[maxLength];
    for (var i=0; i< maxLength; i++) {
        lt[i] = LessThan(32);
        lt[i].in[0] <== i;
        lt[i].in[1] <== maxValidByte;
        out[i] <== in[i] * lt[i].out;
    }
}

template WordsToBytes(n_words, k_words, maxBytesLength) {
    assert(n_words * k_words == maxBytesLength * 8);

    signal input words[k_words];
    signal output bytes[maxBytesLength];

    component num2bits[k_words];
    signal word_bits[k_words * n_words];

    // Convert words to bits
    for (var i = 0; i < k_words; i++) {
        num2bits[i] = Num2Bits(n_words);
        num2bits[i].in <== words[i];
    }
    for (var i = 0; i < k_words; i++) {
        for (var j = 0; j < n_words; j++) {
            word_bits[i * n_words + j] <== num2bits[i].out[j];
        }
    }

    // Convert bits back to bytes
    component bits2Num[maxBytesLength];
    for (var i = 0; i < maxBytesLength; i++) {
        bits2Num[i] = Bits2Num(8);
        for (var j = 0; j < 8; j++) {
            bits2Num[i].in[j] <== word_bits[i * 8 + j];
        }
        bytes[i] <== bits2Num[i].out;
    }
}