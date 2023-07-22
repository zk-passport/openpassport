const bn128 = require("snarkjs").bn128;
const bigInt = require("snarkjs").bigInt;
const Web3Utils = require("web3-utils");
const F = bn128.Fr;

const SEED = "mimcsponge";
const NROUNDS = 220;

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
    cts[cts.length - 1] = bigInt(0);
    return cts;
};

const cts = exports.getConstants(SEED, NROUNDS);

exports.hash = (_xL_in, _xR_in, _k) =>{
    let xL = bigInt(_xL_in);
    let xR = bigInt(_xR_in);
    const k = bigInt(_k);
    for (let i=0; i<NROUNDS; i++) {
        const c = cts[i];
        const t = (i==0) ? F.add(xL, k) : F.add(F.add(xL, k), c);
        const xR_tmp = bigInt(xR);
        if (i < (NROUNDS - 1)) {
          xR = xL;
          xL = F.add(xR_tmp, F.exp(t, 5));
        } else {
          xR = F.add(xR_tmp, F.exp(t, 5));
        }
    }
    return {
      xL: F.affine(xL),
      xR: F.affine(xR),
    };
};

exports.multiHash = (arr, key, numOutputs) => {
    if (typeof(numOutputs) === "undefined") {
      numOutputs = 1;
    }
    if (typeof(key) === "undefined") {
        key = F.zero;
    }

    let R = F.zero;
    let C = F.zero;

    for (let i=0; i<arr.length; i++) {
      R = F.add(R, bigInt(arr[i]));
      const S = exports.hash(R, C, key);
      R = S.xL;
      C = S.xR;
    }
    let outputs = [R];
    for (let i=1; i < numOutputs; i++) {
      const S = exports.hash(R, C, key);
      R = S.xL;
      C = S.xR;
      outputs.push(R);
    }
    if (numOutputs == 1) {
      return F.affine(outputs[0]);
    } else {
      return outputs.map(x => F.affine(x));
    }
};
