const chai = require("chai");
const path = require("path");
const snarkjs = require("snarkjs");
const bigInt = require("big-integer");

const compiler = require("circom");

const { splitToWords } = require("./util.js");

chai.should();

describe("RsAggVerifyDelta (64b RSA, 16b λ, 16b/word)", () => {
    var rsa16_4_1_2;
    var p = bigInt("4154198827");
    var q = bigInt("3311199457");
    var N = p.times(q);
    before(async () => {
        rsa16_4_1_2 = new snarkjs.Circuit(
            await compiler(
                path.join(__dirname, "circuits", "rsa_acc_small.circom")));
    });

    [
        {
            digestWithout: bigInt("2"),
            mem1: bigInt("3"),
            mem2: bigInt("5"),
            challenge: bigInt("57991"),
        },
        {
            digestWithout: bigInt("21741298347192834"),
            mem1: bigInt("3"),
            mem2: bigInt("5"),
            challenge: bigInt("58477"),
        },
        {
            digestWithout: bigInt("7265955459220505897"),
            mem1: bigInt("25121"),
            mem2: bigInt("27361"),
            challenge: bigInt("55793"),
        },
    ].forEach(({digestWithout, mem1, mem2, challenge}) => {
        it(`should verify members ${mem1}, ${mem2} on acc ${digestWithout} with challenge ${challenge}`, async () => {
            const digestWith = digestWithout.modPow(mem1.times(mem2), N);
            const witness = digestWithout.modPow(mem1.times(mem2).divide(challenge), N);
            const input = Object.assign({},
                splitToWords(digestWith, 16, 4, "digestWith"),
                splitToWords(digestWithout, 16, 4, "digestWithout"),
                splitToWords(N, 16, 4, "modulus"),
                splitToWords(witness, 16, 4, "witness"),
                splitToWords(mem1, 16, 1, "member[0]"),
                splitToWords(mem2, 16, 1, "member[1]"),
                splitToWords(challenge, 16, 1, "challenge"),
            );
            rsa16_4_1_2.calculateWitness(input);
        });
    });

});
