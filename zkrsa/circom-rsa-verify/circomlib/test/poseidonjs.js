const chai = require("chai");
const assert = chai.assert;

const poseidon = require("../src/poseidon.js");

describe("Poseidon Circuit test", function () {
    it("Should check constrain reference implementation poseidonperm_x5_254_3", async () => {
        const res2 = poseidon([1,2]);
        assert.equal("115cc0f5e7d690413df64c6b9662e9cf2a3617f2743245519e19607a4417189a", res2.toString(16));
    });
    it("Should check constrain reference implementation poseidonperm_x5_254_5", async () => {
        const res2 = poseidon([1,2,3,4]);
        assert.equal("299c867db6c1fdd79dcefa40e4510b9837e60ebb1ce0663dbaa525df65250465", res2.toString(16));
    });
});
