const pedersenHash = require("./pedersenHash.js");

let nBases;
if (typeof process.argv[2] != "undefined") {
    nBases = parseInt(process.argv[2]);
} else {
    nBases = 5;
}

let baseHash;
if (typeof process.argv[3] != "undefined") {
    baseHash = process.argv[3];
} else {
    baseHash = "blake";
}


for (let i=0; i < nBases; i++) {
    const p = pedersenHash.getBasePoint(baseHash, i);
    console.log(`[${p[0]},${p[1]}]`);
}
