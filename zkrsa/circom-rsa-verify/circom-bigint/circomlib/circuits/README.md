* compconstant - Returns 1 if `in` (expanded to binary array) > `ct`
* aliascheck - check if `in` (expanded to binary array) oveflowed its 254 bits (<= -1)
* babyjub - twisted Edwards curve 168700.x^2 + y^2 = 1 + 168696.x^2.y^2
  * BabyAdd - (`xout`,`yout`) = (`x1`,`y1`) + (`x2`,`y2`)
  * BabyDbl - (`xout`,`yout`) = 2*(`x`,`y`)
  * BabyCheck - check that (`x`,`y`) is on the curve
* binsub - binary subtraction
* gates - logical gates
* mimc - SNARK-friendly hash Minimal Multiplicative Complexity.
  * https://eprint.iacr.org/2016/492.pdf
  * zcash/zcash#2233
* smt - Sparse Merkle Tree
  * https://ethresear.ch/t/optimizing-sparse-merkle-trees/3751
* montgomery https://en.wikipedia.org/wiki/Montgomery_curve