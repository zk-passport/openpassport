const chai = require("chai");
const path = require("path");
const snarkjs = require("snarkjs");

const compiler = require("circom");


const assert = chai.assert;
chai.should();

describe("FullAdder", () => {
    var fullAdder8;
    var fullAdder32;
    var fullAdder64;

    before(async () => {
        fullAdder8 = await compiler(path.join(__dirname, "circuits", "full_adder_8.circom"));
        fullAdder32 = await compiler(path.join(__dirname, "circuits", "full_adder_32.circom"));
        fullAdder64 = await compiler(path.join(__dirname, "circuits", "full_adder_64.circom"));
    });

    it("should have 13 constraints (8bit)", async () => {

        const circuit = new snarkjs.Circuit(fullAdder8);

        circuit.nConstraints.should.equal(13);
    });

    it("should add small numbers (8bit)", async () => {


        const circuit = new snarkjs.Circuit(fullAdder8);

        const witness = circuit.calculateWitness({ "in0": "5", "in1": "12", "in2": "1" });

        assert(witness[0].equals(snarkjs.bigInt(1)));  // One
        assert(witness[1].equals(snarkjs.bigInt(18))); // Sum
        assert(witness[2].equals(snarkjs.bigInt(0)));  // Carry

        assert(witness[3].equals(snarkjs.bigInt(0)));  // Sum LSB
        assert(witness[4].equals(snarkjs.bigInt(1)));
        assert(witness[5].equals(snarkjs.bigInt(0)));
        assert(witness[6].equals(snarkjs.bigInt(0)));
        assert(witness[7].equals(snarkjs.bigInt(1)));
        assert(witness[8].equals(snarkjs.bigInt(0)));
        assert(witness[9].equals(snarkjs.bigInt(0)));
        assert(witness[10].equals(snarkjs.bigInt(0)));

        assert(witness[11].equals(snarkjs.bigInt(0))); // Carry LSB
        assert(witness[12].equals(snarkjs.bigInt(0)));

        assert(witness[13].equals(snarkjs.bigInt(5))); // in0
        assert(witness[14].equals(snarkjs.bigInt(12))); // in1
        assert(witness[15].equals(snarkjs.bigInt(1))); // in2

        assert(witness[16].equals(snarkjs.bigInt(18))); // rawSum
    });

    it("should handle a single carry over (8bit)", async () => {


        const circuit = new snarkjs.Circuit(fullAdder8);

        const witness = circuit.calculateWitness({ "in0": "255", "in1": "254", "in2": "0" });

        assert(witness[0].equals(snarkjs.bigInt(1)));  // One
        assert(witness[1].equals(snarkjs.bigInt(253))); // Sum
        assert(witness[2].equals(snarkjs.bigInt(1)));  // Carry

        assert(witness[3].equals(snarkjs.bigInt(1)));  // Sum LSB
        assert(witness[4].equals(snarkjs.bigInt(0)));
        assert(witness[5].equals(snarkjs.bigInt(1)));
        assert(witness[6].equals(snarkjs.bigInt(1)));
        assert(witness[7].equals(snarkjs.bigInt(1)));
        assert(witness[8].equals(snarkjs.bigInt(1)));
        assert(witness[9].equals(snarkjs.bigInt(1)));
        assert(witness[10].equals(snarkjs.bigInt(1)));

        assert(witness[11].equals(snarkjs.bigInt(1))); // Carry LSB
        assert(witness[12].equals(snarkjs.bigInt(0)));
    });

    it("should handle a double carry over (8bit)", async () => {


        const circuit = new snarkjs.Circuit(fullAdder8);

        const witness = circuit.calculateWitness({ "in0": "255", "in1": "254", "in2": "3" });

        assert(witness[0].equals(snarkjs.bigInt(1)));  // One
        assert(witness[1].equals(snarkjs.bigInt(0))); // Sum
        assert(witness[2].equals(snarkjs.bigInt(2)));  // Carry

        assert(witness[3].equals(snarkjs.bigInt(0)));  // Sum LSB
        assert(witness[4].equals(snarkjs.bigInt(0)));
        assert(witness[5].equals(snarkjs.bigInt(0)));
        assert(witness[6].equals(snarkjs.bigInt(0)));
        assert(witness[7].equals(snarkjs.bigInt(0)));
        assert(witness[8].equals(snarkjs.bigInt(0)));
        assert(witness[9].equals(snarkjs.bigInt(0)));
        assert(witness[10].equals(snarkjs.bigInt(0)));

        assert(witness[11].equals(snarkjs.bigInt(0))); // Carry LSB
        assert(witness[12].equals(snarkjs.bigInt(1)));
    });

    it("should handle a single carry (64bit)", async () => {


        const circuit = new snarkjs.Circuit(fullAdder64);

        const witness = circuit.calculateWitness({ "in0": "18446744073709551615", "in1": "4294967296", "in2": "1" });

        assert(witness[0].equals(snarkjs.bigInt(1)));  // One
        assert(witness[1].equals(snarkjs.bigInt("4294967296"))); // Sum
        assert(witness[2].equals(snarkjs.bigInt("1")));  // Carry
    });

    it("should handle a single carry (32bit)", async () => {


        const circuit = new snarkjs.Circuit(fullAdder32);

        const witness = circuit.calculateWitness({ "in0": "4294967295", "in1": "4294967295", "in2": "1" });

        assert(witness[0].equals(snarkjs.bigInt(1)));  // One
        assert(witness[1].equals(snarkjs.bigInt("4294967295"))); // Sum
        assert(witness[2].equals(snarkjs.bigInt("1")));  // Carry
    });

});

describe("RippleCarryAdder", () => {
    var rcAdder42;

    before(async () => {
        rcAdder42 = await compiler(path.join(__dirname, "circuits", "rcadder_4bits_2words.circom"));
    });

    it("should be compilable", async () => {
        new snarkjs.Circuit(rcAdder42);
    });

    it("should have 13 constraints (4 bits, 2 words)", async () => {

        const circuit = new snarkjs.Circuit(rcAdder42);

        circuit.nConstraints.should.equal(13);
    });

    it("should compute 0 + 0 (4 bits, 2 words)", async () => {


        const circuit = new snarkjs.Circuit(rcAdder42);
        const witness = circuit.calculateWitness({
            "a[0]": "0",
            "a[1]": "0",
            "b[0]": "0",
            "b[1]": "0"
        });

        assert(witness[0].equals(snarkjs.bigInt(1)));     // One
        assert(witness[1].equals(snarkjs.bigInt(0)));     // sum[0]
        assert(witness[2].equals(snarkjs.bigInt(0)));     // sum[1]
        assert(witness[3].equals(snarkjs.bigInt(0)));     // sum[2]

    });

    it("should compute 16 + 0 (4 bits, 2 words)", async () => {


        const circuit = new snarkjs.Circuit(rcAdder42);
        const witness = circuit.calculateWitness({
            "a[0]": "0",
            "a[1]": "1",
            "b[0]": "0",
            "b[1]": "0"
        });

        assert(witness[0].equals(snarkjs.bigInt(1)));     // One
        assert(witness[1].equals(snarkjs.bigInt(0)));     // sum[0]
        assert(witness[2].equals(snarkjs.bigInt(1)));     // sum[1]
        assert(witness[3].equals(snarkjs.bigInt(0)));     // sum[2]

    });

    it("should compute 2,1 + 15,15  (4 bits, 2 words)", async () => {

        const circuit = new snarkjs.Circuit(rcAdder42);
        const witness = circuit.calculateWitness({
            "a[0]": "1",
            "a[1]": "2",
            "b[0]": "15",
            "b[1]": "15"
        });

        assert(witness[0].equals(snarkjs.bigInt(1)));     // One
        assert(witness[1].equals(snarkjs.bigInt(0)));     // sum[0]
        assert(witness[2].equals(snarkjs.bigInt(2)));     // sum[1]
        assert(witness[3].equals(snarkjs.bigInt(1)));     // sum[2]

    });
});

