// NB: This file is a work in progress.

include "./rsa_acc.circom";
include "./mult.circom";
include "./mimc.circom";
include "../circomlib/circuits/eddsamimc.circom";
include "../circomlib/circuits/bitify.circom";

template TxHash() {
    signal input srcX;         // Source pk.x
    signal input srcY;         // Source pk.y
    signal input dstX;           // Dest   pk.x
    signal input dstY;           // Dest   pk.y
    signal input amt;           // Amount
    signal input srcNo;        // Tx Number (for this source)

    signal output out;

    component txHash = MultiMiMC7(6,91);
    txHash.in[0] <== srcX;
    txHash.in[1] <== srcY;
    txHash.in[2] <== dstX;
    txHash.in[3] <== dstY; 
    txHash.in[4] <== amt;
    txHash.in[5] <== srcNo;
    txHash.out ==> out;
}

template BalanceHash(w) {
    signal input pkX;
    signal input pkY;
    signal input amt;
    signal input txNo;

    var outBits = 1024;
    var fieldBits = 254;

    var n = outBits \ w;

    signal output out[n];

    // # Stage 1: Hashing in the field
    // We used a hash to digest
    //  * public key X
    //  * public key Y
    //  * amount
    //  * tx number
    // And then we use a compression function to add in 4 different counters,
    // for 4 field element outputs

    signal hash[4];
    component hasher;
    hasher = MultiMiMC7(4,91);
    hasher.in[0] <== pkX;
    hasher.in[1] <== pkY;
    hasher.in[2] <== amt;
    hasher.in[3] <== txNo;
    component counterFolder[4];
    component extractor = Extractor(4, n, w);
    for (var i = 0; i < 4; ++i) {
        counterFolder[i] = MiMC7Compression(91);
        counterFolder[i].data <== i;
        counterFolder[i].acc <== hasher.out;
        extractor.in[i] <== counterFolder[i].out;
    }

    for (var i = 0; i < n; ++i) {
        out[i] <== extractor.out[i];
    }

}

template Extractor(nIn, nOut, w) {
    signal input in[nIn];
    signal output out[nOut];

    // We're going to build a number like this:
    //
    //
    //              1  bbbbbbb   bbbbbbb   bbbbbbb   bbbbbbb   00000              1
    //
    //   leading one | h4 bits | h3 bits | h2 bits | h1 bits | zeros | trailing one
    //
    //    where h# indicates hash number #.
    //
    // The leading one gaurantees 1024bit-ness, and the trailing 1 gaurantees oddness

    var fieldBits = 254;
    var nBitsIn = fieldBits * nIn;
    var nBitsOut = nOut * w;
    var nTrailingZeros;
    if (nBitsOut > nBitsIn + 2) {
        nTrailingZeros = nBitsOut - nBitsIn - 2;
    } else {
        nTrailingZeros = 0;
    }

    var combination[nOut];

    component inDecomp[nIn];
    for (var i = 0; i < nIn; ++i) {
        inDecomp[i] = Num2Bits_strict();
        inDecomp[i].in <== in[i];
    }

    combination[0] += 1;
    // For each input block
    for (var i = 0; i < nIn; ++i) {
        // For each bit in it
        for (var j = 0; j < fieldBits; ++j) {
            // Bit index into the output number pictured above
            var outI = i * fieldBits + j + nTrailingZeros + 1;
            if (outI + 1 < nBitsOut) {
                combination[outI \ w] += (2 ** (outI % w)) * inDecomp[i].out[j];
            }
        }
    }
    combination[nOut - 1] += (2 ** (w - 1));

    for (var i = 0; i < nOut; ++i) {
        out[i] <== combination[i];
    }
}

template RsaRollup(nTx) {
    var w = 32;
    var nN = 2048 \ w;
    var nL = 128 \ w;
    var nA = 1024 \ w;

    signal input oldDigest[nN];     // Old state
    signal input challengePrimer;   // Nonce to make `challenge` prime
    signal input challenge;         // H(all inputs)

    signal input removeExponent[nL];
    signal input insertExponent[nL];

    // Signed transaction
    signal input txSrcX[nTx];       // Source pk.x
    signal input txSrcY[nTx];       // Source pk.y
    signal input txDstX[nTx];       // Dest   pk.x
    signal input txDstY[nTx];       // Dest   pk.y
    signal input txAmt[nTx];        // Amount
    signal input txSrcNo[nTx];      // Tx Number (for this source)

    signal private input R8x[nTx];  // Tx signature
    signal private input R8y[nTx];  // Tx signature
    signal private input S[nTx];    // Tx signature

    // From the provider
    signal private input txDstNo[nTx];  // Tx Number (for this dest)
    signal private input txSrcBal[nTx]; // Pre-Tx balance (for this source)
    signal private input txDstBal[nTx]; // Pre-Tx balance (for this dest)

    // Verify Signatures
    component txHash[nTx];
    component sigVerifier[nTx];
    for (var i = 0; i < nTx; ++i) {
        txHash[i] = TxHash();
        txHash[i].srcX <== txSrcX[i];
        txHash[i].srcY <== txSrcY[i];
        txHash[i].dstX <== txDstX[i];
        txHash[i].dstY <== txDstY[i];
        txHash[i].amt <== txAmt[i];
        txHash[i].srcNo <== txSrcNo[i];
        sigVerifier[i] = EdDSAMiMCVerifier();
        sigVerifier[i].enabled <== 1;
        sigVerifier[i].Ax <== txSrcX[i];
        sigVerifier[i].Ay <== txSrcY[i];
        sigVerifier[i].R8x <== R8x[i];
        sigVerifier[i].R8y <== R8y[i];
        sigVerifier[i].S <== S[i];
        sigVerifier[i].M <== txHash[i].out;
    }

    // (enforce small, positive transfer and balance amounts)
    component amtBoundsChk[nTx];
    component newSrcBalBoundsChk[nTx];
    component newDstBalBoundsChk[nTx];
    for (var i = 0; i < nTx; ++i) {
        // txSrcBal[i] - txAmt[i] >= 0
        amtBoundsChk[i] = Num2Bits(64);
        amtBoundsChk[i].in <== txAmt[i];
        newSrcBalBoundsChk[i] = Num2Bits(64);
        newSrcBalBoundsChk[i].in <== txSrcBal[i] - txAmt[i];
        newDstBalBoundsChk[i] = Num2Bits(64);
        newDstBalBoundsChk[i].in <== txSrcBal[i] + txAmt[i];
    }

    // Building the balance leaves
    component srcBalanceBefore[nTx];
    component dstBalanceBefore[nTx];
    component srcBalanceAfter[nTx];
    component dstBalanceAfter[nTx];
    for (var i = 0; i < nTx; ++i) {
        srcBalanceBefore[i] = BalanceHash(w);
        dstBalanceBefore[i] = BalanceHash(w);
        srcBalanceAfter[i] = BalanceHash(w);
        dstBalanceAfter[i] = BalanceHash(w);

        srcBalanceBefore[i].pkX <== txSrcX[i];
        srcBalanceBefore[i].pkY <== txSrcY[i];
        srcBalanceBefore[i].txNo <== txSrcNo[i];
        srcBalanceBefore[i].amt <== txSrcBal[i];

        dstBalanceBefore[i].pkX <== txDstX[i];
        dstBalanceBefore[i].pkY <== txDstY[i];
        dstBalanceBefore[i].txNo <== txDstNo[i];
        dstBalanceBefore[i].amt <== txDstBal[i];

        srcBalanceAfter[i].pkX <== txSrcX[i];
        srcBalanceAfter[i].pkY <== txSrcY[i];
        srcBalanceAfter[i].txNo <== txSrcNo[i] + 1;
        srcBalanceAfter[i].amt <== txSrcBal[i] - txAmt[i];

        dstBalanceAfter[i].pkX <== txDstX[i];
        dstBalanceAfter[i].pkY <== txDstY[i];
        dstBalanceAfter[i].txNo <== txDstNo[i];
        dstBalanceAfter[i].amt <== txDstBal[i] + txAmt[i];
    }

    component totalHasher = MultiMiMC7(nTx + nN + 1, 91);
    for (var i = 0; i < nTx; ++i) {
        totalHasher.in[i] <== txHash[i].out;
    }
    for (var i = 0; i < nN; ++i) {
        totalHasher.in[nTx + i] <== oldDigest[i];
    }
    totalHasher.in[nTx + nN] <== challengePrimer;
    totalHasher.out === challenge;

    component challengeExtractor = Extractor(1, 4, 32);
    challengeExtractor.in[0] <== challenge;

    component removeMultiplier = MultiProduct(32, 4, 32, 2 * nTx);
    component insertMultiplier = MultiProduct(32, 4, 32, 2 * nTx);

    for (var i = 0; i < 4; ++i) {
        removeMultiplier.modulus[i] <== challengeExtractor.out[i];
        insertMultiplier.modulus[i] <== challengeExtractor.out[i];
    }

    for (var i = 0; i < nTx; ++i) {
        for (var j = 0; j < 32; ++j) {
            removeMultiplier.in[2 * i][j] <== srcBalanceBefore[i].out[j];
            removeMultiplier.in[2 * i + 1][j] <== dstBalanceBefore[i].out[j];
            insertMultiplier.in[2 * i][j] <== srcBalanceAfter[i].out[j];
            insertMultiplier.in[2 * i + 1][j] <== dstBalanceAfter[i].out[j];
        }
    }
}
