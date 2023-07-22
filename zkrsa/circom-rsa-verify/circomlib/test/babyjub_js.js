const chai = require("chai");
const babyjub = require("../src/babyjub.js");
const Scalar = require("ffjavascript").Scalar;

const assert = chai.assert;

// const bigInt = require("big-integer");

function buff2hex(buff) {
    function i2hex(i) {
      return ('0' + i.toString(16)).slice(-2);
    }
    return Array.from(buff).map(i2hex).join('');
}

describe("Baby Jub js test", function () {

    this.timeout(100000);

    it("Should add point (0,1) and (0,1)", () => {

        const p1 = [
            babyjub.F.e(0),
            babyjub.F.e(1)];
        const p2 = [
            babyjub.F.e(0),
            babyjub.F.e(1)
        ];

        const out = babyjub.addPoint(p1, p2);
        assert(babyjub.F.eq(out[0], babyjub.F.zero));
        assert(babyjub.F.eq(out[1], babyjub.F.one));
    });

    it("Should base be 8*generator", () => {
        let res;
        res = babyjub.addPoint(babyjub.Generator, babyjub.Generator);
        res = babyjub.addPoint(res, res);
        res = babyjub.addPoint(res, res);

        assert(babyjub.F.eq(res[0], babyjub.Base8[0]));
        assert(babyjub.F.eq(res[1], babyjub.Base8[1]));
    });

    it("Should add 2 same numbers", () => {

        const p1 = [
            babyjub.F.e("17777552123799933955779906779655732241715742912184938656739573121738514868268"),
            babyjub.F.e("2626589144620713026669568689430873010625803728049924121243784502389097019475"),
        ];
        const p2 = [
            babyjub.F.e("17777552123799933955779906779655732241715742912184938656739573121738514868268"),
            babyjub.F.e("2626589144620713026669568689430873010625803728049924121243784502389097019475"),
        ];

        const out = babyjub.addPoint(p1, p2);
        assert(babyjub.F.eq(out[0], babyjub.F.e("6890855772600357754907169075114257697580319025794532037257385534741338397365")));
        assert(babyjub.F.eq(out[1], babyjub.F.e("4338620300185947561074059802482547481416142213883829469920100239455078257889")));
    });

    it("Should add 2 different numbers", () => {

        const p1 = [
            babyjub.F.e("17777552123799933955779906779655732241715742912184938656739573121738514868268"),
            babyjub.F.e("2626589144620713026669568689430873010625803728049924121243784502389097019475"),
        ];
        const p2 = [
            babyjub.F.e("16540640123574156134436876038791482806971768689494387082833631921987005038935"),
            babyjub.F.e("20819045374670962167435360035096875258406992893633759881276124905556507972311"),
        ];

        const out = babyjub.addPoint(p1, p2);
        assert(babyjub.F.eq(out[0], babyjub.F.e("7916061937171219682591368294088513039687205273691143098332585753343424131937")));
        assert(babyjub.F.eq(out[1], babyjub.F.e("14035240266687799601661095864649209771790948434046947201833777492504781204499")));

    });

    it("should mulPointEscalar 0", () => {
        const p = [
            babyjub.F.e("17777552123799933955779906779655732241715742912184938656739573121738514868268"),
            babyjub.F.e("2626589144620713026669568689430873010625803728049924121243784502389097019475"),
        ];

        const r = babyjub.mulPointEscalar(p, 3);
        let r2 = babyjub.addPoint(p, p);
        r2 = babyjub.addPoint(r2, p);
        assert.equal(r2[0].toString(), r[0].toString());
        assert.equal(r2[1].toString(), r[1].toString());
        assert.equal(r[0].toString(), "19372461775513343691590086534037741906533799473648040012278229434133483800898");
        assert.equal(r[1].toString(), "9458658722007214007257525444427903161243386465067105737478306991484593958249");
    });

    it("should mulPointEscalar 1", () => {
        const p = [
            babyjub.F.e("17777552123799933955779906779655732241715742912184938656739573121738514868268"),
            babyjub.F.e("2626589144620713026669568689430873010625803728049924121243784502389097019475"),
        ];

        const r = babyjub.mulPointEscalar(p, Scalar.fromString("14035240266687799601661095864649209771790948434046947201833777492504781204499"));
        assert.equal(r[0].toString(), "17070357974431721403481313912716834497662307308519659060910483826664480189605");
        assert.equal(r[1].toString(), "4014745322800118607127020275658861516666525056516280575712425373174125159339");
    });

    it("should mulPointEscalar 2", () => {
        const p = [
            babyjub.F.e("6890855772600357754907169075114257697580319025794532037257385534741338397365"),
            babyjub.F.e("4338620300185947561074059802482547481416142213883829469920100239455078257889"),
        ];

        const r = babyjub.mulPointEscalar(p, Scalar.fromString("20819045374670962167435360035096875258406992893633759881276124905556507972311"));
        assert.equal(r[0].toString(), "13563888653650925984868671744672725781658357821216877865297235725727006259983");
        assert.equal(r[1].toString(), "8442587202676550862664528699803615547505326611544120184665036919364004251662");
    });

    it("should inCurve 1", () => {
        const p = [
            babyjub.F.e("17777552123799933955779906779655732241715742912184938656739573121738514868268"),
            babyjub.F.e("2626589144620713026669568689430873010625803728049924121243784502389097019475"),
        ];
        assert(babyjub.inCurve(p));
    });

    it("should inCurve 2", () => {
        const p = [
            babyjub.F.e("6890855772600357754907169075114257697580319025794532037257385534741338397365"),
            babyjub.F.e("4338620300185947561074059802482547481416142213883829469920100239455078257889"),
        ];
        assert(babyjub.inCurve(p));
    });

    it("should inSubgroup 1", () => {
        const p = [
            babyjub.F.e("17777552123799933955779906779655732241715742912184938656739573121738514868268"),
            babyjub.F.e("2626589144620713026669568689430873010625803728049924121243784502389097019475"),
        ];
        assert(babyjub.inSubgroup(p));
    });

    it("should inSubgroup 2", () => {
        const p = [
            babyjub.F.e("6890855772600357754907169075114257697580319025794532037257385534741338397365"),
            babyjub.F.e("4338620300185947561074059802482547481416142213883829469920100239455078257889"),
        ];
        assert(babyjub.inSubgroup(p));
    });

    it("should packPoint - unpackPoint 1", () => {
        const p = [
            babyjub.F.e("17777552123799933955779906779655732241715742912184938656739573121738514868268"),
            babyjub.F.e("2626589144620713026669568689430873010625803728049924121243784502389097019475"),
        ];
        const buf = babyjub.packPoint(p);
        assert.equal(buff2hex(buf), "53b81ed5bffe9545b54016234682e7b2f699bd42a5e9eae27ff4051bc698ce85");
        const p2 = babyjub.unpackPoint(buf);
        assert.equal(p2[0].toString(), "17777552123799933955779906779655732241715742912184938656739573121738514868268");
        assert.equal(p2[1].toString(), "2626589144620713026669568689430873010625803728049924121243784502389097019475");
    });

    it("should packPoint - unpackPoint 2", () => {
        const p = [
            babyjub.F.e("6890855772600357754907169075114257697580319025794532037257385534741338397365"),
            babyjub.F.e("4338620300185947561074059802482547481416142213883829469920100239455078257889"),
        ];
        const buf = babyjub.packPoint(p);
        assert.equal(buff2hex(buf), "e114eb17eddf794f063a68fecac515e3620e131976108555735c8b0773929709");
        const p2 = babyjub.unpackPoint(buf);
        assert.equal(p2[0].toString(), "6890855772600357754907169075114257697580319025794532037257385534741338397365");
        assert.equal(p2[1].toString(), "4338620300185947561074059802482547481416142213883829469920100239455078257889");
    });
});
