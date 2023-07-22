const chai = require("chai");
const path = require("path");
const snarkjs = require("snarkjs");
const compiler = require("circom");

const assert = chai.assert;

const bigInt = snarkjs.bigInt;

const babyJub = require("../src/babyjub.js");

const PBASE =
    [
        [bigInt("10457101036533406547632367118273992217979173478358440826365724437999023779287"),bigInt("19824078218392094440610104313265183977899662750282163392862422243483260492317")],
        [bigInt("2671756056509184035029146175565761955751135805354291559563293617232983272177"),bigInt("2663205510731142763556352975002641716101654201788071096152948830924149045094")],
        [bigInt("5802099305472655231388284418920769829666717045250560929368476121199858275951"),bigInt("5980429700218124965372158798884772646841287887664001482443826541541529227896")],
        [bigInt("7107336197374528537877327281242680114152313102022415488494307685842428166594"),bigInt("2857869773864086953506483169737724679646433914307247183624878062391496185654")],
        [bigInt("20265828622013100949498132415626198973119240347465898028410217039057588424236"),bigInt("1160461593266035632937973507065134938065359936056410650153315956301179689506")]
    ];

describe("Double Pedersen test", function() {
    let circuit;
    this.timeout(100000);
    before( async() => {
        const cirDef = await compiler(path.join(__dirname, "circuits", "pedersen_test.circom"));

        circuit = new snarkjs.Circuit(cirDef);

        console.log("NConstrains: " + circuit.nConstraints);
    });
    it("Should pedersen at zero", async () => {

        let w, xout, yout;

        w = circuit.calculateWitness({ in: ["0", "0"]});

        xout = w[circuit.getSignalIdx("main.out[0]")];
        yout = w[circuit.getSignalIdx("main.out[1]")];

        assert(xout.equals("0"));
        assert(yout.equals("1"));
    });
    it("Should pedersen at one first generator", async () => {
        let w, xout, yout;

        w = circuit.calculateWitness({ in: ["1", "0"]});

        xout = bigInt(w[circuit.getSignalIdx("main.out[0]")]);
        yout = bigInt(w[circuit.getSignalIdx("main.out[1]")]);

        assert(xout.equals(PBASE[0][0]));
        assert(yout.equals(PBASE[0][1]));
    });
    it("Should pedersen at one second generator", async () => {
        let w, xout, yout;

        w = circuit.calculateWitness({ in: ["0", "1"]});

        xout = w[circuit.getSignalIdx("main.out[0]")];
        yout = w[circuit.getSignalIdx("main.out[1]")];

        assert(xout.equals(PBASE[1][0]));
        assert(yout.equals(PBASE[1][1]));

    });
    it("Should pedersen at mixed generators", async () => {
        let w, xout, yout;
        w = circuit.calculateWitness({ in: ["3", "7"]});

        xout = w[circuit.getSignalIdx("main.out[0]")];
        yout = w[circuit.getSignalIdx("main.out[1]")];


        const r = babyJub.addPoint(
            babyJub.mulPointEscalar(PBASE[0], 3),
            babyJub.mulPointEscalar(PBASE[1], 7)
        );

        assert(xout.equals(r[0]));
        assert(yout.equals(r[1]));

    });
    it("Should pedersen all ones", async () => {
        let w, xout, yout;

        const allOnes = bigInt("1").shl(250).sub(bigInt("1"));
        w = circuit.calculateWitness({ in: [allOnes, allOnes]});

        xout = w[circuit.getSignalIdx("main.out[0]")];
        yout = w[circuit.getSignalIdx("main.out[1]")];

        const r2 = babyJub.addPoint(
            babyJub.mulPointEscalar(PBASE[0], allOnes),
            babyJub.mulPointEscalar(PBASE[1], allOnes)
        );

        assert(xout.equals(r2[0]));
        assert(yout.equals(r2[1]));
    });
});
