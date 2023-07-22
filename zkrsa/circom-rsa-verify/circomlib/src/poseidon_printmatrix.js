

const Poseidon = require("./poseidon.js");

const M = Poseidon.getMatrix();

let S = "[\n    ";

for (let i=0; i<M.length; i++) {
    const LC = M[i];
    S = S + "[\n";
    for (let j=0; j<LC.length; j++) {
        S = S + "        " + M[i][j].toString();
        if (j<LC.length-1) S = S + ",";
        S = S + "\n";
    }
    S = S + "    ]";
    if (i<M.length-1) S = S + ",";
}
S=S+ "\n]\n";

console.log(S);
