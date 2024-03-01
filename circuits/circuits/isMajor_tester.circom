pragma circom  2.1.6;

include "./isMajor.circom";

template isMajor_tester() {

    signal input majority;
    signal input currDate[6];
    signal input birthDateASCII[6];

    component is_major = IsMajor();
    is_major.majority <== majority;
    is_major.currDate <== currDate;
    is_major.birthDateASCII <== birthDateASCII;

    signal output out <== is_major.out;
}
component main = isMajor_tester();
