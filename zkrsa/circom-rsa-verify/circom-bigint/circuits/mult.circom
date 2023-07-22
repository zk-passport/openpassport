include "../circomlib/circuits/bitify.circom"

function log2(x) {
    // Given a field element, returns the log2 of it, rounded up.
    for (var i = 0; i < x; ++i) {
        if (2 ** i >= x) {
            return i;
        }
    }
    return x;
}

template PolynomialMultiplier(d) {
    // Implementation of _xjSnark_'s multiplication.
    // Polynomials with degree less than d.
    // Uses a linear number of constraints ($2n - 1$).
    // Based on the linear indepedence of $2n - 1$ equations.
    //
    // $x$ is `a`
    // $y$ is `b`
    signal input a[d];
    signal input b[d];

    // Witness value.
    signal output prod[2 * d - 1];

    component inner = AsymmetricPolynomialMultiplier(d, d);
    for (var i = 0; i < d; ++i) {
        inner.in0[i] <-- a[i];
        inner.in1[i] <-- b[i];
    }
    for (var i = 0; i < 2 * d - 1; ++i) {
        inner.out[i] --> prod[i];
    }
}

template AsymmetricPolynomialMultiplier(d0, d1) {
    // Implementation of _xjSnark_'s multiplication.
    // Parameters/Inputs:
    //    * `in0` with degree less than `d0`
    //    * `in1` with degree less than `d1`
    // Uses a linear number of constraints ($d0 + d1 - 1$).
    signal input in0[d0];
    signal input in1[d1];

    // Output has degree less than `d`
    var d = d0 + d1 - 1;

    // Witness value.
    signal output out[d];

    // Witness computation.
    compute {
        var acc;
        for (var i = 0; i < d; i++) {
            acc = 0;
            var start = 0;
            if (d1 < i + 1) {
                start = i + 1 - d1;
            }
            for (var j = start; j < d0 && j <= i; j++) {
                var k = i - j;
                acc += in0[j] * in1[k];
            }
            out[i] <-- acc;
        }
    }

    // Conditions.
    var in0Val;
    var in1Val;
    var outVal;
    for (var c = 0; c < d; c++) {
        in0Val = 0;
        in1Val = 0;
        outVal = 0;
        for (var i = 0; i < d0; i++) {
            in0Val += (c + 1) ** i * in0[i];
        }
        for (var i = 0; i < d1; i++) {
            in1Val += (c + 1) ** i * in1[i];
        }
        for (var i = 0; i < d; i++) {
            outVal += (c + 1) ** i * out[i];
        }
        in0Val * in1Val === outVal;
    }
}

template Carry(w, n) {
    // Given a 2w-bit, n-word number
    // produces the (n+1)-word number w-bit chunks.
    // Asserts that the number actually fits in (n+1) words.
    //
    // Uses $(2n+1)(w+1)$ constraints
    signal input in[n];

    signal output out[n+1];

    component outBitDecomps[n];
    component carryBitDecomps[n];

    signal carry[n+1];

    carry[0] <-- 0;

    for (var i = 0; i < n; i++) {
        out[i] <-- (in[i] + carry[i]) % (2 ** w);
        carry[i + 1] <-- (in[i] + carry[i]) \ (2 ** w);

        // Verify we've split correctly
        carry[i + 1] * (2 ** w) + out[i] === carry[i] + in[i];

        // Verify our parts fit in w bits.
        outBitDecomps[i] = Num2Bits(w);
        outBitDecomps[i].in <-- out[i];
        carryBitDecomps[i] = Num2Bits(w + 1);
        carryBitDecomps[i].in <-- carry[i + 1];
    }

    // The final carry is our final word
    out[n] <-- carry[n];
}

template EqualWhenCarried(wordMax, outWidth, n) {
    // Given two (overflowing) n-chunk integers asserts:
    //   that they fir properly in n+1 chunks AND
    //   that they're equal
    // Params:
    //   wordMax:   an upper bound on all input words
    //   outWidth:  the desired output width
    //   n:         the number of chunks in the inputs
    // Constraints:
    //   $n$ constraints for carry + output sums
    //   $(n-1)(ceil(log2(2wordMax)) - w)$ contraints for bit decompositions
    //
    //   $(n - 1)(ceil(log2(wordMax)) - w + 2) + 1$ in total

    // The naive approach is to add the two numbers chunk by chunk and:
    //    a. Verify that they sum to zero along the way while
    //    b. Propegating carries
    // but this doesn't work because early sums might be negative.
    // So instead we choose a special c and verify that a - b + c = c
    // where c is chosen to insure that intermediate sums are non-negative.

    signal input a[n];
    signal input b[n];

    component carryBitDecomps[n - 1];
    signal carry[n + 1];
    signal out[n];

    var carryBits = log2(2 * wordMax) - outWidth;
    var outBase = 2 ** outWidth;
    var accumulatedExtra = 0;

    carry[0] <-- 0;

    for (var i = 0; i < n; i++) {
        // We add an extra (wordMax) to the carry to ensure that it is positive
        out[i] <--(a[i] - b[i] + carry[i] + wordMax) % outBase;

        carry[i + 1] <-- (a[i] - b[i] + carry[i] + wordMax) \ outBase;

        // Verify we've split correctly
        carry[i + 1] * outBase + out[i] === carry[i] + a[i] - b[i] + wordMax;

        // Verify that the output is correct
        accumulatedExtra += wordMax;
        out[i] === accumulatedExtra % outBase;
        accumulatedExtra = accumulatedExtra \ outBase;

        // Verify that our carry fits in `carryBits` bits
        if (i < n - 1) {
            carryBitDecomps[i] = Num2Bits(carryBits);
            carryBitDecomps[i].in <-- carry[i + 1];
        } else {
            // The final carry should match the extra
            carry[i + 1] === accumulatedExtra;
        }
    }
}

template Regroup(w, n, g) {
    // Given base-w, n-chunk integers, regroups them such that up to g groups go together
    var nGroups = (n - 1) \ g + 1;
    signal input in[n];
    signal output out[nGroups];

    for (var i = 0; i < nGroups; ++i) {
        var lc = 0;
        for (var j = 0; j < g && i * g + j < n; ++j) {
            lc += (2 ** (w * j)) * in[i * g + j];
        }
        out[i] <-- lc;
    }
}

template EqualWhenCarriedRegroup(wordMax, outWidth, n) {
    // Given two (overflowing) n-chunk integers asserts:
    //   that they fir properly in n+1 chunks AND
    //   that they're equal
    // Params:
    //   wordMax:   an upper bound on all input words
    //   outWidth:  the desired output width
    //   n:         the number of chunks in the inputs
    // Constraints:
    //   $(nGroups - 1)(ceil(log2(groupMax)) - outWidth + 2) + 1$
    //   ~
    //   $(ceil(n/chunksPerGroup) - 1)(ceil(log2(groupMax)) - w + 2) + 1$
    //   $(ceil(n/floor((252 - carryBits) / outWidth)) - 1)(ceil(log2(groupMax)) - w + 2) + 1$
    //   $(ceil(n/floor((251 - ceil(log2(wordMax)) + outWidth) / outWidth)) - 1)(ceil(log2(groupMax)) - w + 2) + 1$

    // The naive approach is to add the two numbers chunk by chunk and:
    //    a. Verify that they sum to zero along the way while
    //    b. Propegating carries
    // but this doesn't work because early sums might be negative.
    // So instead we choose a special c and verify that a - b + c = c
    // where c is chosen to insure that intermediate sums are non-negative.

    signal input a[n];
    signal input b[n];

    var carryBits = log2(2 * wordMax) - outWidth;
    var outBase = 2 ** outWidth;
    var chunksPerGroup = (252 - carryBits) \ outWidth;
    var nGroups = (n - 1) \ chunksPerGroup + 1;
    var groupMax = 0;
    for (var i = 0; i < chunksPerGroup; ++i) {
        groupMax += 2 ** (outWidth * i) * wordMax;
    }

    // Group a, b
    component aGrouper = Regroup(outWidth, n, chunksPerGroup);
    component bGrouper = Regroup(outWidth, n, chunksPerGroup);

    for (var i = 0; i < n; ++i) {
        aGrouper.in[i] <-- a[i];
        bGrouper.in[i] <-- b[i];
    }

    // Now, check carries
    component equality = EqualWhenCarried(groupMax, outWidth * chunksPerGroup, nGroups);


    for (var i = 0; i < nGroups; ++i) {
        equality.a[i] <-- aGrouper.out[i];
        equality.b[i] <-- bGrouper.out[i];
    }
}

template LinearMultiplier(w, n) {
    // Implementation of _xjSnark_'s multiplication for n-word numbers.
    //
    // Uses $2n - 1$ constraints for polynomial multiplication.
    // Uses $2nw + n + w$ carrying
    // For a total of $2nw + 4n + w - 1$ constraints.

    signal input a[n];
    signal input b[n];

    signal output prod[2 * n];

    component polyMultiplier = PolynomialMultiplier(n);
    component carrier = Carry(w, 2 * n - 1);

    // Put our inputs into the polynomial multiplier
    for (var i = 0; i < n; i++) {
        polyMultiplier.a[i] <-- a[i];
        polyMultiplier.b[i] <-- b[i];
    }

    // Put the polynomial product into the carrier
    for (var i = 0; i < 2 * n - 1; i++) {
        carrier.in[i] <-- polyMultiplier.prod[i];
    }

    // Take the carrier output as our own
    for (var i = 0; i < 2 * n; i++) {
        prod[i] <-- carrier.out[i];
    }
}

template LinearMultiplierWithAdd(w, n) {
    // Implementation of _xjSnark_'s multiplication for n-word numbers.
    //
    //     a * b + c == prod
    //
    // Uses $2n - 1$ constraints for polynomial multiplication.
    // Uses $2n(w + 1)$ for bit decomposition of the result.
    // Uses $2n - 1$ constraints for bit decomposition.
    // For a total of $2nw + 4n + w - 1$ constraints.

    signal input a[n];
    signal input b[n];
    signal input c[n];

    signal output prod[2 * n];

    component polyMultiplier = PolynomialMultiplier(n);
    component carrier = Carry(w, 2 * n - 1);

    // Put our inputs into the polynomial multiplier
    for (var i = 0; i < n; i++) {
        polyMultiplier.a[i] <-- a[i];
        polyMultiplier.b[i] <-- b[i];
    }

    // Put the polynomial product into the carrier
    for (var i = 0; i < 2 * n - 1; i++) {
        if (i < n) {
            carrier.in[i] <-- polyMultiplier.prod[i] + c[i];
        } else {
            carrier.in[i] <-- polyMultiplier.prod[i];
        }
    }

    // Take the carrier output as our own
    for (var i = 0; i < 2 * n; i++) {
        prod[i] <-- carrier.out[i];
    }
}

template MultiplierReducer(w, n) {
    // Computes prod and verifies that `prod = a * b (mod modulus)
    // Constraints:
    //   $2(2n - 1)$ for two polynomial multipliers
    //   $(2n - 2)(w + 2 + ceil(log2(2n - 1))) + 1$ for the carried equality
    //   $2(nw)$ for the product and modulus decompositions
    //   Total:
    //      2n(2w + ceil(log2(n)) + 5) - 2w - 7
    signal input a[n];
    signal input b[n];
    signal input modulus[n];

    signal output prod[n];

    component inner = AsymmetricMultiplierReducer(w, n, n);
    for (var i = 0; i < n; ++i) {
        inner.in0[i] <-- a[i];
        inner.in1[i] <-- b[i];
        inner.modulus[i] <-- modulus[i];
    }
    for (var i = 0; i < n; ++i) {
        inner.prod[i] --> prod[i];
    }
}

template AsymmetricMultiplierReducer(w, n1, n2) {
    // Computes prod and verifies that `out = in0 * in1 (mod `modulus`)
    // Constraints:
    //   $2(2n - 1)$ for two polynomial multipliers
    //   $(2n - 2)(w + 2 + ceil(log2(2n - 1))) + 1$ for the carried equality
    //   $2(nw)$ for the product and modulus decompositions
    //   Total:
    //      (n1 + n2)(2w + ceil(log2(min(n1, n2))) + 5) - 2w - 7
    signal input in0[n1];
    signal input in1[n2];
    signal input modulus[n1];

    signal quotient[n2];

    signal output prod[n1];

    compute {
        int in0Val = int(0);
        int in1Val = int(0);
        int modVal = int(0);
        for (int i = int(0); i < int(n1); i++) {
            in0Val += int(in0[i]) << (int(w) * i);
            modVal += int(modulus[i]) << (int(w) * i);
        }
        for (int i = int(0); i < int(n2); i++) {
            in1Val += int(in1[i]) << (int(w) * i);
        }
        int fullProdAcc = in0Val * in1Val;
        int quotientAcc = fullProdAcc / modVal;
        int prodAcc = fullProdAcc % modVal;

        for (int i = int(0); i < int(n2); ++i) {
            quotient[i] <-- field(quotientAcc % int(2 ** w));
            quotientAcc = quotientAcc >> int(w);
        }
        for (int i = int(0); i < int(n1); ++i) {
            prod[i] <-- field(prodAcc % int(2 ** w));
            prodAcc = prodAcc >> int(w);
        }

        quotientAcc === int(0);
        prodAcc === int(0);
    }

    // Verify that the remainder and quotient are w-bits, n-chunks.
    component prodDecomp[n1];
    for (var i = 0; i < n1; i++) {
        prodDecomp[i] = Num2Bits(w);
        prodDecomp[i].in <-- prod[i];
    }

    component quotientDecomp[n2];
    for (var i = 0; i < n2; i++) {
        quotientDecomp[i] = Num2Bits(w);
        quotientDecomp[i].in <-- quotient[i];
    }

    component left = AsymmetricPolynomialMultiplier(n1, n2);
    component right = AsymmetricPolynomialMultiplier(n1, n2);
    for (var i = 0; i < n1; ++i) {
        left.in0[i] <-- in0[i];
        right.in0[i] <-- modulus[i];
    }
    for (var i = 0; i < n2; ++i) {
        right.in1[i] <-- quotient[i];
        left.in1[i] <-- in1[i];
    }

    var minN = n1;
    if (n2 < n1) {
        minN = n2;
    }
    var n = n1 + n2;
    var maxWord = minN * (2 ** w - 1) * (2 ** w - 1) + (2 ** w - 1);
    component carry = EqualWhenCarriedRegroup(maxWord, w, n - 1);
    for (var i = 0; i < n - 1; ++i) {
        if (i < n1) {
            carry.a[i] <-- left.out[i];
            carry.b[i] <-- right.out[i] + prod[i];
        } else {
            carry.a[i] <-- left.out[i];
            carry.b[i] <-- right.out[i];
        }
    }
}

template MultiProduct(w, modulusChunks, inputChunks, nInputs) {
    // Verifies the product of `nInputs` `inputChunks`-chunk nubmers, modulo a
    // `modulusChunks`-chunk modulus.

    signal input in[nInputs][inputChunks];
    signal input modulus[modulusChunks];

    signal output out[modulusChunks];

    component multiplier[nInputs];

    for (var i = 0; i < nInputs; ++i) {
        multiplier[i] = AsymmetricMultiplierReducer(w, modulusChunks, inputChunks);
        for (var j = 0; j < inputChunks; ++j) {
            multiplier[i].in1[j] <-- in[i][j];
        }
        for (var j = 0; j < modulusChunks; ++j) {
            multiplier[i].modulus[j] <-- modulus[j];
            if (i == 0) {
                multiplier[i].in0[j] <-- (j == 0 ? 1 : 0);
            } else {
                multiplier[i].in0[j] <-- multiplier[i - 1].prod[j];
            }
        }
    }
    for (var j = 0; j < modulusChunks; ++j) {
        out[j] <-- multiplier[nInputs - 1].prod[j];
    }
}
