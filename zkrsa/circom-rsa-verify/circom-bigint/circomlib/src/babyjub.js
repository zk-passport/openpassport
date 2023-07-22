const bn128 = require("snarkjs").bn128;
const bigInt = require("snarkjs").bigInt;

exports.addPoint = addPoint;
exports.mulPointEscalar = mulPointEscalar;
exports.inCurve = inCurve;
exports.inSubgroup = inSubgroup;
exports.packPoint = packPoint;
exports.unpackPoint = unpackPoint;
exports.Generator = [
    bigInt("995203441582195749578291179787384436505546430278305826713579947235728471134"),
    bigInt("5472060717959818805561601436314318772137091100104008585924551046643952123905")
];
exports.Base8 = [
    bigInt("5299619240641551281634865583518297030282874472190772894086521144482721001553"),
    bigInt("16950150798460657717958625567821834550301663161624707787222815936182638968203")
];
exports.order = bigInt("21888242871839275222246405745257275088614511777268538073601725287587578984328");
exports.subOrder = exports.order.shr(3);
exports.p = bn128.r;
exports.A = bigInt("168700");
exports.D = bigInt("168696");


function addPoint(a,b) {
    const q = bn128.r;

    const res = [];

    /* does the equivalent of:
     res[0] = bigInt((a[0]*b[1] + b[0]*a[1]) *  bigInt(bigInt("1") + d*a[0]*b[0]*a[1]*b[1]).inverse(q)).affine(q);
    res[1] = bigInt((a[1]*b[1] - cta*a[0]*b[0]) * bigInt(bigInt("1") - d*a[0]*b[0]*a[1]*b[1]).inverse(q)).affine(q);
    */
    res[0] = bigInt((bigInt(a[0]).mul(b[1]).add(bigInt(b[0]).mul(a[1]))).mul(bigInt(bigInt("1").add(exports.D.mul(a[0]).mul(b[0]).mul(a[1]).mul(b[1]))).inverse(q))).affine(q);
    res[1] = bigInt((bigInt(a[1]).mul(b[1]).sub(exports.A.mul(a[0]).mul(b[0]))).mul(bigInt(bigInt("1").sub(exports.D.mul(a[0]).mul(b[0]).mul(a[1]).mul(b[1]))).inverse(q))).affine(q);

    return res;
}

function mulPointEscalar(base, e) {
    let res = [bigInt("0"),bigInt("1")];
    let rem = bigInt(e);
    let exp = base;

    while (! rem.isZero()) {
        if (rem.isOdd()) {
            res = addPoint(res, exp);
        }
        exp = addPoint(exp, exp);
        rem = rem.shr(1);
    }

    return res;
}

function inSubgroup(P) {
    if (!inCurve(P)) return false;
    const res= mulPointEscalar(P, exports.subOrder);
    return (res[0].equals(bigInt(0))) && (res[1].equals(bigInt(1)));
}

function inCurve(P) {
    const F = bn128.Fr;

    const x2 = F.square(P[0]);
    const y2 = F.square(P[1]);

    if (!F.equals(
        F.add(F.mul(exports.A, x2), y2),
        F.add(F.one, F.mul(F.mul(x2, y2), exports.D)))) return false;

    return true;
}

function packPoint(P) {
    const buff = bigInt.leInt2Buff(P[1], 32);
    if (P[0].greater(exports.p.shr(1))) {
        buff[31] = buff[31] | 0x80;
    }
    return buff;
}

function unpackPoint(_buff) {
    const F = bn128.Fr;

    const buff = Buffer.from(_buff);
    let sign = false;
    const P = new Array(2);
    if (buff[31] & 0x80) {
        sign = true;
        buff[31] = buff[31] & 0x7F;
    }
    P[1] = bigInt.leBuff2int(buff);
    if (P[1].greaterOrEquals(exports.p)) return null;

    const y2 = F.square(P[1]);

    let x = F.sqrt(F.div(
        F.sub(F.one, y2),
        F.sub(exports.A, F.mul(exports.D, y2))));

    if (x == null) return null;

    if (sign) x = F.neg(x);

    P[0] = F.affine(x);

    return P;
}
