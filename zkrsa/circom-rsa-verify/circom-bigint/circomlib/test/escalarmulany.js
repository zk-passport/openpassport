const chai = require("chai");
const path = require("path");
const snarkjs = require("snarkjs");
const compiler = require("circom");

const assert = chai.assert;

const bigInt = snarkjs.bigInt;


function print(circuit, w, s) {
    console.log(s + ": " + w[circuit.getSignalIdx(s)]);
}

describe("Escalarmul test", function () {
    let circuitEMulAny;

    this.timeout(100000);

    let g = [
        snarkjs.bigInt("5299619240641551281634865583518297030282874472190772894086521144482721001553"),
        snarkjs.bigInt("16950150798460657717958625567821834550301663161624707787222815936182638968203")
    ];

    before( async() => {
        const cirDefEMulAny = await compiler(path.join(__dirname, "circuits", "escalarmulany_test.circom"));
        circuitEMulAny = new snarkjs.Circuit(cirDefEMulAny);
        console.log("NConstrains Escalarmul any: " + circuitEMulAny.nConstraints);
    });

    it("Should generate Same escalar mul", async () => {

        const w = circuitEMulAny.calculateWitness({"e": 1, "p": g});

        assert(circuitEMulAny.checkWitness(w));

        const xout = w[circuitEMulAny.getSignalIdx("main.out[0]")];
        const yout = w[circuitEMulAny.getSignalIdx("main.out[1]")];

        assert(xout.equals(g[0]));
        assert(yout.equals(g[1]));
    });

    it("If multiply by order should return 0", async () => {

        const r = bigInt("2736030358979909402780800718157159386076813972158567259200215660948447373041");
        const w = circuitEMulAny.calculateWitness({"e": r, "p": g});

        assert(circuitEMulAny.checkWitness(w));

        const xout = w[circuitEMulAny.getSignalIdx("main.out[0]")];
        const yout = w[circuitEMulAny.getSignalIdx("main.out[1]")];

        assert(xout.equals(bigInt.zero));
        assert(yout.equals(bigInt.one));
    });

});

