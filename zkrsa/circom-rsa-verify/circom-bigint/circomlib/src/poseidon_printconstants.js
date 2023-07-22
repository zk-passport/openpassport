

const Poseidon = require("./poseidon.js");

const C = Poseidon.getConstants();

let S = "[\n";

for (let i=0; i<C.length; i++) {
    S = S + "    " + C[i].toString();
    if (i<C.length-1) S = S + ",";
    S = S + "\n";
}
S=S+ "]\n";

console.log(S);
