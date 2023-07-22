const mimcsponge = require("./mimcsponge.js");

const nRounds = 220;
let S = "[\n";
const cts = mimcsponge.getConstants();
for (let i=0; i<nRounds; i++) {
    S = S + cts[i].toString();
    if (i<nRounds-1) S = S + ",";
    S=S+"\n";
}
S = S + "]\n";

console.log(S);
