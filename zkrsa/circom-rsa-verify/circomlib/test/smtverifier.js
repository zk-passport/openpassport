const chai = require("chai");
const path = require("path");
const F1Field = require("ffjavascript").F1Field;
const Scalar = require("ffjavascript").Scalar;
exports.p = Scalar.fromString("21888242871839275222246405745257275088548364400416034343698204186575808495617");
const Fr = new F1Field(exports.p);
const tester = require("circom").tester;

const smt = require("../src/smt.js");

const assert = chai.assert;

function print(circuit, w, s) {
    console.log(s + ": " + w[circuit.getSignalIdx(s)]);
}

async function testInclusion(tree, key, circuit) {

    const res = await tree.find(key);

    assert(res.found);
    let siblings = res.siblings;
    while (siblings.length<10) siblings.push(Fr.e(0));

    const w = await circuit.calculateWitness({
        enabled: 1,
        fnc: 0,
        root: tree.root,
        siblings: siblings,
        oldKey: 0,
        oldValue: 0,
        isOld0: 0,
        key: key,
        value: res.foundValue
    }, true);

    await circuit.checkConstraints(w);

}

async function testExclusion(tree, key, circuit) {
    const res = await tree.find(key);

    assert(!res.found);
    let siblings = res.siblings;
    while (siblings.length<10) siblings.push(Fr.e(0));

    const w = await circuit.calculateWitness({
        enabled: 1,
        fnc: 1,
        root: tree.root,
        siblings: siblings,
        oldKey: res.isOld0 ? 0 : res.notFoundKey,
        oldValue: res.isOld0 ? 0 : res.notFoundValue,
        isOld0: res.isOld0 ? 1 : 0,
        key: key,
        value: 0
    });

    await circuit.checkConstraints(w);

}

describe("SMT Verifier test", function () {
    let circuit;
    let tree;

    this.timeout(100000);

    before( async () => {
        circuit = await tester(path.join(__dirname, "circuits", "smtverifier10_test.circom"));

        tree = await smt.newMemEmptyTrie();
        await tree.insert(7,77);
        await tree.insert(8,88);
        await tree.insert(32,3232);
    });

    it("Check inclussion in a tree of 3", async () => {
        await testInclusion(tree, 7, circuit);
        await testInclusion(tree, 8, circuit);
        await testInclusion(tree, 32, circuit);
    });

    it("Check exclussion in a tree of 3", async () => {
        await testExclusion(tree, 0, circuit);
        await testExclusion(tree, 6, circuit);
        await testExclusion(tree, 9, circuit);
        await testExclusion(tree, 33, circuit);
        await testExclusion(tree, 31, circuit);
        await testExclusion(tree, 16, circuit);
        await testExclusion(tree, 64, circuit);
    });

    it("Check not enabled accepts any thing", async () => {
        let siblings = [];
        for (let i=0; i<10; i++) siblings.push(i);

        const w = await circuit.calculateWitness({
            enabled: 0,
            fnc: 0,
            root: 1,
            siblings: siblings,
            oldKey: 22,
            oldValue: 33,
            isOld0: 0,
            key: 44,
            value: 0
        });


        await circuit.checkConstraints(w);
    });

    it("Check inclussion Adria case", async () => {
        const e1_hi= Fr.e("17124152697573569611556136390143205198134245887034837071647643529178599000839");
        const e1_hv= Fr.e("19650379996168153643111744440707177573540245771926102415571667548153444658179");

        const e2ok_hi= Fr.e("16498254692537945203721083102154618658340563351558973077349594629411025251262");
        const e2ok_hv= Fr.e("19650379996168153643111744440707177573540245771926102415571667548153444658179");

        const e2fail_hi= Fr.e("17195092312975762537892237130737365903429674363577646686847513978084990105579");
        const e2fail_hv= Fr.e("19650379996168153643111744440707177573540245771926102415571667548153444658179");

        const tree1 = await smt.newMemEmptyTrie();
        await tree1.insert(e1_hi,e1_hv);
        await tree1.insert(e2ok_hi,e2ok_hv);

        await testInclusion(tree1, e2ok_hi, circuit);

        const tree2 = await smt.newMemEmptyTrie();
        await tree2.insert(e1_hi,e1_hv);
        await tree2.insert(e2fail_hi,e2fail_hv);

        await testInclusion(tree2, e2fail_hi, circuit);
    });


});
