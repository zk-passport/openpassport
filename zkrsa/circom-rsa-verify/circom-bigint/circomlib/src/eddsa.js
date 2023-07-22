const createBlakeHash = require("blake-hash");
const bigInt = require("snarkjs").bigInt;
const babyJub = require("./babyjub");
const pedersenHash = require("./pedersenHash").hash;
const mimc7 = require("./mimc7");
const poseidon = require("./poseidon.js");
const mimcsponge = require("./mimcsponge");

exports.prv2pub= prv2pub;
exports.sign = sign;
exports.signMiMC = signMiMC;
exports.signPoseidon = signPoseidon;
exports.signMiMCSponge = signMiMCSponge;
exports.verify = verify;
exports.verifyMiMC = verifyMiMC;
exports.verifyPoseidon = verifyPoseidon;
exports.verifyMiMCSponge = verifyMiMCSponge;
exports.packSignature = packSignature;
exports.unpackSignature = unpackSignature;
exports.pruneBuffer = pruneBuffer;


function pruneBuffer(_buff) {
    const buff = Buffer.from(_buff);
    buff[0] = buff[0] & 0xF8;
    buff[31] = buff[31] & 0x7F;
    buff[31] = buff[31] | 0x40;
    return buff;
}

function prv2pub(prv) {
    const sBuff = pruneBuffer(createBlakeHash("blake512").update(prv).digest().slice(0,32));
    let s = bigInt.leBuff2int(sBuff);
    const A = babyJub.mulPointEscalar(babyJub.Base8, s.shr(3));
    return A;
}

function sign(prv, msg) {
    const h1 = createBlakeHash("blake512").update(prv).digest();
    const sBuff = pruneBuffer(h1.slice(0,32));
    const s = bigInt.leBuff2int(sBuff);
    const A = babyJub.mulPointEscalar(babyJub.Base8, s.shr(3));

    const rBuff = createBlakeHash("blake512").update(Buffer.concat([h1.slice(32,64), msg])).digest();
    let r = bigInt.leBuff2int(rBuff);
    r = r.mod(babyJub.subOrder);
    const R8 = babyJub.mulPointEscalar(babyJub.Base8, r);
    const R8p = babyJub.packPoint(R8);
    const Ap = babyJub.packPoint(A);
    const hmBuff = pedersenHash(Buffer.concat([R8p, Ap, msg]));
    const hm = bigInt.leBuff2int(hmBuff);
    const S = r.add(hm.mul(s)).mod(babyJub.subOrder);
    return {
        R8: R8,
        S: S
    };
}

function signMiMC(prv, msg) {
    const h1 = createBlakeHash("blake512").update(prv).digest();
    const sBuff = pruneBuffer(h1.slice(0,32));
    const s = bigInt.leBuff2int(sBuff);
    const A = babyJub.mulPointEscalar(babyJub.Base8, s.shr(3));

    const msgBuff = bigInt.leInt2Buff(msg, 32);
    const rBuff = createBlakeHash("blake512").update(Buffer.concat([h1.slice(32,64), msgBuff])).digest();
    let r = bigInt.leBuff2int(rBuff);
    r = r.mod(babyJub.subOrder);
    const R8 = babyJub.mulPointEscalar(babyJub.Base8, r);
    const hm = mimc7.multiHash([R8[0], R8[1], A[0], A[1], msg]);
    const S = r.add(hm.mul(s)).mod(babyJub.subOrder);
    return {
        R8: R8,
        S: S
    };
}

function signMiMCSponge(prv, msg) {
    const h1 = createBlakeHash("blake512").update(prv).digest();
    const sBuff = pruneBuffer(h1.slice(0,32));
    const s = bigInt.leBuff2int(sBuff);
    const A = babyJub.mulPointEscalar(babyJub.Base8, s.shr(3));

    const msgBuff = bigInt.leInt2Buff(msg, 32);
    const rBuff = createBlakeHash("blake512").update(Buffer.concat([h1.slice(32,64), msgBuff])).digest();
    let r = bigInt.leBuff2int(rBuff);
    r = r.mod(babyJub.subOrder);
    const R8 = babyJub.mulPointEscalar(babyJub.Base8, r);
    const hm = mimcsponge.multiHash([R8[0], R8[1], A[0], A[1], msg]);
    const S = r.add(hm.mul(s)).mod(babyJub.subOrder);
    return {
        R8: R8,
        S: S
    };
}

function signPoseidon(prv, msg) {
    const h1 = createBlakeHash("blake512").update(prv).digest();
    const sBuff = pruneBuffer(h1.slice(0,32));
    const s = bigInt.leBuff2int(sBuff);
    const A = babyJub.mulPointEscalar(babyJub.Base8, s.shr(3));

    const msgBuff = bigInt.leInt2Buff(msg, 32);
    const rBuff = createBlakeHash("blake512").update(Buffer.concat([h1.slice(32,64), msgBuff])).digest();
    let r = bigInt.leBuff2int(rBuff);
    r = r.mod(babyJub.subOrder);
    const R8 = babyJub.mulPointEscalar(babyJub.Base8, r);
    const hash = poseidon.createHash(6, 8, 57);
    const hm = hash([R8[0], R8[1], A[0], A[1], msg]);
    const S = r.add(hm.mul(s)).mod(babyJub.subOrder);
    return {
        R8: R8,
        S: S
    };
}

function verify(msg, sig, A) {
    // Check parameters
    if (typeof sig != "object") return false;
    if (!Array.isArray(sig.R8)) return false;
    if (sig.R8.length!= 2) return false;
    if (!babyJub.inCurve(sig.R8)) return false;
    if (!Array.isArray(A)) return false;
    if (A.length!= 2) return false;
    if (!babyJub.inCurve(A)) return false;
    if (sig.S>= babyJub.subOrder) return false;

    const R8p = babyJub.packPoint(sig.R8);
    const Ap = babyJub.packPoint(A);
    const hmBuff = pedersenHash(Buffer.concat([R8p, Ap, msg]));
    const hm = bigInt.leBuff2int(hmBuff);

    const Pleft = babyJub.mulPointEscalar(babyJub.Base8, sig.S);
    let Pright = babyJub.mulPointEscalar(A, hm.mul(bigInt("8")));
    Pright = babyJub.addPoint(sig.R8, Pright);

    if (!Pleft[0].equals(Pright[0])) return false;
    if (!Pleft[1].equals(Pright[1])) return false;
    return true;
}

function verifyMiMC(msg, sig, A) {
    // Check parameters
    if (typeof sig != "object") return false;
    if (!Array.isArray(sig.R8)) return false;
    if (sig.R8.length!= 2) return false;
    if (!babyJub.inCurve(sig.R8)) return false;
    if (!Array.isArray(A)) return false;
    if (A.length!= 2) return false;
    if (!babyJub.inCurve(A)) return false;
    if (sig.S>= babyJub.subOrder) return false;

    const hm = mimc7.multiHash([sig.R8[0], sig.R8[1], A[0], A[1], msg]);

    const Pleft = babyJub.mulPointEscalar(babyJub.Base8, sig.S);
    let Pright = babyJub.mulPointEscalar(A, hm.mul(bigInt("8")));
    Pright = babyJub.addPoint(sig.R8, Pright);

    if (!Pleft[0].equals(Pright[0])) return false;
    if (!Pleft[1].equals(Pright[1])) return false;
    return true;
}


function verifyPoseidon(msg, sig, A) {
    // Check parameters
    if (typeof sig != "object") return false;
    if (!Array.isArray(sig.R8)) return false;
    if (sig.R8.length!= 2) return false;
    if (!babyJub.inCurve(sig.R8)) return false;
    if (!Array.isArray(A)) return false;
    if (A.length!= 2) return false;
    if (!babyJub.inCurve(A)) return false;
    if (sig.S>= babyJub.subOrder) return false;

    const hash = poseidon.createHash(6, 8, 57);
    const hm = hash([sig.R8[0], sig.R8[1], A[0], A[1], msg]);

    const Pleft = babyJub.mulPointEscalar(babyJub.Base8, sig.S);
    let Pright = babyJub.mulPointEscalar(A, hm.mul(bigInt("8")));
    Pright = babyJub.addPoint(sig.R8, Pright);

    if (!Pleft[0].equals(Pright[0])) return false;
    if (!Pleft[1].equals(Pright[1])) return false;
    return true;
}

function verifyMiMCSponge(msg, sig, A) {
    // Check parameters
    if (typeof sig != "object") return false;
    if (!Array.isArray(sig.R8)) return false;
    if (sig.R8.length!= 2) return false;
    if (!babyJub.inCurve(sig.R8)) return false;
    if (!Array.isArray(A)) return false;
    if (A.length!= 2) return false;
    if (!babyJub.inCurve(A)) return false;
    if (sig.S>= babyJub.subOrder) return false;

    const hm = mimcsponge.multiHash([sig.R8[0], sig.R8[1], A[0], A[1], msg]);

    const Pleft = babyJub.mulPointEscalar(babyJub.Base8, sig.S);
    let Pright = babyJub.mulPointEscalar(A, hm.mul(bigInt("8")));
    Pright = babyJub.addPoint(sig.R8, Pright);

    if (!Pleft[0].equals(Pright[0])) return false;
    if (!Pleft[1].equals(Pright[1])) return false;
    return true;
}

function packSignature(sig) {
    const R8p = babyJub.packPoint(sig.R8);
    const Sp = bigInt.leInt2Buff(sig.S, 32);
    return Buffer.concat([R8p, Sp]);
}

function unpackSignature(sigBuff) {
    return {
        R8: babyJub.unpackPoint(sigBuff.slice(0,32)),
        S: bigInt.leBuff2int(sigBuff.slice(32,64))
    };
}


