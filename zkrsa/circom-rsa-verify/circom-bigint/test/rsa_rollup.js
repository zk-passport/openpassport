const chai = require("chai");
const path = require("path");
const snarkjs = require("snarkjs");
//const bigInt = require("big-integer");

const compiler = require("circom");

//const { splitToWords, assertWitnessHas, extractExpr } = require("./util.js");

chai.should();

describe("BalanceHash", () => {
    var bhash;

    before(async () => {
        bhash = new snarkjs.Circuit(
            await compiler(
                path.join(__dirname, "circuits", "balance_hash.circom")));
    });

    it("should have <= 5,000 constraints", async () => {
        bhash.nConstraints.should.be.at.most(5000);
    });
});
