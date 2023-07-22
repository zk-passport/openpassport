const chai = require("chai");
const path = require("path");
const tester = require("circom").tester;

const mimcjs = require("../src/mimc7.js");

describe("MiMC Circuit test", function () {
    let circuit;

    this.timeout(100000);

    before( async () => {
        circuit = await tester(path.join(__dirname, "circuits", "mimc_test.circom"));
    });

    it("Should check constrain", async () => {
        const w = await circuit.calculateWitness({x_in: 1, k: 2}, true);

        const res2 = mimcjs.hash(1,2,91);

        await circuit.assertOut(w, {out: res2});

        await circuit.checkConstraints(w);
    });
});
