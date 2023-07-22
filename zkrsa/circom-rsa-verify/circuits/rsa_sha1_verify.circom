include "./pow_mod.circom";
include "../circom-bigint/circomlib/circuits/bitify.circom";

// Pkcs1v15 + Sha1, exp 65537
template RsaSha1VerifyPkcs1v15(w, nb, e_bits, hashLen) {
    // w: 32, nb: 64, e_bits: 17, hashLen: 5
    signal input exp[nb];
    signal input sign[nb];
    signal input modulus[nb];
    signal input hashed[hashLen];

    // sign ** exp mod modulus
    component pm = PowerModv2(w, nb, e_bits);
    for (var i  = 0; i < nb; i++) {
        pm.base[i] <== sign[i];
        pm.exp[i] <== exp[i];
        pm.modulus[i] <== modulus[i];
    }

    // 1. Check hashed data
    // SHA1: 32 * 5 = 160 bits. the first 5 numbers
    for (var i = 0; i < hashLen; i++) {
        hashed[i] === pm.out[i];
    }

    // 2. Check hash prefix for sha1 and 1 byte 0x00: 
    // Prefix:   (0x)30 21 30 09 06 05 2b 0e 03 02 1a 05 00 04 14
    // 32 bits words split
    pm.out[5] === 83887124; // 05 00 04 14
    pm.out[6] === 235078170; // 0e 03 02 1a
    pm.out[7] === 151389483; // 09 06 05 2b
    pm.out[8] === 3154224; // 30 21 30

    // 3. Check (0x00 required by RFC) || (00 bits padding from 32 bit word)
    component num2bits = Num2Bits(w);
    num2bits.in <== pm.out[8];
    var remainsBits[32] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 0, 0];
    for (var i = 0; i < 32; i++) {
        num2bits.out[i] === remainsBits[31 - i];
    }

    // 4. Check PS
    // em = 256 bytes, tLen = 35
    // ps_length = 256 - 35 - 3 = 218 bytes = 1744 bits = ⌊54.5⌋ * 32 bits words
    // ps value for 32 bits words is 0xFFFFFFFF == 4294967295
    for (var i = 9; i < 63; i++) {
        pm.out[i] === 4294967295;
    }

    // 5. Remains 16 bits (0xffff) from PS and 0x00 0x01
    // Hence: 0x0001FFFF == 131071
    pm.out[63] === 131071;
}
