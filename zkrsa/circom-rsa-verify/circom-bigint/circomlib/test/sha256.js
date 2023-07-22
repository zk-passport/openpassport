const chai = require("chai");
const path = require("path");
const snarkjs = require("snarkjs");
const crypto = require("crypto");

const compiler = require("circom");

const assert = chai.assert;

const sha256 = require("./helpers/sha256");

// const printSignal = require("./helpers/printsignal");


describe("SHA256 test", () => {
    it("Should calculate a hash", async () => {
        const cirDef = await compiler(path.join(__dirname, "circuits", "sha256_2_test.circom"));
        const circuit = new snarkjs.Circuit(cirDef);

        console.log("Vars: "+circuit.nVars);
        console.log("Constraints: "+circuit.nConstraints);

        const witness = circuit.calculateWitness({ "a": "1", "b": "2" });

        const b = new Buffer.alloc(54);
        b[26] = 1;
        b[53] = 2;

        const hash = crypto.createHash("sha256")
            .update(b)
            .digest("hex");
        const r = "0x" + hash.slice(10);

        const hash2 = sha256.hash(b.toString("hex"), {msgFormat: "hex-bytes"});

        assert.equal(hash, hash2);

        assert(witness[1].equals(snarkjs.bigInt(r)));
    }).timeout(1000000);


});
