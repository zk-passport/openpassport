const Poseidon = require("./poseidon");
const bigInt = require("snarkjs").bigInt;

const hash = Poseidon.createHash(6, 8, 57);

exports.hash0 = function (left, right) {
    return hash([left, right]);
};

exports.hash1 = function(key, value) {
    return hash([key, value, bigInt.one]);
};
