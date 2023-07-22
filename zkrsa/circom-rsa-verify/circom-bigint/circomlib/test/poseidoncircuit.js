const chai = require("chai");
const path = require("path");
const snarkjs = require("snarkjs");
const compiler = require("circom");
var blake2b = require('blake2b');

const poseidon = require("../src/poseidon.js");

const assert = chai.assert;

describe("Blake2b version test", function() {
    it("Should give the expected output for blake2b version", async () => {
        var output = new Uint8Array(32);
        var input = Buffer.from('poseidon_constants');
        h = blake2b(output.length).update(input).digest('hex')
        assert.equal('e57ba154fb2c47811dc1a2369b27e25a44915b4e4ece4eb8ec74850cb78e01b1', h);
    });
});

describe("Poseidon Circuit test", function () {
    let circuit;

    this.timeout(100000);

    before( async () => {
        const cirDef = await compiler(path.join(__dirname, "circuits", "poseidon_test.circom"));

        circuit = new snarkjs.Circuit(cirDef);

        console.log("Poseidon constraints: " + circuit.nConstraints);
    });

    it("Should check constrain of hash([1, 2])", async () => {
        const w = circuit.calculateWitness({inputs: [1, 2]});

        const res = w[circuit.getSignalIdx("main.out")];

        const hash = poseidon.createHash(6, 8, 57);

        const res2 = hash([1,2]);
        assert.equal('12242166908188651009877250812424843524687801523336557272219921456462821518061', res2.toString());
        assert.equal(res.toString(), res2.toString());
        assert(circuit.checkWitness(w));
    });

    it("Should check constrain of hash([3, 4])", async () => {
        const w = circuit.calculateWitness({inputs: [3, 4]});

        const res = w[circuit.getSignalIdx("main.out")];

        const hash = poseidon.createHash(6, 8, 57);

        const res2 = hash([3, 4]);
        assert.equal('17185195740979599334254027721507328033796809509313949281114643312710535000993', res2.toString());

        assert.equal(res.toString(), res2.toString());

        assert(circuit.checkWitness(w));
    });
});
