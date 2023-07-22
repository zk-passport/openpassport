include "./bigint.circom";

template RSAggVerifyDelta(w, nN, nL, ct) {
    // quotient * challenge + remainder = prod_i(member[i])
    // witness = digestWithout ** quotient
    // check: witness ** challenge * digestWithout ** remainder = digestWith
    signal input modulus[nN];
    signal input digestWith[nN];
    signal input digestWithout[nN];
    signal input witness[nN];

    signal input member[ct][nL];
    signal input challenge[nL];

    // Initialize the (ct-1) exponent multipliers
    component expMult[ct - 1];
    for (var j = 0; j < ct - 1; ++j) {
        expMult[j] = MultiplierReducer(w, nL);

        // The challenge is their modulus
        for (var i = 0; i < nL; ++i) {
            expMult[j].modulus[i] <== challenge[i];
        }
    }

    // Connect the first member to the first multiplier
    for (var i = 0; i < nL; ++i) {
        expMult[0].a[i] <== member[0][i];
    }

    // Wire the rest of the multipliers
    for (var j = 1; j < ct; ++j) {

        // Wire in the member
        for (var i = 0; i < nL; ++i) {
            expMult[j - 1].b[i] <== member[j][i];
        }

        // Pass along the output
        if (j != ct - 1) {
            for (var i = 0; i < nL; ++i) {
                expMult[j].b[i] <== expMult[j - 1].prod[i];
            }
        }
    }

    // Now, expMult[ct - 2].prod contains `remainder`

    component witnessPower = PowerMod(w, nN, nL);
    component remainderPower = PowerMod(w, nN, nL);
    component prod = MultiplierReducer(w, nN);

    // Compute witness ** challenge
    for (var i = 0; i < nN; ++i) {
        witnessPower.modulus[i] <== modulus[i];
        witnessPower.base[i] <== witness[i];
    }
    for (var i = 0; i < nL; ++i) {
        witnessPower.exp[i] <== challenge[i];
    }

    // Compute digestWithout ** remainder
    for (var i = 0; i < nN; ++i) {
        remainderPower.base[i] <== digestWithout[i];
        remainderPower.modulus[i] <== modulus[i];
    }
    for (var i = 0; i < nL; ++i) {
        remainderPower.exp[i] <== expMult[ct - 2].prod[i];
    }

    // Compute the product
    for (var i = 0; i < nN; ++i) {
        prod.modulus[i] <== modulus[i];
        prod.a[i] <== witnessPower.out[i];
        prod.b[i] <== remainderPower.out[i];
    }

    // Verify
    for (var i = 0; i < nN; ++i) {
        prod.prod[i] === digestWith[i];
    }
}
