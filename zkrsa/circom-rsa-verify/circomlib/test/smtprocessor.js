const chai = require("chai");
const path = require("path");
const tester = require("circom").tester;
const F1Field = require("ffjavascript").F1Field;
const Scalar = require("ffjavascript").Scalar;
exports.p = Scalar.fromString("21888242871839275222246405745257275088548364400416034343698204186575808495617");
const Fr = new F1Field(exports.p);

const smt = require("../src/smt.js");

const assert = chai.assert;

function print(circuit, w, s) {
    console.log(s + ": " + w[circuit.getSignalIdx(s)]);
}

async function testInsert(tree, key, value, circuit ) {

    const res = await tree.insert(key,value);
    let siblings = res.siblings;
    while (siblings.length<10) siblings.push(Fr.e(0));

    const w = await circuit.calculateWitness({
        fnc: [1,0],
        oldRoot: res.oldRoot,
        siblings: siblings,
        oldKey: res.isOld0 ? 0 : res.oldKey,
        oldValue: res.isOld0 ? 0 : res.oldValue,
        isOld0: res.isOld0 ? 1 : 0,
        newKey: key,
        newValue: value
    }, true);

    await circuit.checkConstraints(w);

    await circuit.assertOut(w, {newRoot: res.newRoot});

}

async function testDelete(tree, key, circuit) {
    const res = await tree.delete(key);
    let siblings = res.siblings;
    while (siblings.length<10) siblings.push(Fr.e(0));

    const w = await circuit.calculateWitness({
        fnc: [1,1],
        oldRoot: res.oldRoot,
        siblings: siblings,
        oldKey: res.isOld0 ? 0 : res.oldKey,
        oldValue: res.isOld0 ? 0 : res.oldValue,
        isOld0: res.isOld0 ? 1 : 0,
        newKey: res.delKey,
        newValue: res.delValue
    }, true);

    await circuit.checkConstraints(w);

    await circuit.assertOut(w, {newRoot: res.newRoot});
}

async function testUpdate(tree, key, newValue, circuit) {
    const res = await tree.update(key, newValue);
    let siblings = res.siblings;
    while (siblings.length<10) siblings.push(Fr.e(0));

    const w = await circuit.calculateWitness({
        fnc: [0,1],
        oldRoot: res.oldRoot,
        siblings: siblings,
        oldKey: res.oldKey,
        oldValue: res.oldValue,
        isOld0: 0,
        newKey: res.newKey,
        newValue: res.newValue
    });

    await circuit.checkConstraints(w);

    await circuit.assertOut(w, {newRoot: res.newRoot});
}


describe("SMT Processor test", function () {
    let circuit;
    let tree;

    this.timeout(10000000);

    before( async () => {
        circuit = await tester(path.join(__dirname, "circuits", "smtprocessor10_test.circom"));
        await circuit.loadSymbols();

        tree = await smt.newMemEmptyTrie();
    });

    it("Should verify an insert to an empty tree", async () => {
        const key = Fr.e(111);
        const value = Fr.e(222);

        await testInsert(tree, key, value, circuit);
    });

    it("It should add another element", async () => {
        const key = Fr.e(333);
        const value = Fr.e(444);

        await testInsert(tree, key, value, circuit);
    });

    it("Should remove an element", async () => {
        await testDelete(tree, 111, circuit);
        await testDelete(tree, 333, circuit);
    });

    it("Should test convination of adding and removing 3 elements", async () => {
        const keys = [Fr.e(8), Fr.e(9), Fr.e(32)];
        const values = [Fr.e(88), Fr.e(99), Fr.e(3232)];
        const tree1 = await smt.newMemEmptyTrie();
        const tree2 = await smt.newMemEmptyTrie();
        const tree3 = await smt.newMemEmptyTrie();
        const tree4 = await smt.newMemEmptyTrie();
        const tree5 = await smt.newMemEmptyTrie();
        const tree6 = await smt.newMemEmptyTrie();

        await testInsert(tree1,keys[0],values[0], circuit);
        await testInsert(tree1,keys[1],values[1], circuit);
        await testInsert(tree1,keys[2],values[2], circuit);

        await testInsert(tree2,keys[0],values[0], circuit);
        await testInsert(tree2,keys[2],values[2], circuit);
        await testInsert(tree2,keys[1],values[1], circuit);

        await testInsert(tree3,keys[1],values[1], circuit);
        await testInsert(tree3,keys[0],values[0], circuit);
        await testInsert(tree3,keys[2],values[2], circuit);

        await testInsert(tree4,keys[1],values[1], circuit);
        await testInsert(tree4,keys[2],values[2], circuit);
        await testInsert(tree4,keys[0],values[0], circuit);

        await testInsert(tree5,keys[2],values[2], circuit);
        await testInsert(tree5,keys[0],values[0], circuit);
        await testInsert(tree5,keys[1],values[1], circuit);

        await testInsert(tree6,keys[2],values[2], circuit);
        await testInsert(tree6,keys[1],values[1], circuit);
        await testInsert(tree6,keys[0],values[0], circuit);


        await testDelete(tree1, keys[0], circuit);
        await testDelete(tree1, keys[1], circuit);
        await testDelete(tree2, keys[1], circuit);
        await testDelete(tree2, keys[0], circuit);

        await testDelete(tree3, keys[0], circuit);
        await testDelete(tree3, keys[2], circuit);
        await testDelete(tree4, keys[2], circuit);
        await testDelete(tree4, keys[0], circuit);


        await testDelete(tree5, keys[1], circuit);
        await testDelete(tree5, keys[2], circuit);
        await testDelete(tree6, keys[2], circuit);
        await testDelete(tree6, keys[1], circuit);

        await testDelete(tree1, keys[2], circuit);
        await testDelete(tree2, keys[2], circuit);
        await testDelete(tree3, keys[1], circuit);
        await testDelete(tree4, keys[1], circuit);
        await testDelete(tree5, keys[0], circuit);
        await testDelete(tree6, keys[0], circuit);
    });

    it("Should match a NOp with random vals", async () => {
        let siblings = [];
        while (siblings.length<10) siblings.push(Fr.e(88));
        const w = await circuit.calculateWitness({
            fnc: [0,0],
            oldRoot: 11,
            siblings: siblings,
            oldKey: 33,
            oldValue: 44,
            isOld0: 55,
            newKey: 66,
            newValue: 77
        });

        const root1 = w[circuit.symbols["main.oldRoot"].varIdx];
        const root2 = w[circuit.symbols["main.newRoot"].varIdx];

        await circuit.checkConstraints(w);

        assert(Fr.eq(root1, root2));
    });
    it("Should update an element", async () => {
        const tree1 = await smt.newMemEmptyTrie();
        const tree2 = await smt.newMemEmptyTrie();

        await testInsert(tree1,8,88, circuit);
        await testInsert(tree1,9,99, circuit);
        await testInsert(tree1,32,3232, circuit);

        await testInsert(tree2,8,888, circuit);
        await testInsert(tree2,9,999, circuit);
        await testInsert(tree2,32,323232, circuit);

        await testUpdate(tree1, 8, 888, circuit);
        await testUpdate(tree1, 9, 999, circuit);
        await testUpdate(tree1, 32, 323232, circuit);
    });
});
