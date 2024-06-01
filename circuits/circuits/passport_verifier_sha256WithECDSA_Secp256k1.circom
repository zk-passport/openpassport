pragma circom 2.1.5;

include "@zk-email/circuits/helpers/sha.circom";
include "./utils/Sha256BytesStatic.circom";
include "circom-ecdsa/circuits/ecdsa.circom";

// NOTE: public key membership check is not performed inside circuit for optimization reasons.

template PassportVerifier_sha256WithECDSA_Secp256k1(n, k, max_datahashes_bytes) {
    signal input mrz[93]; // formatted mrz (5 + 88) chars
    signal input dataHashes[max_datahashes_bytes];
    signal input datahashes_padded_length;
    signal input eContentBytes[104];

    // pubkey point that signed the passport 
    signal input pubkey[2][k];

    // signature of the passport
    signal input sig_r[k];
    signal input sig_s[k];

    // compute sha256 of formatted mrz
    signal mrzSha[256] <== Sha256BytesStatic(93)(mrz);

    // mrzSha_bytes: list of 32 Bits2Num
    component mrzSha_bytes[32];

    // cast the 256 bits from mrzSha into a list of 32 bytes
    for (var i = 0; i < 32; i++) {
        mrzSha_bytes[i] = Bits2Num(8);

        for (var j = 0; j < 8; j++) {
            mrzSha_bytes[i].in[7 - j] <== mrzSha[i * 8 + j];
        }
    }

    // assert mrz_hash equals the one extracted from dataHashes input (bytes 32 to 64)
    for(var i = 0; i < 32; i++) {
        dataHashes[31 + i] === mrzSha_bytes[i].out;
    }

    // hash dataHashes dynamically
    signal dataHashesSha[256] <== Sha256Bytes(max_datahashes_bytes)(dataHashes, datahashes_padded_length);

    // get output of dataHashes sha256 into bytes to check against eContent
    component dataHashesSha_bytes[32];
    for (var i = 0; i < 32; i++) {
        dataHashesSha_bytes[i] = Bits2Num(8);
        for (var j = 0; j < 8; j++) {
            dataHashesSha_bytes[i].in[7 - j] <== dataHashesSha[i * 8 + j];
        }
    }

    // assert dataHashesSha is in eContentBytes in range bytes 72 to 104
    for(var i = 0; i < 32; i++) {
        eContentBytes[72 + i] === dataHashesSha_bytes[i].out;
    }

    // hash eContentBytes
    signal eContentSha[256] <== Sha256BytesStatic(104)(eContentBytes);

    // get output of eContentBytes sha256 into k chunks of n bits each
    var msg_len = 256 \ n;

    //eContentHash:  list of length 256/n of components of n bits 
    component eContentHash[msg_len];
    for (var i = 0; i < msg_len; i++) {
        //instantiate each component of the list of Bits2Num of size n
        eContentHash[i] = Bits2Num(n);
    }

    for (var i = 0; i < 256; i++) {
        eContentHash[i \ n].in[i % n] <== eContentSha[255 - i];
    }

    // verify eContentHash signature
    component ecdsa = ECDSAVerifyNoPubkeyCheck(n, k);

    for (var i = 0; i < msg_len; i++) {
        ecdsa.msg_hash[i] <== eContentHash[i].out;
        ecdsa.r[i] <== sig_r[i];
        ecdsa.s[i] <== sig_s[i];
        ecdsa.pubkey[0][i] <== pubkey[0][i];
        ecdsa.pubkey[1][i] <== pubkey[1][i];
    }

    ecdsa.result === 1;
}