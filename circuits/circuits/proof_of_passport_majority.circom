pragma circom 2.1.5;

include "circomlib/circuits/poseidon.circom";
include "@zk-email/circuits/helpers/extract.circom";
include "./passport_verifier.circom";
include "./majority.circom";

template ProofOfPassport(n, k) {
    signal input mrz[93]; // formatted mrz (5 + 88) chars
    signal input dataHashes[297];
    signal input eContentBytes[104];
    signal input pubkey[k];
    signal input signature[k];

    signal input reveal_bitmap[88];
    signal input address;

    signal input current_timestamp[4]; // current timestamp; 4 bytes

    signal majority; // currently hardcoded in the circuit, should be passed as input
    majority <== 18;

    // Verify passport
    component PV = PassportVerifier(n, k);
    PV.mrz <== mrz;
    PV.dataHashes <== dataHashes;
    PV.eContentBytes <== eContentBytes;
    PV.pubkey <== pubkey;
    PV.signature <== signature;

    component isMajor = IsMajor(40);
    isMajor.majority <== majority;
    isMajor.current_timestamp <== current_timestamp;
    signal subMRZ[6];
    for (var i = 0; i < 6; i++) {
        subMRZ[i] <== mrz[62 + i];
    }
    isMajor.yymmdd <== subMRZ;

    // reveal reveal_bitmap bits of MRZ
    signal reveal[89];
    for (var i = 0; i < 88; i++) {
        reveal[i] <== mrz[5+i] * reveal_bitmap[i];
    }
    reveal[88] <== majority * isMajor.out;

    signal output reveal_packed[3] <== PackBytes(89, 3, 31)(reveal);

    // if the age is revealead check that it i





    // make nullifier public;
    // we take nullifier = signature[0, 1] which it 64 + 64 bits long, so chance of collision is 2^128
    signal output nullifier <== signature[0] * 2**64 + signature[1];

    // we don't do Poseidon hash cuz it makes arkworks crash for obscure reasons
    // we output the pubkey as 11 field elements. 9 is doable also cuz ceil(254/31) = 9
    signal output pubkey_packed[11];
    for (var i = 0; i < 11; i++) {
        if (i < 10) {
            pubkey_packed[i] <== pubkey[3*i] * 64 * 64 + pubkey[3*i + 1] * 64 + pubkey[3*i + 2];
        } else {
            pubkey_packed[i] <== pubkey[3*i] * 64 * 64;
        }
    }
}

component main { public [ address,  current_timestamp] } = ProofOfPassport(64, 32);

// Us:
// 11 + 1 + 3 + 1
// pubkey + nullifier + reveal_packed + address

// Goal:
// 1 + 1 + 3 + 1
// pubkey_hash + nullifier + reveal_packed + address
