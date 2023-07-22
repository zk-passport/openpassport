include "../circomlib/circuits/bitify.circom"

template FullAdder(w) {
    // An adder which adds 3 w-bit numbers and produces:
    // * a w-bit result and
    // * a w-bit carry
    signal input in0;
    signal input in1;
    signal input in2;

    signal output sum;
    signal output carry;
    signal output sumBits[w];
    signal output carryBits[2];

    signal rawSum;

    rawSum <== in0 + in1 + in2;

    carry <-- rawSum >> w;
    sum <-- rawSum % (2 ** w);
    rawSum === carry * 2 ** w + sum;

    component sumBitDecomp = Num2Bits(w);
    sumBitDecomp.in <== sum;
    for (var i = 0; i < w; i++) {
        sumBitDecomp.out[i] ==> sumBits[i];
    }

    component carryBitDecomp = Num2Bits(2);
    carryBitDecomp.in <== carry;
    for (var i = 0; i < 2; i++) {
        carryBitDecomp.out[i] ==> carryBits[i];
    }
}

template RippleCarryAdder(w, nWords) {
    // An adder which adds two nWords-word numbers of w-bit words together.

    signal input a[nWords];
    signal input b[nWords];

    signal output sum[nWords + 1];
    signal carry[nWords + 1];

    carry[0] <== 0;

    component adder[nWords];
    for (var i = 0; i < nWords; ++i) {
        adder[i] = FullAdder(w);
        adder[i].in0 <== carry[i];
        adder[i].in1 <== a[i];
        adder[i].in2 <== b[i];
        adder[i].sum ==> sum[i];
        adder[i].carry ==> carry[i + 1];
    }

    sum[nWords] <== carry[nWords];
}
