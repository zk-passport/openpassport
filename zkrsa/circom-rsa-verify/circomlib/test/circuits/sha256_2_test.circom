include "../../circuits/sha256/sha256_2.circom";

template Main() {
    signal private input a;
    signal private input b;
    signal output out;

    component sha256_2 = Sha256_2();

    sha256_2.a <== a;
    sha256_2.b <== b;
    out <== sha256_2.out;
}

component main = Main();
