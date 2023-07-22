const chai = require("chai");
const path = require("path");
const snarkjs = require("snarkjs");
const compiler = require("circom");

const assert = chai.assert;

const bigInt = snarkjs.bigInt;


const q=bigInt("21888242871839275222246405745257275088548364400416034343698204186575808495617");
function addPoint(a,b) {
    const cta = bigInt("168700");
    const d = bigInt("168696");

    const res = [];
    res[0] = bigInt((a[0]*b[1] + b[0]*a[1]) *  bigInt(bigInt.one + d*a[0]*b[0]*a[1]*b[1]).inverse(q)).affine(q);
    res[1] = bigInt((a[1]*b[1] - cta*a[0]*b[0]) * bigInt(bigInt.one - d*a[0]*b[0]*a[1]*b[1]).inverse(q)).affine(q);
    return res;
}

function print(circuit, w, s) {
    console.log(s + ": " + w[circuit.getSignalIdx(s)]);
}

describe("Exponentioation test", () => {
    it("Should generate the Exponentiation table in k=0", async () => {

        const cirDef = await compiler(path.join(__dirname, "circuits", "escalarmulw4table_test.circom"));

//        console.log(JSON.stringify(cirDef, null, 1));

//        assert.equal(cirDef.nVars, 2);

        const circuit = new snarkjs.Circuit(cirDef);

        console.log("NConstrains: " + circuit.nConstraints);

        const w = circuit.calculateWitness({in: 1});

        let g = [bigInt("5299619240641551281634865583518297030282874472190772894086521144482721001553"),
                 bigInt("16950150798460657717958625567821834550301663161624707787222815936182638968203")]

        dbl= [bigInt("0"), snarkjs.bigInt("1")];

        for (let i=0; i<16; i++) {
            const xout1 = w[circuit.getSignalIdx(`main.out[${i}][0]`)];
            const yout1 = w[circuit.getSignalIdx(`main.out[${i}][1]`)];
/*
            console.log(xout1.toString());
            console.log(yout1.toString());
            console.log(dbl[0]);
            console.log(dbl[1]);
*/
            assert(xout1.equals(dbl[0]));
            assert(yout1.equals(dbl[1]));

            dbl = addPoint([xout1, yout1],g);
        }

    });

    it("Should generate the Exponentiation table in k=3", async () => {

        const cirDef = await compiler(path.join(__dirname, "circuits", "escalarmulw4table_test3.circom"));

//        console.log(JSON.stringify(cirDef, null, 1));

//        assert.equal(cirDef.nVars, 2);

        const circuit = new snarkjs.Circuit(cirDef);

        console.log("NConstrains: " + circuit.nConstraints);

        const w = circuit.calculateWitness({in: 1});

        let g = [snarkjs.bigInt("5299619240641551281634865583518297030282874472190772894086521144482721001553"),
                 snarkjs.bigInt("16950150798460657717958625567821834550301663161624707787222815936182638968203")]

        for (let i=0; i<12;i++) {
            g = addPoint(g,g);
        }

        dbl= [snarkjs.bigInt("0"), snarkjs.bigInt("1")];

        for (let i=0; i<16; i++) {
            const xout1 = w[circuit.getSignalIdx(`main.out[${i}][0]`)];
            const yout1 = w[circuit.getSignalIdx(`main.out[${i}][1]`)];

/*
            console.log(xout1.toString());
            console.log(yout1.toString());
            console.log(dbl[0]);
            console.log(dbl[1]);
*/
            assert(xout1.equals(dbl[0]));
            assert(yout1.equals(dbl[1]));

            dbl = addPoint([xout1, yout1],g);
        }

    });

    it("Should exponentiate g^31", async () => {
        const cirDef = await compiler(path.join(__dirname, "circuits", "escalarmul_test.circom"));

//        console.log(JSON.stringify(cirDef, null, 1));

//        assert.equal(cirDef.nVars, 2);

        const circuit = new snarkjs.Circuit(cirDef);

        console.log("NConstrains: " + circuit.nConstraints);

        const w = circuit.calculateWitness({"in": 31});

        assert(circuit.checkWitness(w));

        let g = [snarkjs.bigInt("5299619240641551281634865583518297030282874472190772894086521144482721001553"),
                 snarkjs.bigInt("16950150798460657717958625567821834550301663161624707787222815936182638968203")]

        let c = [0n, 1n];

        for (let i=0; i<31;i++) {
            c = addPoint(c,g);
        }

        const xout = w[circuit.getSignalIdx(`main.out[0]`)];
        const yout = w[circuit.getSignalIdx(`main.out[1]`)];

/*
        console.log(xout.toString());
        console.log(yout.toString());
*/
        assert(xout.equals(c[0]));
        assert(yout.equals(c[1]));

        console.log("-------")
        const w2 = circuit.calculateWitness({"in": (1n<<252n)+1n});

        const xout2 = w2[circuit.getSignalIdx(`main.out[0]`)];
        const yout2 = w2[circuit.getSignalIdx(`main.out[1]`)];

        c = [g[0], g[1]];
        for (let i=0; i<252;i++) {
            c = addPoint(c,c);
        }
        c = addPoint(c,g);
/*
        console.log(xout2.toString());
        console.log(yout2.toString());
        console.log(c[0].toString());
        console.log(c[1].toString());
*/
        assert(xout2.equals(c[0]));
        assert(yout2.equals(c[1]));

    }).timeout(10000000);

    it("Number of constrains for 256 bits", async () => {
        const cirDef = await compiler(path.join(__dirname, "circuits", "escalarmul_test_min.circom"));

        const circuit = new snarkjs.Circuit(cirDef);

        console.log("NConstrains: " + circuit.nConstraints);
    }).timeout(10000000);

});
