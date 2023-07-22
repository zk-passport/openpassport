const chai = require("chai");
const path = require("path");

const tester = require("circom").tester;

const eddsa = require("../src/eddsa.js");
const babyJub = require("../src/babyjub.js");

const F1Field = require("ffjavascript").F1Field;
const Scalar = require("ffjavascript").Scalar;
exports.p = Scalar.fromString("21888242871839275222246405745257275088548364400416034343698204186575808495617");
const Fr = new F1Field(exports.p);

const assert = chai.assert;

function print(circuit, w, s) {
    console.log(s + ": " + w[circuit.getSignalIdx(s)]);
}

function buffer2bits(Fr, buff) {
    const res = [];
    for (let i=0; i<buff.length; i++) {
        for (let j=0; j<8; j++) {
            if ((buff[i]>>j)&1) {
                res.push(Fr.toString(Fr.one));
            } else {
                res.push(Fr.toString(Fr.zero));
            }
        }
    }
    return res;
}


describe("EdDSA test", function () {
    let circuit;

    this.timeout(100000);

    before( async () => {
        circuit = await tester(path.join(__dirname, "circuits", "eddsa_test.circom"));
    });

    it("Sign a single 10 bytes from 0 to 9", async () => {
        const msg = Buffer.from("00010203040506070809", "hex");

//        const prvKey = crypto.randomBytes(32);

        const prvKey = Buffer.from("0001020304050607080900010203040506070809000102030405060708090001", "hex");

        const pubKey = eddsa.prv2pub(prvKey);

        const pPubKey = babyJub.packPoint(pubKey);

        const signature = eddsa.sign(prvKey, msg);

        const pSignature = eddsa.packSignature(signature);
        const uSignature = eddsa.unpackSignature(pSignature);

        assert(eddsa.verify(msg, uSignature, pubKey));

        const msgBits = buffer2bits(Fr, msg);
        const r8Bits = buffer2bits(Fr, pSignature.slice(0, 32));
        const sBits = buffer2bits(Fr, pSignature.slice(32, 64));
        const aBits = buffer2bits(Fr, pPubKey);

        const w = await circuit.calculateWitness({A: aBits, R8: r8Bits, S: sBits, msg: msgBits}, true);

        await circuit.checkConstraints(w);
    });
});
