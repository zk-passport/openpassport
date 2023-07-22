const ganache = require("ganache-cli");
const Web3 = require("web3");
const chai = require("chai");
const poseidonGenContract = require("../src/poseidon_gencontract.js");
const poseidon = require("../src/poseidon.js");

const assert = chai.assert;
const log = (msg) => { if (process.env.MOCHA_VERBOSE) console.log(msg); };

describe("Poseidon Smart contract test", function () {
    let testrpc;
    let web3;
    let poseidon6;
    let poseidon3;
    let accounts;
    this.timeout(100000);

    before(async () => {
        web3 = new Web3(ganache.provider(), null, { transactionConfirmationBlocks: 1 });
        accounts = await web3.eth.getAccounts();
    });

    it("Should deploy the contract", async () => {
        const C6 = new web3.eth.Contract(poseidonGenContract.generateABI(5));
        const C3 = new web3.eth.Contract(poseidonGenContract.generateABI(2));

        poseidon6 = await C6.deploy({
            data: poseidonGenContract.createCode(5)
        }).send({
            gas: 5000000,
            from: accounts[0]
        });
        poseidon3 = await C3.deploy({
            data: poseidonGenContract.createCode(2)
        }).send({
            gas: 5000000,
            from: accounts[0]
        });
    });

    it("Should calculate the poseidon correctly t=6", async () => {

        const res = await poseidon6.methods.poseidon([1,2, 0, 0, 0]).call();

        // console.log("Cir: " + bigInt(res.toString(16)).toString(16));

        const res2 = poseidon([1,2, 0, 0, 0]);
        // console.log("Ref: " + bigInt(res2).toString(16));

        assert.equal(res.toString(), res2.toString());
    });
    it("Should calculate the poseidon correctly t=3", async () => {

        const res = await poseidon3.methods.poseidon([1,2]).call();

        // console.log("Cir: " + bigInt(res.toString(16)).toString(16));

        const res2 = poseidon([1,2]);
        // console.log("Ref: " + bigInt(res2).toString(16));

        assert.equal(res.toString(), res2.toString());
    });

});

