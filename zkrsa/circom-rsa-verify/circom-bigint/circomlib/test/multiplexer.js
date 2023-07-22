const chai = require("chai");
const path = require("path");
const snarkjs = require("snarkjs");
const compiler = require("circom");

const assert = chai.assert;

const bigInt = snarkjs.bigInt;


describe("Mux4 test", () => {
    it("Should create a constant multiplexer 4", async () => {

        const cirDef = await compiler(path.join(__dirname, "circuits", "mux4_1.circom"));

//        console.log(JSON.stringify(cirDef, null, 1));

//        assert.equal(cirDef.nVars, 2);

        const circuit = new snarkjs.Circuit(cirDef);

        console.log("NConstrains Mux4: " + circuit.nConstraints);

        const ct16 = [
            bigInt("123"),
            bigInt("456"),
            bigInt("789"),
            bigInt("012"),
            bigInt("111"),
            bigInt("222"),
            bigInt("333"),
            bigInt("4546"),
            bigInt("134523"),
            bigInt("44356"),
            bigInt("15623"),
            bigInt("4566"),
            bigInt("1223"),
            bigInt("4546"),
            bigInt("4256"),
            bigInt("4456")
        ];

        for (let i=0; i<16; i++) {
            const w = circuit.calculateWitness({ "selector": i });

            assert(w[0].equals(bigInt(1)));

            // console.log(i + " -> " + w[circuit.getSignalIdx("main.out")].toString());
            assert(w[circuit.getSignalIdx("main.out")].equals(ct16[i]));
        }
    });

    it("Should create a constant multiplexer 3", async () => {

        const cirDef = await compiler(path.join(__dirname, "circuits", "mux3_1.circom"));

        const circuit = new snarkjs.Circuit(cirDef);

        console.log("NConstrains Mux3: " + circuit.nConstraints);

        const ct8 = [
            bigInt("37"),
            bigInt("47"),
            bigInt("53"),
            bigInt("71"),
            bigInt("89"),
            bigInt("107"),
            bigInt("163"),
            bigInt("191")
        ];

        for (let i=0; i<8; i++) {
            const w = circuit.calculateWitness({ "selector": i });

            assert(w[0].equals(bigInt(1)));

            // console.log(i + " -> " + w[circuit.getSignalIdx("main.out")].toString());
            assert(w[circuit.getSignalIdx("main.out")].equals(ct8[i]));
        }
    });
    it("Should create a constant multiplexer 2", async () => {

        const cirDef = await compiler(path.join(__dirname, "circuits", "mux2_1.circom"));

        const circuit = new snarkjs.Circuit(cirDef);

        console.log("NConstrains Mux2: " + circuit.nConstraints);

        const ct8 = [
            bigInt("37"),
            bigInt("47"),
            bigInt("53"),
            bigInt("71"),
        ];

        for (let i=0; i<4; i++) {
            const w = circuit.calculateWitness({ "selector": i });

            assert(w[0].equals(bigInt(1)));

            // console.log(i + " -> " + w[circuit.getSignalIdx("main.out")].toString());
            assert(w[circuit.getSignalIdx("main.out")].equals(ct8[i]));
        }
    });
    it("Should create a constant multiplexer 1", async () => {

        const cirDef = await compiler(path.join(__dirname, "circuits", "mux1_1.circom"));

        const circuit = new snarkjs.Circuit(cirDef);

        console.log("NConstrains Mux1: " + circuit.nConstraints);

        const ct8 = [
            bigInt("37"),
            bigInt("47"),
        ];

        for (let i=0; i<2; i++) {
            const w = circuit.calculateWitness({ "selector": i });

            assert(w[0].equals(bigInt(1)));

            // console.log(i + " -> " + w[circuit.getSignalIdx("main.out")].toString());
            assert(w[circuit.getSignalIdx("main.out")].equals(ct8[i]));
        }
    });
});
