const chai = require("chai");
const path = require("path");
const tester = require("circom").tester;

const eddsa = require("../src/eddsa.js");
const F1Field = require("ffjavascript").F1Field;
const Scalar = require("ffjavascript").Scalar;
exports.p = Scalar.fromString("21888242871839275222246405745257275088548364400416034343698204186575808495617");
const Fr = new F1Field(exports.p);

const assert = chai.assert;

describe("EdDSA MiMC test", function () {
    let circuit;

    this.timeout(100000);

    before( async () => {
        circuit = await tester(path.join(__dirname, "circuits", "eddsamimc_test.circom"));
    });

    it("Sign a single number", async () => {
        const msg = Scalar.e(1234);

        const prvKey = Buffer.from("0001020304050607080900010203040506070809000102030405060708090001", "hex");

        const pubKey = eddsa.prv2pub(prvKey);

        const signature = eddsa.signMiMC(prvKey, msg);

        assert(eddsa.verifyMiMC(msg, signature, pubKey));

        const w = await circuit.calculateWitness({
            enabled: 1,
            Ax: pubKey[0],
            Ay: pubKey[1],
            R8x: signature.R8[0],
            R8y: signature.R8[1],
            S: signature.S,
            M: msg}, true);


        await circuit.checkConstraints(w);

    });

    it("Detect Invalid signature", async () => {
        const msg = Scalar.e(1234);

        const prvKey = Buffer.from("0001020304050607080900010203040506070809000102030405060708090001", "hex");

        const pubKey = eddsa.prv2pub(prvKey);


        const signature = eddsa.signMiMC(prvKey, msg);

        assert(eddsa.verifyMiMC(msg, signature, pubKey));
        try {
            const w = await circuit.calculateWitness({
                enabled: 1,
                Ax: pubKey[0],
                Ay: pubKey[1],
                R8x: Fr.toString(Fr.add(Fr.e(signature.R8[0]), Fr.e(1))),
                R8y: Fr.toString(Fr.e(signature.R8[1])),
                S: signature.S,
                M: msg}, true);
            assert(false);
        } catch(err) {
            assert(/Constraint\sdoesn't\smatch(.*)1\s!=\s0/.test(err.message) );
        }
    });


    it("Test a dissabled circuit with a bad signature", async () => {
        const msg = Scalar.e(1234);

        const prvKey = Buffer.from("0001020304050607080900010203040506070809000102030405060708090001", "hex");

        const pubKey = eddsa.prv2pub(prvKey);


        const signature = eddsa.signMiMC(prvKey, msg);

        assert(eddsa.verifyMiMC(msg, signature, pubKey));

        const w = await  circuit.calculateWitness({
            enabled: 0,
            Ax: pubKey[0],
            Ay: pubKey[1],
            R8x: Fr.toString(Fr.add(Fr.e(signature.R8[0]), Fr.e(1))),
            R8y: Fr.toString(Fr.e(signature.R8[1])),
            S: signature.S,
            M: msg}, true);

        await circuit.checkConstraints(w);

    });
});
