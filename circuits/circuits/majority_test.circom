pragma circom 2.0.0;
include "circomlib/circuits/comparators.circom";
include "circomlib/circuits/bitify.circom";
include "./majority.circom";

/*** Only here to perform tests***/

template IsMajor_test(n) {
    signal input majority;
    // starts at position 62 of mrz
    signal input yymmdd[6];
    // current timestamp sliced in 4 bytes
    signal input current_timestamp[4];
    // output 0 or 1
    signal output out;

    component isMajor = IsMajor(n);
    isMajor.majority <== majority;
    isMajor.yymmdd <== yymmdd;
    isMajor.current_timestamp <== current_timestamp;

    out <== isMajor.out;
    
}
component main {public [ current_timestamp ] } = IsMajor_test(40);