const bn128 = require("snarkjs").bn128;
const bigInt = require("snarkjs").bigInt;
const createBlakeHash = require("blake-hash");
const babyJub = require("../src/babyjub");

function getPoint(S) {
    const F = bn128.Fr;
    const h = createBlakeHash("blake256").update(S).digest();

    if (h.length != 32) {
        throw new Error("Invalid length")
    }

    let sign = false;
    if (h[31] & 0x80) {
        h[31] = h[31] & 0x7F;
        sign = true;
    }

    let y = bigInt(0);
    for (let i=0; i<32; i++) {
        y = y.shl(8);
        y = y.add(bigInt(h[i]));
    }

    const a = bigInt("168700");
    const d = bigInt("168696");

    const y2 = F.square(y);

    let x = F.sqrt(F.div(
        F.sub(F.one, y2),
        F.sub(a, F.mul(d, y2))));

    if (x == null) return null;

    if (sign) x = F.neg(x);

    const p = [bn128.Fr.affine(x), bn128.Fr.affine(y)];

    const p8 = babyJub.mulPointEscalar(p, 8);

    return p8;
}


function generatePoint(S) {
    let p= null;
    let idx = 0;
    while (p==null) {
        let sidx = "" + idx;
        while (sidx.length<16) sidx = "0"+sidx;
        p = getPoint(S+"_"+sidx);
        idx++;
    }
    if (!babyJub.inCurve(p)){
        throw new Error("Point not in curve");
    }
    return p;
}





const g = [
    bigInt("5299619240641551281634865583518297030282874472190772894086521144482721001553"),
    bigInt("16950150798460657717958625567821834550301663161624707787222815936182638968203")];

// Sanity check
if (!babyJub.inCurve(g)) {
    throw new Error("Generator not In curve -> Some thing goes wrong...");
}

for (let i=0; i<25; i++) {
    let S = "" +i;
    while (S.length<16) S = "0"+S;
    const P = generatePoint("Iden3_PedersenGenerator_"+S);
    console.log(`[${P[0].toString()}, ${P[1].toString()}]`);
}



