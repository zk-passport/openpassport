const chai = require("chai");
const path = require("path");
const snarkjs = require("snarkjs");
const compiler = require("circom");

const assert = chai.assert;

const bigInt = snarkjs.bigInt;

const babyJub = require("../src/babyjub.js");


describe("Point 2 bits test", function() {
    let circuit;
    this.timeout(100000);
    before( async() => {
        const cirDef = await compiler(path.join(__dirname, "circuits", "pointbits_loopback.circom"));

        circuit = new snarkjs.Circuit(cirDef);

        console.log("NConstrains Point2Bits loopback: " + circuit.nConstraints);
    });
    it("Should do the both convertions for 8Base", async () => {
        const w = circuit.calculateWitness({ in: babyJub.Base8});

        assert(circuit.checkWitness(w));
    });
    it("Should do the both convertions for Zero point", async () => {
        const w = circuit.calculateWitness({ in: [0, 1]});

        assert(circuit.checkWitness(w));
    });
});
