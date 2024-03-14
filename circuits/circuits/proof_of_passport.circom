pragma circom 2.1.5;

include "circomlib/circuits/poseidon.circom";
include "@zk-email/circuits/helpers/extract.circom";
include "./passport_verifier.circom";
include "./isOlderThan.circom";

// Proof of passport with majority check
// This circuit is used to prove that a passport is valid and that the user is major
// Majority is currently hardcoded in this circuit

template ProofOfPassport(n, k, max_datahashes_bytes) {
    signal input mrz[93]; // formatted mrz (5 + 88) chars
    signal input dataHashes[max_datahashes_bytes];
    signal input datahashes_padded_length;
    signal input eContentBytes[104];
    signal input pubkey[k];
    signal input signature[k];

    signal input reveal_bitmap[89];
    signal input address;

    signal input current_date[6]; // current date: YYMMDD
    signal input majority;

    // Verify passport
    component PV = PassportVerifier(n, k, max_datahashes_bytes);
    PV.mrz <== mrz;
    PV.dataHashes <== dataHashes;
    PV.datahashes_padded_length <== datahashes_padded_length;
    PV.eContentBytes <== eContentBytes;
    PV.pubkey <== pubkey;
    PV.signature <== signature;

    // Majority check
    component isOlderThan = IsOlderThan();
    isOlderThan.majority <== majority;

    for (var i = 0; i < 6; i++) {
        isOlderThan.currDate[i] <== current_date[i];
        isOlderThan.birthDateASCII[i] <== mrz[62 + i];
    }
    signal user_majority <== majority * isOlderThan.out;

    // reveal reveal_bitmap bits of MRZ
    signal reveal[89];
    for (var i = 0; i < 88; i++) {
        reveal[i] <== mrz[5+i] * reveal_bitmap[i];
    }

    // Add the majority as last bytes
    reveal[88] <== user_majority * reveal_bitmap[88];

    signal output reveal_packed[3] <== PackBytes(89, 3, 31)(reveal);

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

component main { public [ address,  current_date] } = ProofOfPassport(64, 32, 320);

// Us:
// 11 + 1 + 3 + 1
// pubkey + nullifier + reveal_packed + address

// Goal:
// 1 + 1 + 3 + 1
// pubkey_hash + nullifier + reveal_packed + address
