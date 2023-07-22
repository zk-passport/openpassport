const bn128 = require("snarkjs").bn128;
const bigInt = require("snarkjs").bigInt;
const Web3Utils = require("web3-utils");
const F = bn128.Fr;

const SEED = "mimc";
const NROUNDS = 91;

exports.getIV = (seed) => {
    if (typeof seed === "undefined") seed = SEED;
    const c = Web3Utils.keccak256(seed+"_iv");
    const cn = bigInt(Web3Utils.toBN(c).toString());
    const iv = cn.mod(F.q);
    return iv;
};

exports.getConstants = (seed, nRounds) => {
    if (typeof seed === "undefined") seed = SEED;
    if (typeof nRounds === "undefined") nRounds = NROUNDS;
    const cts = new Array(nRounds);
    let c = Web3Utils.keccak256(SEED);
    for (let i=1; i<nRounds; i++) {
        c = Web3Utils.keccak256(c);

        const n1 = Web3Utils.toBN(c).mod(Web3Utils.toBN(F.q.toString()));
        const c2 = Web3Utils.padLeft(Web3Utils.toHex(n1), 64);
        cts[i] = bigInt(Web3Utils.toBN(c2).toString());
    }
    cts[0] = bigInt(0);
    return cts;
};

const cts = exports.getConstants(SEED, 91);

exports.hash =  (_x_in, _k) =>{
    const x_in = bigInt(_x_in);
    const k = bigInt(_k);
    let r;
    for (let i=0; i<NROUNDS; i++) {
        const c = cts[i];
        const t = (i==0) ? F.add(x_in, k) : F.add(F.add(r, k), c);
        r = F.exp(t, 7);
    }
    return F.affine(F.add(r, k));
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
            exports.hash(bigInt(arr[i]), r)
        );
    }
    return F.affine(r);
};
