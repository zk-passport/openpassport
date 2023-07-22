const chai = require("chai");
const path = require("path");
const tester = require("circom").tester;

const poseidon = require("../src/poseidon.js");

const assert = chai.assert;

describe("Poseidon Circuit test", function () {
    let circuit6;
    let circuit3;

    this.timeout(100000);

    before( async () => {
        circuit6 = await tester(path.join(__dirname, "circuits", "poseidon6_test.circom"));
        circuit3 = await tester(path.join(__dirname, "circuits", "poseidon3_test.circom"));
    });

    it("Should check constrain of hash([1, 2]) t=6", async () => {
        const w = await circuit6.calculateWitness({inputs: [1, 2, 0,0,0]}, true);

        const res2 = poseidon([1,2,0,0,0]);

        assert.equal("1018317224307729531995786483840663576608797660851238720571059489595066344487", res2.toString());
        await circuit6.assertOut(w, {out : res2});
        await circuit6.checkConstraints(w);
    });

    it("Should check constrain of hash([3, 4]) t=6", async () => {
        const w = await circuit6.calculateWitness({inputs: [3, 4,5,10,23]});

        const res2 = poseidon([3, 4,5,10,23]);

        assert.equal("13034429309846638789535561449942021891039729847501137143363028890275222221409", res2.toString());
        await circuit6.assertOut(w, {out : res2});
        await circuit6.checkConstraints(w);
    });


    it("Should check constrain of hash([1, 2]) t=3", async () => {
        const w = await circuit3.calculateWitness({inputs: [1, 2]});

        const res2 = poseidon([1,2]);

        assert.equal("7853200120776062878684798364095072458815029376092732009249414926327459813530", res2.toString());
        await circuit3.assertOut(w, {out : res2});
        await circuit3.checkConstraints(w);
    });

    it("Should check constrain of hash([3, 4]) t=3", async () => {
        const w = await circuit3.calculateWitness({inputs: [3, 4]});

        const res2 = poseidon([3, 4]);

        assert.equal("14763215145315200506921711489642608356394854266165572616578112107564877678998", res2.toString());
        await circuit3.assertOut(w, {out : res2});
        await circuit3.checkConstraints(w);
    });
});
