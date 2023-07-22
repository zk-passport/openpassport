const chai = require("chai");
const path = require("path");
const snarkjs = require("snarkjs");
const compiler = require("circom");
const babyjub = require("../src/babyjub");

const assert = chai.assert;

const bigInt = snarkjs.bigInt;


function print(circuit, w, s) {
    console.log(s + ": " + w[circuit.getSignalIdx(s)]);
}

describe("Escalarmul test", function () {
    let circuit;

    this.timeout(100000);

    before( async() => {
        const cirDef = await compiler(path.join(__dirname, "circuits", "escalarmulfix_test.circom"));
        circuit = new snarkjs.Circuit(cirDef);
        console.log("NConstrains Escalarmul fix: " + circuit.nConstraints);
    });

    it("Should generate Same escalar mul", async () => {

        const w = circuit.calculateWitness({"e": 0});

        assert(circuit.checkWitness(w));

        const xout = w[circuit.getSignalIdx("main.out[0]")];
        const yout = w[circuit.getSignalIdx("main.out[1]")];

        assert(xout.equals(0));
        assert(yout.equals(1));
    });

    it("Should generate Same escalar mul", async () => {

        const w = circuit.calculateWitness({"e": 1});

        assert(circuit.checkWitness(w));

        const xout = w[circuit.getSignalIdx("main.out[0]")];
        const yout = w[circuit.getSignalIdx("main.out[1]")];

        assert(xout.equals(babyjub.Base8[0]));
        assert(yout.equals(babyjub.Base8[1]));
    });

    it("Should generate scalar mul of a specific constant", async () => {

        const s = bigInt("2351960337287830298912035165133676222414898052661454064215017316447594616519");
        const base8 = [
            bigInt("5299619240641551281634865583518297030282874472190772894086521144482721001553"),
            bigInt("16950150798460657717958625567821834550301663161624707787222815936182638968203")
        ];

        const w = circuit.calculateWitness({"e": s});

        assert(circuit.checkWitness(w));

        const xout = w[circuit.getSignalIdx("main.out[0]")];
        const yout = w[circuit.getSignalIdx("main.out[1]")];

        const expectedRes = babyjub.mulPointEscalar(base8, s);

        assert(xout.equals(expectedRes[0]));
        assert(yout.equals(expectedRes[1]));
    });

    it("Should generate scalar mul of the firsts 50 elements", async () => {

        const base8 = [
            bigInt("5299619240641551281634865583518297030282874472190772894086521144482721001553"),
            bigInt("16950150798460657717958625567821834550301663161624707787222815936182638968203")
        ];

        for (let i=0; i<50; i++) {
            const s = bigInt(i);

            const w = circuit.calculateWitness({"e": s});

            assert(circuit.checkWitness(w));

            const xout = w[circuit.getSignalIdx("main.out[0]")];
            const yout = w[circuit.getSignalIdx("main.out[1]")];

            const expectedRes = babyjub.mulPointEscalar(base8, s);

            assert(xout.equals(expectedRes[0]));
            assert(yout.equals(expectedRes[1]));
        }
    });

    it("If multiply by order should return 0", async () => {

        const w = circuit.calculateWitness({"e": babyjub.subOrder });

        assert(circuit.checkWitness(w));

        const xout = w[circuit.getSignalIdx("main.out[0]")];
        const yout = w[circuit.getSignalIdx("main.out[1]")];

        assert(xout.equals(bigInt.zero));
        assert(yout.equals(bigInt.one));
    });

});

