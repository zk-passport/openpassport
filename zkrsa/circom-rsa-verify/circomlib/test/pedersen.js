const chai = require("chai");
const path = require("path");

const F1Field = require("ffjavascript").F1Field;
const Scalar = require("ffjavascript").Scalar;
exports.p = Scalar.fromString("21888242871839275222246405745257275088548364400416034343698204186575808495617");
const Fr = new F1Field(exports.p);

const tester = require("circom").tester;

const babyJub = require("../src/babyjub.js");

const PBASE =
    [
        [Fr.e("10457101036533406547632367118273992217979173478358440826365724437999023779287"),Fr.e("19824078218392094440610104313265183977899662750282163392862422243483260492317")],
        [Fr.e("2671756056509184035029146175565761955751135805354291559563293617232983272177"),Fr.e("2663205510731142763556352975002641716101654201788071096152948830924149045094")],
        [Fr.e("5802099305472655231388284418920769829666717045250560929368476121199858275951"),Fr.e("5980429700218124965372158798884772646841287887664001482443826541541529227896")],
        [Fr.e("7107336197374528537877327281242680114152313102022415488494307685842428166594"),Fr.e("2857869773864086953506483169737724679646433914307247183624878062391496185654")],
        [Fr.e("20265828622013100949498132415626198973119240347465898028410217039057588424236"),Fr.e("1160461593266035632937973507065134938065359936056410650153315956301179689506")]
    ];

describe("Double Pedersen test", function() {
    let circuit;
    this.timeout(100000);
    before( async() => {

        circuit = await tester(path.join(__dirname, "circuits", "pedersen_test.circom"));

    });
    it("Should pedersen at zero", async () => {

        let w;

        w = await circuit.calculateWitness({ in: ["0", "0"]}, true);

        await circuit.assertOut(w, {out: [0,1]});

    });
    it("Should pedersen at one first generator", async () => {
        let w;

        w = await circuit.calculateWitness({ in: ["1", "0"]}, true);

        await circuit.assertOut(w, {out: PBASE[0]});

    });
    it("Should pedersen at one second generator", async () => {
        let w;

        w = await circuit.calculateWitness({ in: ["0", "1"]}, true);

        await circuit.assertOut(w, {out: PBASE[1]});

    });
    it("Should pedersen at mixed generators", async () => {
        let w;
        w = await circuit.calculateWitness({ in: ["3", "7"]}, true);

        const r = babyJub.addPoint(
            babyJub.mulPointEscalar(PBASE[0], 3),
            babyJub.mulPointEscalar(PBASE[1], 7)
        );

        await circuit.assertOut(w, {out: r});

    });
    it("Should pedersen all ones", async () => {
        let w;

        const allOnes = Fr.sub(Fr.shl(Fr.e("1"), Fr.e(250)), Fr.e("1"));
        w = await circuit.calculateWitness({ in: [allOnes, allOnes]}, true);


        const r2 = babyJub.addPoint(
            babyJub.mulPointEscalar(PBASE[0], allOnes),
            babyJub.mulPointEscalar(PBASE[1], allOnes)
        );

        await circuit.assertOut(w, {out: r2});
    });
});
