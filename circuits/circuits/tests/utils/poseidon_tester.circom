pragma circom 2.1.9;

include "circomlib/circuits/poseidon.circom";

template PoseidonTester() {
    signal input in;
    signal output out;

    component poseidon_hasher = Poseidon(10);
    poseidon_hasher.inputs[0] <== in;
    poseidon_hasher.inputs[1] <== in;
    poseidon_hasher.inputs[2] <== in;
    poseidon_hasher.inputs[3] <== in;
    poseidon_hasher.inputs[4] <== in;
    poseidon_hasher.inputs[5] <== in;
    poseidon_hasher.inputs[6] <== in;
    poseidon_hasher.inputs[7] <== in;
    poseidon_hasher.inputs[8] <== in;
    poseidon_hasher.inputs[9] <== in;

    out <== poseidon_hasher.out;
}

component main = PoseidonTester();
