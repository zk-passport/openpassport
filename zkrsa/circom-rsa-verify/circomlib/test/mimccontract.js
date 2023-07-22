const ganache = require("ganache-cli");
const Web3 = require("web3");
const chai = require("chai");
const mimcGenContract = require("../src/mimc_gencontract.js");
const mimcjs = require("../src/mimc7.js");


const assert = chai.assert;
const log = (msg) => { if (process.env.MOCHA_VERBOSE) console.log(msg); };

const SEED = "mimc";

describe("MiMC Smart contract test", function () {
    let testrpc;
    let web3;
    let mimc;
    let accounts;

    this.timeout(100000);

    before(async () => {
        web3 = new Web3(ganache.provider(), null, { transactionConfirmationBlocks: 1 });
        accounts = await web3.eth.getAccounts();
    });

    it("Should deploy the contract", async () => {
        const C = new web3.eth.Contract(mimcGenContract.abi);

        mimc = await C.deploy({
            data: mimcGenContract.createCode(SEED, 91),
            arguments: []
        }).send({
            gas: 1500000,
            gasPrice: '30000000000000',
            from: accounts[0]
        }).on("error", (error) => {
            console.log("ERROR: "+error);
        });
    });

    it("Shold calculate the mimic correctly", async () => {
        const res = await mimc.methods.MiMCpe7(1,2).call();
        const res2 = await mimcjs.hash(1,2,91);

        assert.equal(res.toString(), res2.toString());
    });
});

