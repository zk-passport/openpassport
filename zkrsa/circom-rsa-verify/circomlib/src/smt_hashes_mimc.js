const mimc7 = require("./mimc7");
const bigInt = require("big-integer");

exports.hash0 = function (left, right) {
    return mimc7.multiHash(left, right);
};

exports.hash1 = function(key, value) {
    return mimc7.multiHash([key, value], bigInt.one);
};

exports.F = mimc7.F;
