const chai = require("chai");
const path = require("path");
const snarkjs = require("snarkjs");
const compiler = require("circom");
const babyJub = require("../src/babyjub.js");

const assert = chai.assert;

const bigInt = snarkjs.bigInt;

describe("Montgomery test", function () {
    let circuitE2M;
    let circuitM2E;
    let circuitMAdd;
    let circuitMDouble;

    let g = [
        snarkjs.bigInt("5299619240641551281634865583518297030282874472190772894086521144482721001553"),
        snarkjs.bigInt("16950150798460657717958625567821834550301663161624707787222815936182638968203")];

    let mg, mg2, g2, g3, mg3;

    this.timeout(100000);
    before( async() => {
        const cirDefE2M = await compiler(path.join(__dirname, "circuits", "edwards2montgomery.circom"));
        circuitE2M = new snarkjs.Circuit(cirDefE2M);
        console.log("NConstrains Edwards -> Montgomery: " + circuitE2M.nConstraints);

        const cirDefM2E = await compiler(path.join(__dirname, "circuits", "montgomery2edwards.circom"));
        circuitM2E = new snarkjs.Circuit(cirDefM2E);
        console.log("NConstrains Montgomery -> Edwards: " + circuitM2E.nConstraints);

        const cirDefMAdd = await compiler(path.join(__dirname, "circuits", "montgomeryadd.circom"));
        circuitMAdd = new snarkjs.Circuit(cirDefMAdd);
        console.log("NConstrains Montgomery Add: " + circuitMAdd.nConstraints);

        const cirDefMDouble = await compiler(path.join(__dirname, "circuits", "montgomerydouble.circom"));
        circuitMDouble = new snarkjs.Circuit(cirDefMDouble);
        console.log("NConstrains Montgomery Double: " + circuitMDouble.nConstraints);
    });
    it("Convert Edwards to Montgomery and back again", async () => {
        let w, xout, yout;

        w = circuitE2M.calculateWitness({ in: g});

        xout = w[circuitE2M.getSignalIdx("main.out[0]")];
        yout = w[circuitE2M.getSignalIdx("main.out[1]")];

        mg = [xout, yout];

        w = circuitM2E.calculateWitness({ in: [xout, yout]});

        xout = w[circuitM2E.getSignalIdx("main.out[0]")];
        yout = w[circuitM2E.getSignalIdx("main.out[1]")];

        assert(xout.equals(g[0]));
        assert(yout.equals(g[1]));
    });
    it("Should double a point", async () => {
        let w, xout, yout;

        g2 = babyJub.addPoint(g,g);

        w = circuitMDouble.calculateWitness({ in: mg});

        xout = w[circuitE2M.getSignalIdx("main.out[0]")];
        yout = w[circuitE2M.getSignalIdx("main.out[1]")];

        mg2 = [xout, yout];

        w = circuitM2E.calculateWitness({ in: mg2});

        xout = w[circuitM2E.getSignalIdx("main.out[0]")];
        yout = w[circuitM2E.getSignalIdx("main.out[1]")];

        assert(xout.equals(g2[0]));
        assert(yout.equals(g2[1]));
    });
    it("Should add a point", async () => {
        let w, xout, yout;

        g3 = babyJub.addPoint(g,g2);

        w = circuitMAdd.calculateWitness({ in1: mg, in2: mg2});

        xout = w[circuitMAdd.getSignalIdx("main.out[0]")];
        yout = w[circuitMAdd.getSignalIdx("main.out[1]")];

        mg3 = [xout, yout];

        w = circuitM2E.calculateWitness({ in: mg3});

        xout = w[circuitM2E.getSignalIdx("main.out[0]")];
        yout = w[circuitM2E.getSignalIdx("main.out[1]")];

        assert(xout.equals(g3[0]));
        assert(yout.equals(g3[1]));
    });
});
