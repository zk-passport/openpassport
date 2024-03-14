pragma circom  2.1.6;

include "./isOlderThan.circom";

template isOlderThan_tester() {

    signal input majority;
    signal input currDate[6];
    signal input birthDateASCII[6];

    component is_older_than = isOlderThan();
    is_older_than.majority <== majority;
    is_older_than.currDate <== currDate;
    is_older_than.birthDateASCII <== birthDateASCII;

    signal output out <== is_older_than.out;
}
component main = isOlderThan_tester();
