const poseidonGenContract = require("./poseidon_gencontract");

if (process.argv.length != 3) {
    console.log("Usage: node poseidon_gencontract.js [numberOfInputs]");
    process.exit(1);
}

const nInputs = Number(process.argv[2]);

console.log(nInputs);

console.log(poseidonGenContract.createCode(nInputs));

