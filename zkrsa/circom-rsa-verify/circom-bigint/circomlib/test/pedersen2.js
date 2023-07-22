const chai = require("chai");
const path = require("path");
const snarkjs = require("snarkjs");
const compiler = require("circom");

const assert = chai.assert;

const bigInt = snarkjs.bigInt;

const babyJub = require("../src/babyjub.js");
const pedersen = require("../src/pedersenHash.js");


describe("Pedersen test", function() {
    let circuit;
    this.timeout(100000);
    before( async() => {
        const cirDef = await compiler(path.join(__dirname, "circuits", "pedersen2_test.circom"));

        circuit = new snarkjs.Circuit(cirDef);

        console.log("NConstrains Pedersen2: " + circuit.nConstraints);
    });
    it("Should pedersen at zero", async () => {

        let w, xout, yout;

        w = circuit.calculateWitness({ in: 0});

        xout = w[circuit.getSignalIdx("main.out[0]")];
        yout = w[circuit.getSignalIdx("main.out[1]")];

        const b = Buffer.alloc(32);

        const h = pedersen.hash(b);
        const hP = babyJub.unpackPoint(h);

        /*
        console.log(`[${xout.toString()}, ${yout.toString()}]`);
        console.log(`[${hP[0].toString()}, ${hP[1].toString()}]`);
        */

        assert(xout.equals(hP[0]));
        assert(yout.equals(hP[1]));
    });
    it("Should pedersen with 253 ones", async () => {

        let w, xout, yout;

        const n = bigInt.one.shl(253).sub(bigInt.one);
        console.log(n.toString(16));

        w = circuit.calculateWitness({ in: n});

        xout = w[circuit.getSignalIdx("main.out[0]")];
        yout = w[circuit.getSignalIdx("main.out[1]")];

        const b = Buffer.alloc(32);
        for (let i=0; i<31; i++) b[i] = 0xFF;
        b[31] = 0x1F;


        const h = pedersen.hash(b);
        const hP = babyJub.unpackPoint(h);

        /*
        console.log(`[${xout.toString()}, ${yout.toString()}]`);
        console.log(`[${hP[0].toString()}, ${hP[1].toString()}]`);
        */

        assert(xout.equals(hP[0]));
        assert(yout.equals(hP[1]));
    });
});
