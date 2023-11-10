pragma circom 2.1.5;

include "./rsa/rsa.circom";
include "./sha256Bytes.circom";
include "../node_modules/circomlib/circuits/sha256/sha256.circom";
include "../node_modules/circomlib/circuits/poseidon.circom";
include "./helpers/extract.circom";

template PassportVerifier(n, k) {
    signal input mrz[93]; // formatted mrz (5 + 88) chars
    signal input reveal_bitmap[88];
    signal input dataHashes[297];
    signal input eContentBytes[104];

    signal input pubkey[k];
    signal input signature[k];
    signal input address;

    // compute sha256 of formatted mrz
    signal mrzSha[256] <== Sha256Bytes(93)(mrz);

    // get output of sha256 into bytes to check against dataHashes
    component sha256_bytes[32];
    for (var i = 0; i < 32; i++) {
        sha256_bytes[i] = Bits2Num(8);
        for (var j = 0; j < 8; j++) {
            sha256_bytes[i].in[7 - j] <== mrzSha[i * 8 + j];
        }
    }

    // check that it is in the right position in dataHashes
    for(var i = 0; i < 32; i++) {
        dataHashes[31 + i] === sha256_bytes[i].out;
    }

    // hash dataHashes
    signal dataHashesSha[256] <== Sha256Bytes(297)(dataHashes);

    // get output of dataHashes sha256 into bytes to check against eContent
    component dataHashes_sha256_bytes[32];
    for (var i = 0; i < 32; i++) {
        dataHashes_sha256_bytes[i] = Bits2Num(8);
        for (var j = 0; j < 8; j++) {
            dataHashes_sha256_bytes[i].in[7 - j] <== dataHashesSha[i * 8 + j];
        }
    }

    // check that it is in the right position in eContent
    for(var i = 0; i < 32; i++) {
        eContentBytes[72 + i] === dataHashes_sha256_bytes[i].out;
    }

    // hash eContentBytes
    signal eContentSha[256] <== Sha256Bytes(104)(eContentBytes);

    // get output of eContentBytes sha256 into k chunks of n bits each
    var msg_len = (256 + n) \ n;

    component eContentHash[msg_len];
    for (var i = 0; i < msg_len; i++) {
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

    signal reveal[88];

    // reveal reveal_bitmap bits of MRZ
    for (var i = 0; i < 88; i++) {
        reveal[i] <== mrz[5+i] * reveal_bitmap[i];
    }
    
    signal output reveal_packed[3] <== PackBytes(88, 3, 31)(reveal);

    // signal output nullifier;
    // nullifier <== (signature[0] << 64) + signature[1];

    // Calculate the Poseidon hash of public public key and outputs it
    // This can be used to verify the public key is correct in contract without requiring the actual key
    // We are converting pub_key (modulus) in to 9 chunks of 242 bits, assuming original n, k are 121 and 17.
    // This is because Posiedon circuit only support array of 16 elements.
    // Otherwise we would have to output the ceil(256/31) = 9 field elements of the public key
    var k2_chunked_size = k >> 1;
    if(k % 2 == 1) {
        k2_chunked_size += 1;
    }
    signal pubkey_hash_input[k2_chunked_size];
    for(var i = 0; i < k2_chunked_size; i++) {
        if(i==k2_chunked_size-1 && k2_chunked_size % 2 == 1) {
            pubkey_hash_input[i] <== pubkey[2*i];
        } else {
            pubkey_hash_input[i] <== pubkey[2*i] + (1<<n) * pubkey[2*i+1];
        }
    }
    signal output pubkey_hash <== Poseidon(k2_chunked_size)(pubkey_hash_input);
}

component main { public [ address ] } = PassportVerifier(64, 32);

// Us:
// 1 + 2 + 3 + 1
// pubkey_hash + nullifier + reveal_packed + address
// we take nullifier = signature[0, 1] which it 64 + 64 bits long, so chance of collision is 2^128

// Them:
// 1 + 3 + 1
// pubkey_hash + reveal_twitter_packed + address

// Soit on on garde la bitmap privée et on rend l'output publique => on doit sortir 8*88 bits
// Soit on rend l'input publique et on rend seulement les output révélés publics => on doit sortir 88 bits + 8*reveal_chars bits