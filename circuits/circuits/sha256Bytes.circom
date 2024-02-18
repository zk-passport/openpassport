pragma circom 2.1.5;

include "circomlib/circuits/bitify.circom";
include "circomlib/circuits/sha256/sha256.circom";

/***
*
*  This template takes as input a list of bytes and as parameters the size of this list
*  The template output the sha256 of all bits concatened of the bytes list
*
***/


template Sha256Bytes(max_num_bytes) {
    // in_padded: input signal of bytes of length "max_num_bytes"
    signal input in_padded[max_num_bytes];

    // out: output hash of the circuit
    signal output out[256];

    // num_bits: num of bits in max_num_bytes
    var num_bits = max_num_bytes * 8;

    // sha: component used to hash all bits from input signal
    component sha = Sha256(num_bits);

    // bytes: list of component used to convert bytes from input signal to bits
    component bytes[max_num_bytes];

    // for each bytes iterate and set bytes from input signal inside the component
    for (var i = 0; i < max_num_bytes; i++) {
        bytes[i] = Num2Bits(8);
        bytes[i].in <== in_padded[i];

        // for each bits int bytes iterate again and set the bits from each bytes from reverse order inside sha256 component
        for (var j = 0; j < 8; j++) {
            sha.in[i*8+j] <== bytes[i].out[7-j];
        }
    }

    for (var i = 0; i < 256; i++) {
        out[i] <== sha.out[i];
    }
}