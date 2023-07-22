const Scalar = require("ffjavascript").Scalar;
const ZqField = require("ffjavascript").ZqField;

const Web3Utils = require("web3-utils");
const F = new ZqField(Scalar.fromString("21888242871839275222246405745257275088548364400416034343698204186575808495617"));
exports.F = F;

const SEED = "mimc";
const NROUNDS = 91;

exports.getIV = (seed) => {
    if (typeof seed === "undefined") seed = SEED;
    const c = Web3Utils.keccak256(seed+"_iv");
    const cn = Scalar.FromString(Web3Utils.toBN(c).toString());
    const iv = cn.mod(F.p);
    return iv;
};

exports.getConstants = (seed, nRounds) => {
    if (typeof seed === "undefined") seed = SEED;
    if (typeof nRounds === "undefined") nRounds = NROUNDS;
    const cts = new Array(nRounds);
    let c = Web3Utils.keccak256(SEED);
    for (let i=1; i<nRounds; i++) {
        c = Web3Utils.keccak256(c);

        const n1 = Web3Utils.toBN(c).mod(Web3Utils.toBN(F.p.toString()));
        const c2 = Web3Utils.padLeft(Web3Utils.toHex(n1), 64);
        cts[i] = Scalar.fromString(Web3Utils.toBN(c2).toString());
    }
    cts[0] = F.e(0);
    return cts;
};

const cts = exports.getConstants(SEED, 91);

exports.hash =  (_x_in, _k) =>{
    const x_in = F.e(_x_in);
    const k = F.e(_k);
    let r;
    for (let i=0; i<NROUNDS; i++) {
        const c = cts[i];
        const t = (i==0) ? F.add(x_in, k) : F.add(F.add(r, k), c);
        r = F.pow(t, 7);
    }
    return F.add(r, k);
};

exports.multiHash = (arr, key) => {
    let r;
    if (typeof(key) === "undefined") {
        r = F.zero;
    } else {
        r = key;
    }
    for (let i=0; i<arr.length; i++) {
        r = F.add(
            F.add(
                r,
                arr[i]
            ),
            exports.hash(F.e(arr[i]), r)
        );
    }
    return r;
};
