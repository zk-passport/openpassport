const chai = require("chai");

const F1Field = require("ffjavascript").F1Field;
const Scalar = require("ffjavascript").Scalar;
exports.p = Scalar.fromString("21888242871839275222246405745257275088548364400416034343698204186575808495617");
const Fr = new F1Field(exports.p);

const smt = require("../src/smt.js");

const assert = chai.assert;

describe("SMT Javascript test", function () {
    this.timeout(100000);
    before( async () => {
    });

    it("Should insert 2 elements and empty them", async () => {
        const tree = await smt.newMemEmptyTrie();
        const key1 = Fr.e(111);
        const value1 = Fr.e(222);
        const key2 = Fr.e(333);
        const value2 = Fr.e(444);

        await tree.insert(key1,value1);
        await tree.insert(key2,value2);
        await tree.delete(key2);
        await tree.delete(key1);

        assert(Fr.isZero(tree.root));
    });

    it("Should insert 3 elements in dferent order and should be the same", async () => {
        const keys = [Fr.e(8), Fr.e(9), Fr.e(32)];
        const values = [Fr.e(88), Fr.e(99), Fr.e(3232)];
        const tree1 = await smt.newMemEmptyTrie();
        const tree2 = await smt.newMemEmptyTrie();
        const tree3 = await smt.newMemEmptyTrie();
        const tree4 = await smt.newMemEmptyTrie();
        const tree5 = await smt.newMemEmptyTrie();
        const tree6 = await smt.newMemEmptyTrie();

        await tree1.insert(keys[0],values[0]);
        await tree1.insert(keys[1],values[1]);
        await tree1.insert(keys[2],values[2]);

        await tree2.insert(keys[0],values[0]);
        await tree2.insert(keys[2],values[2]);
        await tree2.insert(keys[1],values[1]);

        await tree3.insert(keys[1],values[1]);
        await tree3.insert(keys[0],values[0]);
        await tree3.insert(keys[2],values[2]);

        await tree4.insert(keys[1],values[1]);
        await tree4.insert(keys[2],values[2]);
        await tree4.insert(keys[0],values[0]);

        await tree5.insert(keys[2],values[2]);
        await tree5.insert(keys[0],values[0]);
        await tree5.insert(keys[1],values[1]);

        await tree6.insert(keys[2],values[2]);
        await tree6.insert(keys[1],values[1]);
        await tree6.insert(keys[0],values[0]);

        assert(Fr.eq(tree1.root, tree2.root));
        assert(Fr.eq(tree2.root, tree3.root));
        assert(Fr.eq(tree3.root, tree4.root));
        assert(Fr.eq(tree4.root, tree5.root));
        assert(Fr.eq(tree5.root, tree6.root));

        assert.equal(Object.keys(tree1.db.nodes).length,  Object.keys(tree2.db.nodes).length);
        assert.equal(Object.keys(tree2.db.nodes).length,  Object.keys(tree3.db.nodes).length);
        assert.equal(Object.keys(tree3.db.nodes).length,  Object.keys(tree4.db.nodes).length);
        assert.equal(Object.keys(tree4.db.nodes).length,  Object.keys(tree5.db.nodes).length);
        assert.equal(Object.keys(tree5.db.nodes).length,  Object.keys(tree6.db.nodes).length);

        await tree1.delete(keys[0]);
        await tree1.delete(keys[1]);
        await tree2.delete(keys[1]);
        await tree2.delete(keys[0]);
        assert(Fr.eq(tree1.root, tree2.root));

        await tree3.delete(keys[0]);
        await tree3.delete(keys[2]);
        await tree4.delete(keys[2]);
        await tree4.delete(keys[0]);
        assert(Fr.eq(tree3.root, tree4.root));

        await tree5.delete(keys[1]);
        await tree5.delete(keys[2]);
        await tree6.delete(keys[2]);
        await tree6.delete(keys[1]);
        assert(Fr.eq(tree5.root, tree6.root));

        await tree1.delete(keys[2]);
        await tree2.delete(keys[2]);
        await tree3.delete(keys[1]);
        await tree4.delete(keys[1]);
        await tree5.delete(keys[0]);
        await tree6.delete(keys[0]);

        assert(Fr.isZero(tree1.root));
        assert(Fr.isZero(tree2.root));
        assert(Fr.isZero(tree3.root));
        assert(Fr.isZero(tree4.root));
        assert(Fr.isZero(tree5.root));
        assert(Fr.isZero(tree6.root));

        assert.equal(Object.keys(tree1.db.nodes).length, 0);
        assert.equal(Object.keys(tree2.db.nodes).length, 0);
        assert.equal(Object.keys(tree3.db.nodes).length, 0);
        assert.equal(Object.keys(tree4.db.nodes).length, 0);
        assert.equal(Object.keys(tree5.db.nodes).length, 0);
        assert.equal(Object.keys(tree6.db.nodes).length, 0);
    });

    it("Insert and remove 100 numbers randomly", async () => {
        function perm(a) {
            const arr = a.slice();
            const rArr = [];
            for (let i=0; i<arr.length; i++) {
                let rIdx = Math.floor(Math.random() * (arr.length - i));
                rArr.push(arr[rIdx]);
                arr[rIdx] = arr[arr.length - i - 1];
            }
            return rArr;
        }
        const tree = await smt.newMemEmptyTrie();
        const arr = [];
        const N = 100;
        for (let i=0; i<N; i++) {
            arr.push(Fr.e(i));
        }
        const insArr = perm(arr);
        for (let i=0; i<N; i++) {
            await tree.insert(insArr[i], i);
        }
        const delArr = perm(insArr);
        for (let i=0; i<N; i++) {
            await tree.delete(delArr[i]);
        }

        assert(Fr.isZero(tree.root));
        assert.equal(Object.keys(tree.db.nodes).length, 0);
    });

    it("Should test update", async () => {
        const tree1 = await smt.newMemEmptyTrie();
        const tree2 = await smt.newMemEmptyTrie();

        await tree1.insert(8,88);
        await tree1.insert(9,99,);
        await tree1.insert(32,3232);

        await tree2.insert(8,888);
        await tree2.insert(9,999);
        await tree2.insert(32,323232);

        await tree1.update(8, 888);
        await tree1.update(9, 999);
        await tree1.update(32, 323232);

        assert(Fr.eq(tree1.root, tree2.root));
    });

    it("Should test update with same key-value", async () => {
        const tree1 = await smt.newMemEmptyTrie();

        await tree1.insert(8,88);
        await tree1.update(8,88);

        const res = await tree1.db.get(tree1.root);
        assert.notEqual(res, undefined);
    });
});
