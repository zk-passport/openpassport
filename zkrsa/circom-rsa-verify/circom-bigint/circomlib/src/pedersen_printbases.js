const pedersenHash = require("./pedersenHash.js");

let nBases;
if (typeof process.argv[2] != "undefined") {
    nBases = parseInt(process.argv[2]);
} else {
    nBases = 5;
}

for (let i=0; i < nBases; i++) {
    const p = pedersenHash.getBasePoint(i);
    console.log(`[${p[0]},${p[1]}]`);
}
