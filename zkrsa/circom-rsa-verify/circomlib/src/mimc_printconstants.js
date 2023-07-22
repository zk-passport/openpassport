const mimc7 = require("./mimc7.js");

const nRounds = 91;
let S = "[\n";
const cts = mimc7.getConstants();
for (let i=0; i<nRounds; i++) {
    S = S + cts[i].toString();
    if (i<nRounds-1) S = S + ",";
    S=S+"\n";
}
S = S + "]\n";

console.log(S);
