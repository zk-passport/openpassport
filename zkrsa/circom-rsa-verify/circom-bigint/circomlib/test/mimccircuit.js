const chai = require("chai");
const path = require("path");
const snarkjs = require("snarkjs");
const compiler = require("circom");

const mimcjs = require("../src/mimc7.js");

const assert = chai.assert;

describe("MiMC Circuit test", function () {
    let circuit;

    this.timeout(100000);

    before( async () => {
        const cirDef = await compiler(path.join(__dirname, "circuits", "mimc_test.circom"));

        circuit = new snarkjs.Circuit(cirDef);

        console.log("MiMC constraints: " + circuit.nConstraints);
    });

    it("Should check constrain", async () => {
        const w = circuit.calculateWitness({x_in: 1, k: 2});

        const res = w[circuit.getSignalIdx("main.out")];

        const res2 = mimcjs.hash(1,2,91);

        assert.equal(res.toString(), res2.toString());

        assert(circuit.checkWitness(w));

    });
});
