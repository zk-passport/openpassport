const mimcGenContract = require("./mimc_gencontract");

const SEED = "mimc";

let nRounds;
if (typeof process.argv[2] != "undefined") {
    nRounds = parseInt(process.argv[2]);
} else {
    nRounds = 91;
}

console.log(mimcGenContract.createCode(SEED, nRounds));

