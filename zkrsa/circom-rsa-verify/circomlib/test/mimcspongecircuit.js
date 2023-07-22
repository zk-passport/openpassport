const path = require("path");
const tester = require("circom").tester;

const mimcjs = require("../src/mimcsponge.js");


describe("MiMC Sponge Circuit test", function () {
    let circuit;

    this.timeout(100000);

    it("Should check permutation", async () => {

        circuit = await tester(path.join(__dirname, "circuits", "mimc_sponge_test.circom"));

        const w = await circuit.calculateWitness({xL_in: 1, xR_in: 2, k: 3});

        const out2 = mimcjs.hash(1,2,3);

        await circuit.assertOut(w, {xL_out: out2.xL, xR_out: out2.xR});

        await circuit.checkConstraints(w);

    });

    it("Should check hash", async () => {
        circuit = await tester(path.join(__dirname, "circuits", "mimc_sponge_hash_test.circom"));

        const w = await circuit.calculateWitness({ins: [1, 2], k: 0});

        const out2 = mimcjs.multiHash([1,2], 0, 3);

        await circuit.assertOut(w, {outs: out2});

        await circuit.checkConstraints(w);
    });
});
