const chai = require("chai");
const path = require("path");
const snarkjs = require("snarkjs");
const bigInt = require("big-integer");

const compiler = require("circom");

const { assertWitnessHas, splitToWords, extractExpr } = require("./util.js");

const assert = chai.assert;
chai.should();

describe("WordMultiplier", () => {

    var cirDef;

    before(async () => {
        cirDef = await compiler(path.join(__dirname, "circuits", "word_multiplier_4.circom"));
    });

    it("should be compilable", async () => {
        new snarkjs.Circuit(cirDef);
    });

    it("should have 4 + 4 + 1 constraints (4 bits/word)", async () => {
        const circuit = new snarkjs.Circuit(cirDef);
        circuit.nConstraints.should.equal(4 + 4 + 1);
    });

    it("should compute 15 * 3 = 2,13 (4 bits/word)", async () => {
        const circuit = new snarkjs.Circuit(cirDef);
        const witness = circuit.calculateWitness({
            "a": "15",
            "b": "3",
            "prod": "13",
            "carry": "2",
        });
        assert(witness[circuit.signalName2Idx["main.prod"]].equals(snarkjs.bigInt(13)));
        assert(witness[circuit.signalName2Idx["main.carry"]].equals(snarkjs.bigInt(2)));
    });
});

describe("WordMultiplierWithCarry", () => {
    var cirDef;

    before(async () => {
        cirDef = await compiler(path.join(__dirname, "circuits", "word_multiplier_carry_4.circom"));
    });

    it("should be compilable", async () => {
        new snarkjs.Circuit(cirDef);
    });

    it("should have 4 + 4 + 1 constraints (4 bits/word)", async () => {
        // 2w + 1
        const circuit = new snarkjs.Circuit(cirDef);
        circuit.nConstraints.should.equal(4 + 4 + 1);
    });
    it("should compute 15 * 3 + 6 = 3,3 (4 bits/word)", async () => {
        const circuit = new snarkjs.Circuit(cirDef);
        const witness = circuit.calculateWitness({
            "a": "15",
            "b": "3",
            "carryIn1": 6,
            "carryIn2": 0,
        });
        assert(witness[circuit.signalName2Idx["main.prod"]].equals(snarkjs.bigInt(3)));
        assert(witness[circuit.signalName2Idx["main.carryOut"]].equals(snarkjs.bigInt(3)));
    });
    it("should compute 15 * 15 + 15 + 15 = 15,15 (4 bits/word)", async () => {
        const circuit = new snarkjs.Circuit(cirDef);
        const witness = circuit.calculateWitness({
            "a": "15",
            "b": "15",
            "carryIn1": 15,
            "carryIn2": 15,
        });
        assert(witness[circuit.signalName2Idx["main.prod"]].equals(snarkjs.bigInt(15)));
        assert(witness[circuit.signalName2Idx["main.carryOut"]].equals(snarkjs.bigInt(15)));
    });
});

describe("NBy1Multiplier", () => {
    var cirDef;

    before(async () => {
        cirDef = await compiler(path.join(__dirname, "circuits", "n_by_1_mult_4bit_2word.circom"));
    });

    it("should be compilable", async () => {
        new snarkjs.Circuit(cirDef);
    });

    it("should have 18 constraints", async () => {
        // n (2w + 1)
        const circuit = new snarkjs.Circuit(cirDef);
        circuit.nConstraints.should.equal(18);
    });

    it("should compute 3,3 * 13 = 2,9,7 (4 bits/word, 2 words)", async () => {
        const circuit = new snarkjs.Circuit(cirDef);
        const witness = circuit.calculateWitness({
            "a[0]": "3",
            "a[1]": "3",
            "b": "13",
            "c[0]" : "0",
            "c[1]" : "0",
        });
        assert(witness[circuit.signalName2Idx["main.prod[0]"]].equals(snarkjs.bigInt(7)));
        assert(witness[circuit.signalName2Idx["main.prod[1]"]].equals(snarkjs.bigInt(9)));
        assert(witness[circuit.signalName2Idx["main.prod[2]"]].equals(snarkjs.bigInt(2)));
    });
    it("should compute 15,15 * 15 + 15,15 = 15,15,0 (4 bits/word, 2 words)", async () => {
        const circuit = new snarkjs.Circuit(cirDef);
        const witness = circuit.calculateWitness({
            "a[0]": "15",
            "a[1]": "15",
            "b": "15",
            "c[0]" : "15",
            "c[1]" : "15",
        });
        assert(witness[circuit.signalName2Idx["main.prod[0]"]].equals(snarkjs.bigInt(0)));
        assert(witness[circuit.signalName2Idx["main.prod[1]"]].equals(snarkjs.bigInt(15)));
        assert(witness[circuit.signalName2Idx["main.prod[2]"]].equals(snarkjs.bigInt(15)));
    });
});

describe("Multiplier", () => {
    var cirDef;

    before(async () => {
        cirDef = await compiler(path.join(__dirname, "circuits", "mult_4bit_2word.circom"));
    });

    it("should be compilable", async () => {
        new snarkjs.Circuit(cirDef);
    });

    it("should have 36 constraints (4 bits/word, 2 words)", async () => {
        // n * n * (2w + 1)
        const circuit = new snarkjs.Circuit(cirDef);
        circuit.nConstraints.should.equal(36);
    });

    it("should compute 1 * 1 = 1 (4 bits/word, 2 words)", async () => {
        const circuit = new snarkjs.Circuit(cirDef);
        const witness = circuit.calculateWitness({
            "a[0]": "1",
            "a[1]": "0",
            "b[0]": "1",
            "b[1]": "0",
        });
        assert(witness[circuit.signalName2Idx["main.prod[0]"]].equals(snarkjs.bigInt(1)));
        assert(witness[circuit.signalName2Idx["main.prod[1]"]].equals(snarkjs.bigInt(0)));
        assert(witness[circuit.signalName2Idx["main.prod[2]"]].equals(snarkjs.bigInt(0)));
        assert(witness[circuit.signalName2Idx["main.prod[3]"]].equals(snarkjs.bigInt(0)));
    });

    it("should compute 1,0 * 1,0 = 1,0,0 (4 bits/word, 2 words)", async () => {
        const circuit = new snarkjs.Circuit(cirDef);
        const witness = circuit.calculateWitness({
            "a[0]": "0",
            "a[1]": "1",
            "b[0]": "0",
            "b[1]": "1",
        });
        assert(witness[circuit.signalName2Idx["main.prod[0]"]].equals(snarkjs.bigInt(0)));
        assert(witness[circuit.signalName2Idx["main.prod[1]"]].equals(snarkjs.bigInt(0)));
        assert(witness[circuit.signalName2Idx["main.prod[2]"]].equals(snarkjs.bigInt(1)));
        assert(witness[circuit.signalName2Idx["main.prod[3]"]].equals(snarkjs.bigInt(0)));
    });

    it("should compute 1,3 * 3,0 = 0,3,9,0 (4 bits/word, 2 words)", async () => {
        const circuit = new snarkjs.Circuit(cirDef);
        const witness = circuit.calculateWitness({
            "a[0]": "3",
            "a[1]": "1",
            "b[0]": "0",
            "b[1]": "3",
        });
        assert(witness[circuit.signalName2Idx["main.prod[0]"]].equals(snarkjs.bigInt(0)));
        assert(witness[circuit.signalName2Idx["main.prod[1]"]].equals(snarkjs.bigInt(9)));
        assert(witness[circuit.signalName2Idx["main.prod[2]"]].equals(snarkjs.bigInt(3)));
        assert(witness[circuit.signalName2Idx["main.prod[3]"]].equals(snarkjs.bigInt(0)));
    });

    it("should compute 3,0 * 1,3  = 0,3,9,0 (4 bits/word, 2 words)", async () => {
        const circuit = new snarkjs.Circuit(cirDef);
        const witness = circuit.calculateWitness({
            "a[0]": "0",
            "a[1]": "3",
            "b[0]": "3",
            "b[1]": "1",
        });
        assert(witness[circuit.signalName2Idx["main.prod[0]"]].equals(snarkjs.bigInt(0)));
        assert(witness[circuit.signalName2Idx["main.prod[1]"]].equals(snarkjs.bigInt(9)));
        assert(witness[circuit.signalName2Idx["main.prod[2]"]].equals(snarkjs.bigInt(3)));
        assert(witness[circuit.signalName2Idx["main.prod[3]"]].equals(snarkjs.bigInt(0)));
    });

    it("should compute 8,7 * 9,3  = 4,13,8,5 (4 bits/word, 2 words)", async () => {
        const circuit = new snarkjs.Circuit(cirDef);
        const witness = circuit.calculateWitness({
            "a[0]": "7",
            "a[1]": "8",
            "b[0]": "3",
            "b[1]": "9",
        });
        assert(witness[circuit.signalName2Idx["main.prod[0]"]].equals(snarkjs.bigInt(5)));
        assert(witness[circuit.signalName2Idx["main.prod[1]"]].equals(snarkjs.bigInt(8)));
        assert(witness[circuit.signalName2Idx["main.prod[2]"]].equals(snarkjs.bigInt(13)));
        assert(witness[circuit.signalName2Idx["main.prod[3]"]].equals(snarkjs.bigInt(4)));
    });

    it("should compute 9,3 * 8,7 = 4,13,8,5 (4 bits/word, 2 words)", async () => {
        const circuit = new snarkjs.Circuit(cirDef);
        const witness = circuit.calculateWitness({
            "a[0]": "3",
            "a[1]": "9",
            "b[0]": "7",
            "b[1]": "8",
        });
        assert(witness[circuit.signalName2Idx["main.prod[0]"]].equals(snarkjs.bigInt(5)));
        assert(witness[circuit.signalName2Idx["main.prod[1]"]].equals(snarkjs.bigInt(8)));
        assert(witness[circuit.signalName2Idx["main.prod[2]"]].equals(snarkjs.bigInt(13)));
        assert(witness[circuit.signalName2Idx["main.prod[3]"]].equals(snarkjs.bigInt(4)));
    });
    it("should compute 15,15 * 15,15 = 15,14,0,1 (4 bits/word, 2 words)", async () => {
        const circuit = new snarkjs.Circuit(cirDef);
        const witness = circuit.calculateWitness({
            "a[0]": "15",
            "a[1]": "15",
            "b[0]": "15",
            "b[1]": "15",
        });
        assert(witness[circuit.signalName2Idx["main.prod[0]"]].equals(snarkjs.bigInt(1)));
        assert(witness[circuit.signalName2Idx["main.prod[1]"]].equals(snarkjs.bigInt(0)));
        assert(witness[circuit.signalName2Idx["main.prod[2]"]].equals(snarkjs.bigInt(14)));
        assert(witness[circuit.signalName2Idx["main.prod[3]"]].equals(snarkjs.bigInt(15)));
    });
});

describe("PolynomialMultiplier", () => {
    var polymult_d4;
    var polymult_d32;

    before(async () => {
        polymult_d4 = await compiler(path.join(__dirname, "circuits", "polymult_d4.circom"));
        polymult_d32 = await compiler(path.join(__dirname, "circuits", "polymult_d32.circom"));
    });

    it("should be compilable", async () => {
        new snarkjs.Circuit(polymult_d4);
    });

    it("should have 7 constraints (degree <4)", async () => {
        // 2 * d - 1
        const circuit = new snarkjs.Circuit(polymult_d4);
        circuit.nConstraints.should.equal(7);
    });

    it("should compute 1 * 1 = 1 (degree <4)", async () => {
        const circuit = new snarkjs.Circuit(polymult_d4);
        const witness = circuit.calculateWitness({
            "a[0]": "1",
            "a[1]": "0",
            "a[2]": "0",
            "a[3]": "0",
            "b[0]": "1",
            "b[1]": "0",
            "b[2]": "0",
            "b[3]": "0",
        });
        assert(witness[circuit.signalName2Idx["main.prod[0]"]].equals(snarkjs.bigInt(1)));
        assert(witness[circuit.signalName2Idx["main.prod[1]"]].equals(snarkjs.bigInt(0)));
        assert(witness[circuit.signalName2Idx["main.prod[2]"]].equals(snarkjs.bigInt(0)));
        assert(witness[circuit.signalName2Idx["main.prod[3]"]].equals(snarkjs.bigInt(0)));
        assert(witness[circuit.signalName2Idx["main.prod[4]"]].equals(snarkjs.bigInt(0)));
        assert(witness[circuit.signalName2Idx["main.prod[5]"]].equals(snarkjs.bigInt(0)));
        assert(witness[circuit.signalName2Idx["main.prod[6]"]].equals(snarkjs.bigInt(0)));
    });

    it("should compute 1,0,3 * 3,1 = 3,1,9,3 (degree <4)", async () => {
        const circuit = new snarkjs.Circuit(polymult_d4);
        const witness = circuit.calculateWitness({
            "a[0]": "3",
            "a[1]": "0",
            "a[2]": "1",
            "a[3]": "0",
            "b[0]": "1",
            "b[1]": "3",
            "b[2]": "0",
            "b[3]": "0",
        });
        assert(witness[circuit.signalName2Idx["main.prod[0]"]].equals(snarkjs.bigInt(3)));
        assert(witness[circuit.signalName2Idx["main.prod[1]"]].equals(snarkjs.bigInt(9)));
        assert(witness[circuit.signalName2Idx["main.prod[2]"]].equals(snarkjs.bigInt(1)));
        assert(witness[circuit.signalName2Idx["main.prod[3]"]].equals(snarkjs.bigInt(3)));
        assert(witness[circuit.signalName2Idx["main.prod[4]"]].equals(snarkjs.bigInt(0)));
        assert(witness[circuit.signalName2Idx["main.prod[5]"]].equals(snarkjs.bigInt(0)));
        assert(witness[circuit.signalName2Idx["main.prod[6]"]].equals(snarkjs.bigInt(0)));
    });

    it("should compute (3 + 4x + 5x^2 + 6x^3)(9 + 10x + 11x^2 + 12x^3) = 72 x^6 + 126 x^5 + 163 x^4 + 184 x^3 + 118 x^2 + 66 x + 27 (degree <4)", async () => {
        const circuit = new snarkjs.Circuit(polymult_d4);
        const witness = circuit.calculateWitness({
            "a[0]": "3",
            "a[1]": "4",
            "a[2]": "5",
            "a[3]": "6",
            "b[0]": "9",
            "b[1]": "10",
            "b[2]": "11",
            "b[3]": "12",
        });
        assert(witness[circuit.signalName2Idx["main.prod[0]"]].equals(snarkjs.bigInt(27)));
        assert(witness[circuit.signalName2Idx["main.prod[1]"]].equals(snarkjs.bigInt(66)));
        assert(witness[circuit.signalName2Idx["main.prod[2]"]].equals(snarkjs.bigInt(118)));
        assert(witness[circuit.signalName2Idx["main.prod[3]"]].equals(snarkjs.bigInt(184)));
        assert(witness[circuit.signalName2Idx["main.prod[4]"]].equals(snarkjs.bigInt(163)));
        assert(witness[circuit.signalName2Idx["main.prod[5]"]].equals(snarkjs.bigInt(126)));
        assert(witness[circuit.signalName2Idx["main.prod[6]"]].equals(snarkjs.bigInt(72)));
    });

    it("should compute a big square (deg <32)", async () => {
        const circuit = new snarkjs.Circuit(polymult_d32);
        const witness = circuit.calculateWitness({
            "a[0]": "4819187580044832333",
            "a[1]": "9183764011217009606",
            "a[2]": "11426964127496009747",
            "a[3]": "17898263845095661790",
            "a[4]": "12102522037140783322",
            "a[5]": "4029304176671511763",
            "a[6]": "11339410859987005436",
            "a[7]": "12120243430436644729",
            "a[8]": "2888435820322958146",
            "a[9]": "7612614626488966390",
            "a[10]": "3872170484348249672",
            "a[11]": "9589147526444685354",
            "a[12]": "16391157694429928307",
            "a[13]": "12256166884204507566",
            "a[14]": "4257963982333550934",
            "a[15]": "916988490704",
            "a[16]": "0",
            "a[17]": "0",
            "a[18]": "0",
            "a[19]": "0",
            "a[20]": "0",
            "a[21]": "0",
            "a[22]": "0",
            "a[23]": "0",
            "a[24]": "0",
            "a[25]": "0",
            "a[26]": "0",
            "a[27]": "0",
            "a[28]": "0",
            "a[29]": "0",
            "a[30]": "0",
            "a[31]": "0",
            "b[0]": "4819187580044832333",
            "b[1]": "9183764011217009606",
            "b[2]": "11426964127496009747",
            "b[3]": "17898263845095661790",
            "b[4]": "12102522037140783322",
            "b[5]": "4029304176671511763",
            "b[6]": "11339410859987005436",
            "b[7]": "12120243430436644729",
            "b[8]": "2888435820322958146",
            "b[9]": "7612614626488966390",
            "b[10]": "3872170484348249672",
            "b[11]": "9589147526444685354",
            "b[12]": "16391157694429928307",
            "b[13]": "12256166884204507566",
            "b[14]": "4257963982333550934",
            "b[15]": "916988490704",
            "b[16]": "0",
            "b[17]": "0",
            "b[18]": "0",
            "b[19]": "0",
            "b[20]": "0",
            "b[21]": "0",
            "b[22]": "0",
            "b[23]": "0",
            "b[24]": "0",
            "b[25]": "0",
            "b[26]": "0",
            "b[27]": "0",
            "b[28]": "0",
            "b[29]": "0",
            "b[30]": "0",
            "b[31]": "0",
        });
        assert(witness[circuit.signalName2Idx["main.prod[0]"]].equals(snarkjs.bigInt( "23224568931658367244754058218082222889")));
        assert(witness[circuit.signalName2Idx["main.prod[1]"]].equals(snarkjs.bigInt( "88516562921839445888640380379840781596")));
        assert(witness[circuit.signalName2Idx["main.prod[2]"]].equals(snarkjs.bigInt( "194478888615417946406783868151393774738")));
        assert(witness[circuit.signalName2Idx["main.prod[3]"]].equals(snarkjs.bigInt( "382395265476432217957523230769986571504")));
        assert(witness[circuit.signalName2Idx["main.prod[4]"]].equals(snarkjs.bigInt( "575971019676008360859069855433378813941")));
        assert(witness[circuit.signalName2Idx["main.prod[5]"]].equals(snarkjs.bigInt( "670174995752918677131397897218932582682")));
        assert(witness[circuit.signalName2Idx["main.prod[6]"]].equals(snarkjs.bigInt( "780239872348808029089572423614905198300")));
        assert(witness[circuit.signalName2Idx["main.prod[7]"]].equals(snarkjs.bigInt( "850410093737715640261630122959874522628")));
        assert(witness[circuit.signalName2Idx["main.prod[8]"]].equals(snarkjs.bigInt( "800314959349304909735238452892956199392")));
        assert(witness[circuit.signalName2Idx["main.prod[9]"]].equals(snarkjs.bigInt( "906862855407309870283714027678210238070")));
        assert(witness[circuit.signalName2Idx["main.prod[10]"]].equals(snarkjs.bigInt( "967727310654811444144097720329196927129")));
        assert(witness[circuit.signalName2Idx["main.prod[11]"]].equals(snarkjs.bigInt( "825671020037461535758117365587238596380")));
        assert(witness[circuit.signalName2Idx["main.prod[12]"]].equals(snarkjs.bigInt( "991281789723902700168027417052185830252")));
        assert(witness[circuit.signalName2Idx["main.prod[13]"]].equals(snarkjs.bigInt( "1259367815833216292413970809061165585320")));
        assert(witness[circuit.signalName2Idx["main.prod[14]"]].equals(snarkjs.bigInt( "1351495628781923848799708082622582598675")));
        assert(witness[circuit.signalName2Idx["main.prod[15]"]].equals(snarkjs.bigInt( "1451028634949220760698564802414695011932")));
        assert(witness[circuit.signalName2Idx["main.prod[16]"]].equals(snarkjs.bigInt( "1290756126635958771067082204577975256756")));
        assert(witness[circuit.signalName2Idx["main.prod[17]"]].equals(snarkjs.bigInt( "936482288980049848345464202850902738826")));
        assert(witness[circuit.signalName2Idx["main.prod[18]"]].equals(snarkjs.bigInt( "886330568585033438612679243731110283692")));
        assert(witness[circuit.signalName2Idx["main.prod[19]"]].equals(snarkjs.bigInt( "823948310509772835433730556487356331346")));
        assert(witness[circuit.signalName2Idx["main.prod[20]"]].equals(snarkjs.bigInt( "649341353489205691855914543942648985328")));
        assert(witness[circuit.signalName2Idx["main.prod[21]"]].equals(snarkjs.bigInt( "497838205323760437611385487609464464168")));
        assert(witness[circuit.signalName2Idx["main.prod[22]"]].equals(snarkjs.bigInt( "430091148520710550273018448938020664564")));
        assert(witness[circuit.signalName2Idx["main.prod[23]"]].equals(snarkjs.bigInt( "474098876922017329965321439330710234148")));
        assert(witness[circuit.signalName2Idx["main.prod[24]"]].equals(snarkjs.bigInt( "536697574159375092388958994084813127393")));
        assert(witness[circuit.signalName2Idx["main.prod[25]"]].equals(snarkjs.bigInt( "483446024935732188792400155524449880972")));
        assert(witness[circuit.signalName2Idx["main.prod[26]"]].equals(snarkjs.bigInt( "289799562463011227421662267162524920264")));
        assert(witness[circuit.signalName2Idx["main.prod[27]"]].equals(snarkjs.bigInt( "104372664369829937912234314161010649544")));
        assert(witness[circuit.signalName2Idx["main.prod[28]"]].equals(snarkjs.bigInt( "18130279752377737976455635841349605284")));
        assert(witness[circuit.signalName2Idx["main.prod[29]"]].equals(snarkjs.bigInt( "7809007931264072381739139035072")));
        assert(witness[circuit.signalName2Idx["main.prod[30]"]].equals(snarkjs.bigInt( "840867892083599894415616")));
        assert(witness[circuit.signalName2Idx["main.prod[31]"]].equals(snarkjs.bigInt( "0")));
    });
});

describe("AsymmetricPolynomialMultiplier", () => {
    var asymm_poly_2_5;

    before(async () => {
        asymm_poly_2_5 = new snarkjs.Circuit(await compiler(path.join(__dirname, "circuits", "asymm_poly_2_5.circom")));
    });

    it("should have 6 constraints (degrees 2, 5)", async () => {
        // 2 + 5 - 1
        asymm_poly_2_5.nConstraints.should.equal(6);
    });

    it("should compute 1 * 1 = 1 (degrees 2, 5)", async () => {
        const input = Object.assign({},
            splitToWords(bigInt("1"), 100, 2, "in0"),
            splitToWords(bigInt("1"), 100, 5, "in1"),
        );
        const witness = asymm_poly_2_5.calculateWitness(input);
        assertWitnessHas(asymm_poly_2_5, witness, "out", bigInt("1"), 100, 6);
    });

    it("should compute 1,1 * 1,1,1 = 1,2,2,1 (degrees 2, 5)", async () => {
        const input = {
            "in0[0]": "1",
            "in0[1]": "1",
            "in1[0]": "1",
            "in1[1]": "1",
            "in1[2]": "1",
            "in1[3]": "0",
            "in1[4]": "0",
        };
        const witness = asymm_poly_2_5.calculateWitness(input);
        assert(witness[asymm_poly_2_5.signalName2Idx["main.out[0]"]].equals(snarkjs.bigInt( "1")));
        assert(witness[asymm_poly_2_5.signalName2Idx["main.out[1]"]].equals(snarkjs.bigInt( "2")));
        assert(witness[asymm_poly_2_5.signalName2Idx["main.out[2]"]].equals(snarkjs.bigInt( "2")));
        assert(witness[asymm_poly_2_5.signalName2Idx["main.out[3]"]].equals(snarkjs.bigInt( "1")));
    });
    it("should compute 1,7 * 1,1,1 = 1,8,8,7 (degrees 2, 5)", async () => {
        const input = {
            "in0[0]": "1",
            "in0[1]": "7",
            "in1[0]": "1",
            "in1[1]": "1",
            "in1[2]": "1",
            "in1[3]": "0",
            "in1[4]": "0",
        };
        const witness = asymm_poly_2_5.calculateWitness(input);
        assert(witness[asymm_poly_2_5.signalName2Idx["main.out[0]"]].equals(snarkjs.bigInt( "1")));
        assert(witness[asymm_poly_2_5.signalName2Idx["main.out[1]"]].equals(snarkjs.bigInt( "8")));
        assert(witness[asymm_poly_2_5.signalName2Idx["main.out[2]"]].equals(snarkjs.bigInt( "8")));
        assert(witness[asymm_poly_2_5.signalName2Idx["main.out[3]"]].equals(snarkjs.bigInt( "7")));
    });
});

describe("Carry", () => {
    var cirDef;

    before(async () => {
        cirDef = await compiler(path.join(__dirname, "circuits", "carry_3_4.circom"));
    });

    it("should be compilable", async () => {
        new snarkjs.Circuit(cirDef);
    });

    it("should have at most 35 constraints (3 bits, 4 words)", async () => {
        // 2nw + 2n + w
        // = 24 + 8 + 3
        // = 35
        const circuit = new snarkjs.Circuit(cirDef);
        circuit.nConstraints.should.be.at.most(35);
    });
    it("should carry 0,0,0,0 into 0,0,0,0,0", async () => {
        const circuit = new snarkjs.Circuit(cirDef);
        const witness = circuit.calculateWitness({
            "in[0]": "0",
            "in[1]": "0",
            "in[2]": "0",
            "in[3]": "0",
        });
        assert(witness[circuit.signalName2Idx["main.out[0]"]].equals(snarkjs.bigInt(0)));
        assert(witness[circuit.signalName2Idx["main.out[1]"]].equals(snarkjs.bigInt(0)));
        assert(witness[circuit.signalName2Idx["main.out[2]"]].equals(snarkjs.bigInt(0)));
        assert(witness[circuit.signalName2Idx["main.out[3]"]].equals(snarkjs.bigInt(0)));
        assert(witness[circuit.signalName2Idx["main.out[4]"]].equals(snarkjs.bigInt(0)));
    });
    it("should carry 0,0,9,9 into 0,0,1,2,1", async () => {
        const circuit = new snarkjs.Circuit(cirDef);
        const witness = circuit.calculateWitness({
            "in[0]": "9",
            "in[1]": "9",
            "in[2]": "0",
            "in[3]": "0",
        });
        assert(witness[circuit.signalName2Idx["main.out[0]"]].equals(snarkjs.bigInt(1)));
        assert(witness[circuit.signalName2Idx["main.out[1]"]].equals(snarkjs.bigInt(2)));
        assert(witness[circuit.signalName2Idx["main.out[2]"]].equals(snarkjs.bigInt(1)));
        assert(witness[circuit.signalName2Idx["main.out[3]"]].equals(snarkjs.bigInt(0)));
        assert(witness[circuit.signalName2Idx["main.out[4]"]].equals(snarkjs.bigInt(0)));
    });
    it("should carry 0,0,49,49 into 0,0,6,7,1", async () => {
        const circuit = new snarkjs.Circuit(cirDef);
        const witness = circuit.calculateWitness({
            "in[0]": "49",
            "in[1]": "49",
            "in[2]": "0",
            "in[3]": "0",
        });
        assert(witness[circuit.signalName2Idx["main.out[0]"]].equals(snarkjs.bigInt(1)));
        assert(witness[circuit.signalName2Idx["main.out[1]"]].equals(snarkjs.bigInt(7)));
        assert(witness[circuit.signalName2Idx["main.out[2]"]].equals(snarkjs.bigInt(6)));
        assert(witness[circuit.signalName2Idx["main.out[3]"]].equals(snarkjs.bigInt(0)));
        assert(witness[circuit.signalName2Idx["main.out[4]"]].equals(snarkjs.bigInt(0)));
    });
    it("should carry 49,49,49,49 into 0,0,6,7,1", async () => {
        const circuit = new snarkjs.Circuit(cirDef);
        const witness = circuit.calculateWitness({
            "in[0]": "49",
            "in[1]": "49",
            "in[2]": "49",
            "in[3]": "49",
        });
        assert(witness[circuit.signalName2Idx["main.out[0]"]].equals(snarkjs.bigInt(1)));
        assert(witness[circuit.signalName2Idx["main.out[1]"]].equals(snarkjs.bigInt(7)));
        assert(witness[circuit.signalName2Idx["main.out[2]"]].equals(snarkjs.bigInt(7)));
        assert(witness[circuit.signalName2Idx["main.out[3]"]].equals(snarkjs.bigInt(7)));
        assert(witness[circuit.signalName2Idx["main.out[4]"]].equals(snarkjs.bigInt(6)));
    });
});

describe("LinearMultiplier", () => {

    var linmult_4bit_2word;
    var linmult_64bit_8word;
    var linmult_64bit_32word;

    before(async () => {
        linmult_4bit_2word = await compiler(path.join(__dirname, "circuits", "linmult_4bit_2word.circom"));
        linmult_64bit_8word = await compiler(path.join(__dirname, "circuits", "linmult_64bit_8word.circom"));
        linmult_64bit_32word = await compiler(path.join(__dirname, "circuits", "linmult_64bit_32word.circom"));
    });

    it("should be compilable", async () => {
        new snarkjs.Circuit(linmult_4bit_2word);
    });

    it("should have <= 35 constraints (4 bits/word, 2 words)", async () => {
        // 2nw + 4n + w - 1
        //  = 24 + 8 + 4 - 1
        //  = 35
        const circuit = new snarkjs.Circuit(linmult_4bit_2word);
        circuit.nConstraints.should.be.at.most(35);
    });

    it("should compute 1 * 1 = 1 (4 bits/word, 2 words)", async () => {
        const circuit = new snarkjs.Circuit(linmult_4bit_2word);
        const witness = circuit.calculateWitness({
            "a[0]": "1",
            "a[1]": "0",
            "b[0]": "1",
            "b[1]": "0",
        });
        assert(witness[circuit.signalName2Idx["main.prod[0]"]].equals(snarkjs.bigInt(1)));
        assert(witness[circuit.signalName2Idx["main.prod[1]"]].equals(snarkjs.bigInt(0)));
        assert(witness[circuit.signalName2Idx["main.prod[2]"]].equals(snarkjs.bigInt(0)));
        assert(witness[circuit.signalName2Idx["main.prod[3]"]].equals(snarkjs.bigInt(0)));
    });

    it("should compute 1,0 * 1,0 = 1,0,0 (4 bits/word, 2 words)", async () => {
        const circuit = new snarkjs.Circuit(linmult_4bit_2word);
        const witness = circuit.calculateWitness({
            "a[0]": "0",
            "a[1]": "1",
            "b[0]": "0",
            "b[1]": "1",
        });
        assert(witness[circuit.signalName2Idx["main.prod[0]"]].equals(snarkjs.bigInt(0)));
        assert(witness[circuit.signalName2Idx["main.prod[1]"]].equals(snarkjs.bigInt(0)));
        assert(witness[circuit.signalName2Idx["main.prod[2]"]].equals(snarkjs.bigInt(1)));
        assert(witness[circuit.signalName2Idx["main.prod[3]"]].equals(snarkjs.bigInt(0)));
    });

    it("should compute 1,3 * 3,0 = 0,3,9,0 (4 bits/word, 2 words)", async () => {
        const circuit = new snarkjs.Circuit(linmult_4bit_2word);
        const witness = circuit.calculateWitness({
            "a[0]": "3",
            "a[1]": "1",
            "b[0]": "0",
            "b[1]": "3",
        });
        assert(witness[circuit.signalName2Idx["main.prod[0]"]].equals(snarkjs.bigInt(0)));
        assert(witness[circuit.signalName2Idx["main.prod[1]"]].equals(snarkjs.bigInt(9)));
        assert(witness[circuit.signalName2Idx["main.prod[2]"]].equals(snarkjs.bigInt(3)));
        assert(witness[circuit.signalName2Idx["main.prod[3]"]].equals(snarkjs.bigInt(0)));
    });

    it("should compute 3,0 * 1,3  = 0,3,9,0 (4 bits/word, 2 words)", async () => {
        const circuit = new snarkjs.Circuit(linmult_4bit_2word);
        const witness = circuit.calculateWitness({
            "a[0]": "0",
            "a[1]": "3",
            "b[0]": "3",
            "b[1]": "1",
        });
        assert(witness[circuit.signalName2Idx["main.prod[0]"]].equals(snarkjs.bigInt(0)));
        assert(witness[circuit.signalName2Idx["main.prod[1]"]].equals(snarkjs.bigInt(9)));
        assert(witness[circuit.signalName2Idx["main.prod[2]"]].equals(snarkjs.bigInt(3)));
        assert(witness[circuit.signalName2Idx["main.prod[3]"]].equals(snarkjs.bigInt(0)));
    });

    it("should compute 8,7 * 9,3  = 4,13,8,5 (4 bits/word, 2 words)", async () => {
        const circuit = new snarkjs.Circuit(linmult_4bit_2word);
        const witness = circuit.calculateWitness({
            "a[0]": "7",
            "a[1]": "8",
            "b[0]": "3",
            "b[1]": "9",
        });
        assert(witness[circuit.signalName2Idx["main.prod[0]"]].equals(snarkjs.bigInt(5)));
        assert(witness[circuit.signalName2Idx["main.prod[1]"]].equals(snarkjs.bigInt(8)));
        assert(witness[circuit.signalName2Idx["main.prod[2]"]].equals(snarkjs.bigInt(13)));
        assert(witness[circuit.signalName2Idx["main.prod[3]"]].equals(snarkjs.bigInt(4)));
    });

    it("should compute 9,3 * 8,7 = 4,13,8,5 (4 bits/word, 2 words)", async () => {
        const circuit = new snarkjs.Circuit(linmult_4bit_2word);
        const witness = circuit.calculateWitness({
            "a[0]": "3",
            "a[1]": "9",
            "b[0]": "7",
            "b[1]": "8",
        });
        assert(witness[circuit.signalName2Idx["main.prod[0]"]].equals(snarkjs.bigInt(5)));
        assert(witness[circuit.signalName2Idx["main.prod[1]"]].equals(snarkjs.bigInt(8)));
        assert(witness[circuit.signalName2Idx["main.prod[2]"]].equals(snarkjs.bigInt(13)));
        assert(witness[circuit.signalName2Idx["main.prod[3]"]].equals(snarkjs.bigInt(4)));
    });
    it("should compute 15,15 * 15,15 = 15,14,0,1 (4 bits/word, 2 words)", async () => {
        const circuit = new snarkjs.Circuit(linmult_4bit_2word);
        const witness = circuit.calculateWitness({
            "a[0]": "15",
            "a[1]": "15",
            "b[0]": "15",
            "b[1]": "15",
        });
        assert(witness[circuit.signalName2Idx["main.prod[0]"]].equals(snarkjs.bigInt(1)));
        assert(witness[circuit.signalName2Idx["main.prod[1]"]].equals(snarkjs.bigInt(0)));
        assert(witness[circuit.signalName2Idx["main.prod[2]"]].equals(snarkjs.bigInt(14)));
        assert(witness[circuit.signalName2Idx["main.prod[3]"]].equals(snarkjs.bigInt(15)));
    });

    it("should have <= 2123 constraints (64 bits/word, 8 words)", async () => {
        // 2nw + 4n + w - 1
        //  = 2048 + 32 + 64 - 1
        //  = 2123
        const circuit = new snarkjs.Circuit(linmult_64bit_8word);
        circuit.nConstraints.should.be.at.most(2123);
    });

    it("should have <= 8192 constraints (64 bits/word, 32 words)", async () => {
        const circuit = new snarkjs.Circuit(linmult_64bit_32word);
        circuit.nConstraints.should.be.at.most(9192);
    });
});

describe("Regroup", () => {

    var regroup_2_4_2;
    var constraints = (w, n, g) => (n / g + 1);
    before(async () => {
        regroup_2_4_2 = new snarkjs.Circuit(await compiler(path.join(__dirname, "circuits", "regroup_2_4_2.circom")));
    });

    it(`should have ${constraints(2, 4, 4)} = ${extractExpr(constraints)} constraints`, async () => {
        const bound = constraints(2, 4, 4);
        regroup_2_4_2.nConstraints.should.be.at.most(bound);
    });

    it("should group 0,0,0,0 -> 0,0 (w = 2)", async () => {
        const input = {
            "in[0]": "0",
            "in[1]": "0",
            "in[2]": "0",
            "in[3]": "0",
        };
        const witness = regroup_2_4_2.calculateWitness(input);
        assert(witness[regroup_2_4_2.signalName2Idx["main.out[0]"]].equals(snarkjs.bigInt(0)));
        assert(witness[regroup_2_4_2.signalName2Idx["main.out[1]"]].equals(snarkjs.bigInt(0)));
    });

    it("should group 0,0,0,15 -> 0,15 (w=2)", async () => {
        const input = {
            "in[0]": "15",
            "in[1]": "0",
            "in[2]": "0",
            "in[3]": "0",
        };
        const witness = regroup_2_4_2.calculateWitness(input);
        assert(witness[regroup_2_4_2.signalName2Idx["main.out[0]"]].equals(snarkjs.bigInt(15)));
        assert(witness[regroup_2_4_2.signalName2Idx["main.out[1]"]].equals(snarkjs.bigInt(0)));
    });
    it("should group 5,3,7,8 -> 23,36 (w=2)", async () => {
        const input = {
            "in[0]": "8",
            "in[1]": "7",
            "in[2]": "3",
            "in[3]": "5",
        };
        const witness = regroup_2_4_2.calculateWitness(input);
        assert(witness[regroup_2_4_2.signalName2Idx["main.out[0]"]].equals(snarkjs.bigInt(36)));
        assert(witness[regroup_2_4_2.signalName2Idx["main.out[1]"]].equals(snarkjs.bigInt(23)));
    });
});
