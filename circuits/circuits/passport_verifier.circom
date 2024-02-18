pragma circom 2.1.5;

include "@zk-email/circuits/helpers/rsa.circom";
include "@zk-email/circuits/helpers/extract.circom";
include "./sha256Bytes.circom";

// optimizations: cut data hashes to the only part required
// put the convertion to array of bytes inside the shaBytes.circom

template PassportVerifier(n, k) {
    // mrz: machine readable zone from passport formatted into array of bytes (5 + 88) chars | why + 5 chars ?
    signal input mrz[93];

    // dataHashes but how ? :  list of 297 bytes
    signal input dataHashes[297];

    // wtf is that ?
    signal input eContentBytes[104];

    // probably the pubkey that signed the passport
    signal input pubkey[k];

    // probably the signature of the passport
    signal input signature[k];

    /* Compute the sha256 of the formatted mrz and convert it to an array of 32 bytes (char)  */

    // compute sha256 of formatted mrz
    signal mrzSha[256] <== Sha256Bytes(93)(mrz);

    // mrzSha_bytes: list of 32 component Bits2Num which converts 8 bits into a Num
    component mrzSha_bytes[32];


    // This loop will cast the 256 bits from mrzSha into a list of 32 bytes
    //` get output of sha256 into bytes to check against dataHashes
    for (var i = 0; i < 32; i++) {
        mrzSha_bytes[i] = Bits2Num(8);

        for (var j = 0; j < 8; j++) {
            mrzSha_bytes[i].in[7 - j] <== mrzSha[i * 8 + j];
        }
    }

    // check that it is in the right position in dataHashes
    // passport stores a hash of the MRZ from bytes 32 to 64 of their dataHashes
    for(var i = 0; i < 32; i++) {
        dataHashes[31 + i] === mrzSha_bytes[i].out;
    }

    /* Hash data hashes and check there are in econtentBytes in range bytes 72 to 104 */

    // hash dataHashes
    signal dataHashesSha[256] <== Sha256Bytes(297)(dataHashes);


    // get output of dataHashes sha256 into bytes to check against eContent
    component dataHashesSha_bytes[32];
    for (var i = 0; i < 32; i++) {
        dataHashesSha_bytes[i] = Bits2Num(8);
        for (var j = 0; j < 8; j++) {
            dataHashesSha_bytes[i].in[7 - j] <== dataHashesSha[i * 8 + j];
        }
    }

    // check that it is in the right position in eContent
    for(var i = 0; i < 32; i++) {
        eContentBytes[72 + i] === dataHashesSha_bytes[i].out;
    }

    // hash eContentBytes
    signal eContentSha[256] <== Sha256Bytes(104)(eContentBytes);

    // get output of eContentBytes sha256 into k chunks of n bits each
    // get output of eContentBytes sha256 into k chunks of n bits each


    // msg_len = (256 // n) + 1
    var msg_len = (256 + n) \ n;

    // hash of econtet
    // create a list of length 256/n +1 of components of n bits

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