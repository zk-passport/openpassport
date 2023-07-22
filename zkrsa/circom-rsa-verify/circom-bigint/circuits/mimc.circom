include "../circomlib/circuits/mimc.circom";

template MiMC7Compression(nRounds) {
    // This is an instantion of the Miyaguchi-Preneel compression mode with the
    // MiMC(x^7) block cipher
    signal input acc;
    signal input data;

    signal output out;
    component cipher = MiMC7(nRounds);
    cipher.x_in <== data;
    cipher.k <== acc;
    out <== data + acc + cipher.out;
}

