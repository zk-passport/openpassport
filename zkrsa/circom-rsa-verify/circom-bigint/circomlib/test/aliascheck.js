const chai = require("chai");
const path = require("path");
const snarkjs = require("snarkjs");
const compiler = require("circom");

const assert = chai.assert;

const bigInt = snarkjs.bigInt;

function print(circuit, w, s) {
    console.log(s + ": " + w[circuit.getSignalIdx(s)]);
}

function getBits(v, n) {
    const res = [];
    for (let i=0; i<n; i++) {
        if (v.shr(i).isOdd()) {
            res.push(bigInt.one);
        } else {
            res.push(bigInt.zero);
        }
    }
    return res;
}

const q = bigInt("21888242871839275222246405745257275088548364400416034343698204186575808495617");

describe("Aliascheck test", () => {
    let circuit;
    before( async() => {
        const cirDef = await compiler(path.join(__dirname, "circuits", "aliascheck_test.circom"));

        circuit = new snarkjs.Circuit(cirDef);

        console.log("NConstrains: " + circuit.nConstraints);
    });

    it("Satisfy the aliastest 0", async () => {
        const inp = getBits(bigInt.zero, 254);
        circuit.calculateWitness({in: inp});
    });

    it("Satisfy the aliastest 3", async () => {
        const inp = getBits(bigInt(3), 254);
        circuit.calculateWitness({in: inp});
    });

    it("Satisfy the aliastest q-1", async () => {
        const inp = getBits(q.sub(bigInt.one), 254);
        circuit.calculateWitness({in: inp});
    });

    it("Nhot not satisfy an input of q", async () => {
        const inp = getBits(q, 254);
        try {
            circuit.calculateWitness({in: inp});
            assert(false);
        } catch(err) {
            assert.equal(err.message, "Constraint doesn't match: 1 != 0");
        }
    });

    it("Nhot not satisfy all ones", async () => {

        const inp = getBits(bigInt(1).shl(254).sub(bigInt(1)), 254);
        try {
            circuit.calculateWitness({in: inp});
            assert(false);
        } catch(err) {
                assert.equal(err.message, "Constraint doesn't match: 1 != 0");
        }
    });

});
