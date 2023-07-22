include "./bigint.circom"

template RabinVerifier(w, n) {
    // w * n is enough bits to store `sig`.
    // Constraints:
    //   $2(2n - 1)$    for the two polynomial multipliers
    //   $nw$           to check the bits of x
    //   $(2n - 2)(w + 2 + ceil(log2(2n - 1))) + 1$ for the carried equality
    //   Net:
    //      2n(1.5w + ceil(log2(n)) + 5) - 2w - 7

    // Checks: sig * sig == x * pk + msg

    signal input sig[n];
    signal input msg[n];
    signal input pk[n];

    signal x[n];

    //Compute the x
    compute {
        int sigAcc = int(0);
        int msgAcc = int(0);
        int pkAcc = int(0);
        for (int i = int(0); i < int(n); i++) {
            sigAcc += int(sig[i]) << (int(w) * i);
            msgAcc += int(msg[i]) << (int(w) * i);
            pkAcc  += int(pk[i])  << (int(w) * i);
        }
        int xAcc = (sigAcc * sigAcc - msgAcc) / pkAcc;
        for (int i = int(0); i < int(n); i++) {
            x[i] <-- field(xAcc % int(2 ** w));
            xAcc = xAcc \ int(2 ** w);
        }
        xAcc === int(0);
    }

    // Verify the wordness of x lest our multipliers break
    component xBits[n];
    for (var i = 0; i < n; i++) {
        xBits[i] = Num2Bits(w);
        xBits[i].in <== x[i];
    }

    component left = PolynomialMultiplier(n);
    component right = PolynomialMultiplier(n);

    for (var i = 0; i < n; i++) {
        left.a[i] <== sig[i];
        left.b[i] <== sig[i];
        right.a[i] <== x[i];
        right.b[i] <== pk[i];
    }

    var maxWord = n * (2 ** w - 1) * (2 ** w - 1) + (2 ** w - 1);
    component equality = EqualWhenCarried(maxWord, w, 2 * n - 1);

    for (var i = 0; i < 2 * n - 1; i++) {
        if (i < n) {
            equality.a[i] <== left.prod[i];
            equality.b[i] <== right.prod[i] + msg[i];
        } else {
            equality.a[i] <== left.prod[i];
            equality.b[i] <== right.prod[i];
        }
    }

}
