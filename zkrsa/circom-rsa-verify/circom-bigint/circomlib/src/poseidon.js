const bn128 = require("snarkjs").bn128;
const bigInt = require("snarkjs").bigInt;
const blake2b = require('blake2b');
const assert = require("assert");
const F = bn128.Fr;

const SEED = "poseidon";
const NROUNDSF = 8;
const NROUNDSP = 57;
const T = 6;

function getPseudoRandom(seed, n) {
    const res = [];
    let input = Buffer.from(seed);
    let h = blake2b(32).update(input).digest()
    while (res.length<n) {
        const n = F.affine(bigInt.leBuff2int(h));
        res.push(n);
        h = blake2b(32).update(h).digest()
    }

    return res;
}

function allDifferent(v) {
    for (let i=0; i<v.length; i++) {
        if (v[i].isZero()) return false;
        for (let j=i+1; j<v.length; j++) {
            if (v[i].equals(v[j])) return false;
        }
    }
    return true;
}

exports.getMatrix = (t, seed, nRounds) => {
    if (typeof seed === "undefined") seed = SEED;
    if (typeof nRounds === "undefined") nRounds = NROUNDSF + NROUNDSP;
    if (typeof t === "undefined") t = T;
    let nonce = "0000";
    let cmatrix = getPseudoRandom(seed+"_matrix_"+nonce, t*2);
    while (!allDifferent(cmatrix)) {
        nonce = (Number(nonce)+1)+"";
        while(nonce.length<4) nonce = "0"+nonce;
        cmatrix = getPseudoRandom(seed+"_matrix_"+nonce, t*2);
    }

    const M = new Array(t);
    for (let i=0; i<t; i++) {
        M[i] = new Array(t);
        for (let j=0; j<t; j++) {
            M[i][j] = F.affine(F.inverse(F.sub(cmatrix[i], cmatrix[t+j])));
        }
    }
    return M;
};

exports.getConstants = (t, seed, nRounds) => {
    if (typeof seed === "undefined") seed = SEED;
    if (typeof nRounds === "undefined") nRounds = NROUNDSF + NROUNDSP;
    if (typeof t === "undefined") t = T;
    const cts = getPseudoRandom(seed+"_constants", nRounds);
    return cts;
};

function ark(state, c) {
    for (let j=0; j<state.length; j++ ) {
        state[j] = F.add(state[j], c);
    }
}

function sigma(a) {
    return F.mul(a, F.square(F.square(a,a)));
}

function mix(state, M) {
    const newState = new Array(state.length);
    for (let i=0; i<state.length; i++) {
        newState[i] = F.zero;
        for (let j=0; j<state.length; j++) {
            newState[i] = F.add(newState[i], F.mul(M[i][j], state[j]) );
        }
    }
    for (let i=0; i<state.length; i++) state[i] = newState[i];
}

exports.createHash = (t, nRoundsF, nRoundsP, seed) => {

    if (typeof seed === "undefined") seed = SEED;
    if (typeof nRoundsF === "undefined") nRoundsF = NROUNDSF;
    if (typeof nRoundsP === "undefined") nRoundsP = NROUNDSP;
    if (typeof t === "undefined") t = T;

    assert(nRoundsF % 2 == 0);
    const C = exports.getConstants(t, seed, nRoundsF + nRoundsP);
    const M = exports.getMatrix(t, seed, nRoundsF + nRoundsP);
    return function(inputs) {
        let state = [];
        assert(inputs.length < t);
        assert(inputs.length > 0);
        for (let i=0; i<inputs.length; i++) state[i] = bigInt(inputs[i]);
        for (let i=inputs.length; i<t; i++) state[i] = F.zero;

        for (let i=0; i< nRoundsF + nRoundsP; i++) {
            ark(state, C[i]);
            if ((i<nRoundsF/2) || (i >= nRoundsF/2 + nRoundsP)) {
                for (let j=0; j<t; j++) state[j] = sigma(state[j]);
            } else {
                state[0] = sigma(state[0]);
            }
            mix(state, M);
        }
        return F.affine(state[0]);
    };
};


