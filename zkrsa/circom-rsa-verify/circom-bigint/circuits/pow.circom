include "../circomlib/circuits/bitify.circom"

template PowerMod(w, nb, ne) {
    // Constraints:
    //    <= 2 * w * ne * (w + 2) * (4nb - 1)
    signal input base[nb];
    signal input exp[ne];

    signal input modulus[nb];
    signal output out[nb];

    component powerBinExp = PowerModBin(w, nb, ne * w);

    component expDecomp[ne];
    for (var i = 0; i < nb; ++i) {
        powerBinExp.base[i] <== base[i];
        powerBinExp.modulus[i] <== modulus[i];
    }
    for (var i = 0; i < ne; ++i) {
        expDecomp[i] = Num2Bits(w);
        expDecomp[i].in <== exp[i];
        for (var j = 0; j < w; ++j) {
            powerBinExp.binaryExp[i * w + j] <== expDecomp[i].out[j];
        }
    }
    for (var i = 0; i < nb; ++i) {
        out[i] <== powerBinExp.out[i];
    }
}

template PowerModBin(w, nb, bitsExp) {
    //
    // Constraints:
    //    2 * bitsExp * 2(2nw + 4n - w - 1)     for two multipliers per exp bit
    //    bitsExp * 1                           for one ternary per exp bit
    //    <= 4 * bitsExp * (2nw + 4n - w)       total
    signal input base[nb];
    signal input binaryExp[bitsExp];

    signal input modulus[nb];
    signal output out[nb];
    if (bitsExp == 0) {
        out[0] <== 1;
        for (var i = 1; i < nb; ++i) {
            out[i] <== 0;
        }
    } else {
        component recursive = PowerModBin(w, nb, bitsExp - 1);
        component square = MultiplierReducer(w, nb);
        component mult = MultiplierReducer(w, nb);
        for (var i = 0; i < nb; ++i) {
            square.modulus[i] <== modulus[i];
            square.a[i] <== base[i];
            square.b[i] <== base[i];
        }
        for (var i = 0; i < nb; ++i) {
            recursive.base[i] <== square.prod[i];
            recursive.modulus[i] <== modulus[i];
        }
        for (var i = 0; i < bitsExp - 1; ++i) {
            recursive.binaryExp[i] <== binaryExp[i + 1];
        }
        for (var i = 0; i < nb; ++i) {
            mult.modulus[i] <== modulus[i];
            mult.a[i] <== base[i];
            mult.b[i] <== recursive.out[i];
        }
        for (var i = 0; i < nb; ++i) {
            out[i] <== recursive.out[i] + binaryExp[0] * (mult.prod[i] - recursive.out[i]);
        }
    }
}
