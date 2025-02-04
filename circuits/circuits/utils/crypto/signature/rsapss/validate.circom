pragma circom 2.1.6;

include "../../bigInt/bigInt.circom";
include "../../utils/isNBits.circom";

template ValidateRsaPss(CHUNK_SIZE, CHUNK_NUMBER, KEY_LENGTH) {
    signal input pubkey[CHUNK_NUMBER]; 
    signal input signature[CHUNK_NUMBER];
    
    var fullChunks = KEY_LENGTH \ CHUNK_SIZE;
    var remainingBits = KEY_LENGTH % CHUNK_SIZE;

    component sigBitChecks[CHUNK_NUMBER];
    component pubkeyBitChecks[CHUNK_NUMBER];

    // Check value in each chunk can be represented in CHUNK_SIZE bits
    for (var i = 0; i < fullChunks; i++) {
        sigBitChecks[i] = isNBits(CHUNK_SIZE);
        pubkeyBitChecks[i] = isNBits(CHUNK_SIZE);
        sigBitChecks[i].in <== signature[i];
        pubkeyBitChecks[i].in <== pubkey[i];
    }
    if (remainingBits > 0) {
        sigBitChecks[fullChunks] = isNBits(remainingBits);
        pubkeyBitChecks[fullChunks] = isNBits(remainingBits);
        sigBitChecks[fullChunks].in <== signature[fullChunks];
        pubkeyBitChecks[fullChunks].in <== pubkey[fullChunks];
    }
    for(var i = fullChunks + 1; i < CHUNK_NUMBER; i++) {
        signature[i] === 0;
        pubkey[i] === 0;
    }

    //signature cannot exceed public key modulus
    component bigLessEqThan = BigLessEqThan(CHUNK_SIZE, CHUNK_NUMBER);
    bigLessEqThan.in[0] <== signature;
    bigLessEqThan.in[1] <== pubkey;
    bigLessEqThan.out === 1;
}