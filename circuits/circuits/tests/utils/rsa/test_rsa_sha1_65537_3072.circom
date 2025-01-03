pragma circom 2.1.9;

include "../../../utils/circomlib/signature/rsa/verifyRsa65537Pkcs1v1_5.circom";

// 3072 bits

template VerifyRsaPkcs1v1_5Tester() {
    signal input signature[32];
    signal input modulus[32];
    signal input message[32];

    VerifyRsa65537Pkcs1v1_5(96, 32, 160)(signature, modulus, message);
}

component main = VerifyRsaPkcs1v1_5Tester();