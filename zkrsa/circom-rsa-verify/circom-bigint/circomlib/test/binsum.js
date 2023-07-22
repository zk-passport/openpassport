const chai = require("chai");
const path = require("path");
const snarkjs = require("snarkjs");
const crypto = require("crypto");

const compiler = require("circom");

const assert = chai.assert;

describe("Sum test", () => {
    it("Should create a constant circuit", async () => {

        const cirDef = await compiler(path.join(__dirname, "circuits", "constants_test.circom"));
        assert.equal(cirDef.nVars, 2);

        const circuit = new snarkjs.Circuit(cirDef);

        const witness = circuit.calculateWitness({ "in": "0xd807aa98" });

        assert(witness[0].equals(snarkjs.bigInt(1)));
        assert(witness[1].equals(snarkjs.bigInt("0xd807aa98")));
    });
    it("Should create a sum circuit", async () => {

        const cirDef = await compiler(path.join(__dirname, "circuits", "sum_test.circom"));
        assert.equal(cirDef.nVars, 101);

        const circuit = new snarkjs.Circuit(cirDef);

        const witness = circuit.calculateWitness({ "a": "111", "b": "222" });

        assert(witness[0].equals(snarkjs.bigInt(1)));
        assert(witness[1].equals(snarkjs.bigInt("333")));
    });
});
