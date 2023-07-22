const babyJub = require("./babyjub");
const createBlakeHash = require("blake-hash");
const blake2b = require("blake2b");
const Scalar = require("ffjavascript").Scalar;

const GENPOINT_PREFIX = "PedersenGenerator";
const windowSize = 4;
const nWindowsPerSegment = 50;

exports.hash = pedersenHash;
exports.getBasePoint = getBasePoint;

function baseHash(type, S) {
    if (type == "blake") {
        return createBlakeHash("blake256").update(S).digest();
    } else if (type == "blake2b") {
        return Buffer.from(blake2b(32).update(Buffer.from(S)).digest());
    }
}

function pedersenHash(msg, options) {
    options = options || {};
    options.baseHash = options.baseHash || "blake";
    const bitsPerSegment = windowSize*nWindowsPerSegment;
    const bits = buffer2bits(msg);

    const nSegments = Math.floor((bits.length - 1)/(windowSize*nWindowsPerSegment)) +1;

    let accP = [babyJub.F.zero,babyJub.F.one];

    for (let s=0; s<nSegments; s++) {
        let nWindows;
        if (s == nSegments-1) {
            nWindows = Math.floor(((bits.length - (nSegments - 1)*bitsPerSegment) - 1) / windowSize) +1;
        } else {
            nWindows = nWindowsPerSegment;
        }
        let escalar = Scalar.e(0);
        let exp = Scalar.e(1);
        for (let w=0; w<nWindows; w++) {
            let o = s*bitsPerSegment + w*windowSize;
            let acc = Scalar.e(1);
            for (let b=0; ((b<windowSize-1)&&(o<bits.length)) ; b++) {
                if (bits[o]) {
                    acc = Scalar.add(acc, Scalar.shl(Scalar.e(1), b) );
                }
                o++;
            }
            if (o<bits.length) {
                if (bits[o]) {
                    acc = Scalar.neg(acc);
                }
                o++;
            }
            escalar = Scalar.add(escalar, Scalar.mul(acc, exp));
            exp = Scalar.shl(exp, windowSize+1);
        }

        if (Scalar.lt(escalar, 0)) {
            escalar = Scalar.add( escalar, babyJub.subOrder);
        }

        accP = babyJub.addPoint(accP, babyJub.mulPointEscalar(getBasePoint(options.baseHash, s), escalar));
    }

    return babyJub.packPoint(accP);
}

let bases = [];

function getBasePoint(baseHashType, pointIdx) {
    if (pointIdx<bases.length) return bases[pointIdx];
    let p= null;
    let tryIdx = 0;
    while (p==null) {
        const S = GENPOINT_PREFIX + "_" + padLeftZeros(pointIdx, 32) + "_" + padLeftZeros(tryIdx, 32);
        const h = baseHash(baseHashType, S);
        h[31] = h[31] & 0xBF;  // Set 255th bit to 0 (256th is the signal and 254th is the last possible bit to 1)
        p = babyJub.unpackPoint(h);
        tryIdx++;
    }

    const p8 = babyJub.mulPointEscalar(p, 8);

    if (!babyJub.inSubgroup(p8)) {
        throw new Error("Point not in curve");
    }

    bases[pointIdx] = p8;
    return p8;
}

function padLeftZeros(idx, n) {
    let sidx = "" + idx;
    while (sidx.length<n) sidx = "0"+sidx;
    return sidx;
}

/*
Input a buffer
Returns an array of booleans. 0 is LSB of first byte and so on.
 */
function buffer2bits(buff) {
    const res = new Array(buff.length*8);
    for (let i=0; i<buff.length; i++) {
        const b = buff[i];
        res[i*8] = b & 0x01;
        res[i*8+1] = b & 0x02;
        res[i*8+2] = b & 0x04;
        res[i*8+3] = b & 0x08;
        res[i*8+4] = b & 0x10;
        res[i*8+5] = b & 0x20;
        res[i*8+6] = b & 0x40;
        res[i*8+7] = b & 0x80;
    }
    return res;
}




