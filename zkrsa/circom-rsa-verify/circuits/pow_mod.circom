include "../circom-bigint/circomlib/circuits/bitify.circom"
include "../circom-bigint/circuits/mult.circom"
// w = 32
// base ** exp mod modulus
// nb is the length of the input number
// exp = 65537
template PowerModv2(w, nb, e_bits) {
    signal input base[nb];
    signal input exp[nb];
    signal input modulus[nb];

    signal output out[nb];
    
   
    component muls[e_bits + 2];
    for (var i = 0; i < e_bits + 2; i++) {
        muls[i] = MultiplierReducer(w, nb);
        // modulus params
        for (var j = 0; j < nb; j++) {
            muls[i].modulus[j] <== modulus[j];
        }
    }

    // result/base muls component index
    var result_index=0;
    var base_index=0;
    var muls_index=0;
    for (var i = 0; i< e_bits; i++) {
        if (i == 0 || i == e_bits - 1) {
           if (i == 0) {
               for(var j = 0; j < nb; j ++) {
                    if (j == 0) {
                        muls[muls_index].a[j] <== 1;
                    } else {
                        muls[muls_index].a[j] <== 0;
                    }
                    muls[muls_index].b[j] <== base[j];
               }
           } else {
               for(var j = 0; j < nb; j++) {
                   muls[muls_index].a[j] <== muls[result_index].prod[j];
                   muls[muls_index].b[j] <== muls[base_index].prod[j];
               }
           }
            result_index = muls_index;
            muls_index++;
        }

        if (base_index == 0) {
             for (var j = 0; j < nb; j++) {
                 muls[muls_index].a[j] <== base[j];
                 muls[muls_index].b[j] <== base[j];
             }
        } else {
             for (var j = 0; j < nb; j++) {
                 muls[muls_index].a[j] <== muls[base_index].prod[j];
                 muls[muls_index].b[j] <== muls[base_index].prod[j];
             }
        }
        base_index = muls_index;
        muls_index++;
    }

    for (var i = 0; i < nb; i++) {
        out[i] <== muls[result_index].prod[i];
    }
}


