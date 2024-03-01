pragma circom 2.1.5;

include "@zk-email/circuits/helpers/rsa.circom";
include "@zk-email/circuits/helpers/extract.circom";
include "./sha256Bytes.circom";

// optimizations: cut data hashes to the only part required
// put the convertion to array of bytes inside the shaBytes.circom
// pb stands for padding bytes
template PassportVerifier(n, k) {

    // mrz: machine readable zone from passport formatted into array of bytes | 5 pb + 88 char
    signal input mrz[93];

    // dg_identifier : 1 byte
    // dg_hash : 32 bytes
    // dataHashes: contains the hashes of 7 DG of the passport | 24 pb + ( 4 pb + dg_identifier + 2 pb + dg_hash ) * 7
    signal input dataHashes[297];

    // dataHashes_hash : 32 bytes
    // eContentBytes: contains the hash of the dataHashes and other things | ?? + dataHashes_hash
    signal input eContentBytes[104];

    // pubkey that signed the passport
    signal input pubkey[k];

    // signature of the passport
    signal input signature[k];

    /*  sha256 formatted mrz and convert it to an array of 32 bytes  */

    // mrzSha: sha256 formatted mrz | 256 bits
    signal mrzSha[256] <== Sha256Bytes(93)(mrz);

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

    /* Hash data hashes and check there are in econtentBytes in range bytes 72 to 104 */

    // dataHashesSha: sha256 of dataHashes | 256 bits
    signal dataHashesSha[256] <== Sha256Bytes(297)(dataHashes);


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

    /*  sha256 eContentBytes, type it and verify its hash and the pubkey correspond to the signature */

    // eContentSha: eContentBytes hash | 256 bits
    signal eContentSha[256] <== Sha256Bytes(104)(eContentBytes);

    // get output of eContentBytes sha256 into k chunks of n bits each
    var msg_len = (256 + n) \ n;

    //eContentHash:  list of length 256/n +1 of components of n bits 
    component eContentHash[msg_len];
    for (var i = 0; i < msg_len; i++) {
        //instantiate each component of the list of Bits2Num of size n
        eContentHash[i] = Bits2Num(n);
    }
    for (var i = 0; i < 256; i++) {

        eContentHash[i \ n].in[i % n] <== eContentSha[255 - i];
    }
    for (var i = 256; i < n * msg_len; i++) {
        eContentHash[i \ n].in[i % n] <== 0;
    }
    
    // verify eContentHash signature
    component rsa = RSAVerify65537(64, 32);

    for (var i = 0; i < msg_len; i++) {
        rsa.base_message[i] <== eContentHash[i].out;
    }

    for (var i = msg_len; i < k; i++) {
        rsa.base_message[i] <== 0;
    }

    rsa.modulus <== pubkey;
    rsa.signature <== signature;
}