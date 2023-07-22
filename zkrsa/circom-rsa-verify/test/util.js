const bigInt = require("big-integer");
const chai = require("chai");
const snarkjs = require("snarkjs");

const assert = chai.assert;

function splitToWords(x, w, n, name) {
    let t = bigInt(x);
    w = bigInt(w);
    n = bigInt(n);
    const words = {};
    for (let i = 0; i < n; ++i) {
        words[`${name}[${i}]`] = `${t.mod(bigInt(2).pow(w))}`;
        t = t.divide(bigInt(2).pow(w));
    }
    if (!t.isZero()) {
        throw `Number ${x} does not fit in ${w * n} bits`;
    }
    return words;
}

function assertWitnessHas(circuit, witness, name, x, w, b) {
    let words = splitToWords(x, w, b, `main.${name}`);
    for (let [signal, value] of Object.entries(words)) {
        assert(witness[circuit.signalName2Idx[signal]].equals(snarkjs.bigInt(value)), 
            `${signal} expected to be ${(snarkjs.bigInt(value))} but was ${witness[circuit.signalName2Idx[signal]]}`);
    }
}

const extractExpr = (f) => {
    const src = f.toString();
    const re = /.*=> *\((.*)\)/;
    return src.match(re)[1];
};

module.exports = {
    extractExpr,
    assertWitnessHas,
    splitToWords,
};
