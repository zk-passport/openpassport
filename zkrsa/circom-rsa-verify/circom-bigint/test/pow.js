const chai = require("chai");
const path = require("path");
const snarkjs = require("snarkjs");
const bigInt = require("big-integer");

const compiler = require("circom");

const { splitToWords, assertWitnessHas } = require("./util.js");

chai.should();

describe("PowerMod", () => {

    var powmod_4_2_1;
    // Too big
    //var powmod_2048_256;
    var p8 = bigInt("251");
    //var p2048 = bigInt("25717914355775291586866295420422241213392292814267427031341720309981921951072767057619478999086884670784963011723975180524999172558859807643834182600109599549857252041079024745467013236429735446097174830602748484793758886957236453059760282508362189586726015285519621517120747482897819663394295483868171067416664651473682082556891722243484199977248913646230626498572787720591453558210937216231642704418855170247881788852862175920761682230341882112548762052376035207323453496462109943242185621070874128449533369372088764359230593315593528023908011464769307139423876147833621245404411005076860761330417995015508120377673");

    before(async () => {
        let cirDef = await compiler(path.join(__dirname, "circuits", "power_small.circom"));
        powmod_4_2_1 = new snarkjs.Circuit(cirDef);
        //let cirDef2 = await compiler(path.join(__dirname, "circuits", "power_2048_256.circom"));
        //powmod_2048_256 = new snarkjs.Circuit(cirDef2);
    });

    it("should have at most 320 constraints (4 bits, 2 words in base, 1 in exp)", async () => {
        //    <= 4 * bitsExp * (2nw + 4n - w)
        //    <= 4 * 4 * (2 * 8 + 8 - 4)
        //    <= 16 * 20
        //    <= 320
        powmod_4_2_1.nConstraints.should.be.at.most(320);
    });

    it("should compute 1 ** 0 = 1 (mod 251) (4 bits, 2 words in base, 1 in exp)", async () => {
        const m = p8;
        const b = bigInt(1);
        const e = bigInt(0);
        const input = Object.assign({},
            splitToWords(b, 4, 2, "base"),
            splitToWords(e, 4, 1, "exp"),
            splitToWords(m, 4, 2, "modulus"),
        );
        const witness = powmod_4_2_1.calculateWitness(input);
        const expected = b.modPow(e, m);
        assertWitnessHas(powmod_4_2_1, witness, "out", expected, 4, 2);
    });

    [
        {
            "b":1,
            "e":1,
            "m":p8,
        },
        {
            "b":89,
            "e":0,
            "m":p8,
        },
        {
            "b":89,
            "e":1,
            "m":p8,
        },
        {
            "b":89,
            "e":2,
            "m":p8,
        },
        {
            "b":1,
            "e":15,
            "m":p8,
        },
        {
            "b":2,
            "e":15,
            "m":p8,
        },
        {
            "b":15,
            "e":15,
            "m":p8,
        },
        {
            "b":p8.minus(1),
            "e":7,
            "m":p8,
        },
        {
            "b":p8.minus(1),
            "e":15,
            "m":p8,
        },
    ].forEach(({b, e, m}) => {
        const expected = bigInt(b).modPow(bigInt(e), bigInt(m));
        it(`should compute ${b} ** ${e} = ${expected} (mod ${m}) (4 bits, 2 words in base, 1 in exp)`, async () => {
            const input = Object.assign({},
                splitToWords(b, 4, 2, "base"),
                splitToWords(e, 4, 1, "exp"),
                splitToWords(m, 4, 2, "modulus"),
            );
            const witness = powmod_4_2_1.calculateWitness(input);
            assertWitnessHas(powmod_4_2_1, witness, "out", expected, 4, 2);
        });
    });
});
