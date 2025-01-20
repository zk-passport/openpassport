pragma circom 2.1.9;

include "../dsc.circom";

component main { public [ merkle_root ] } = DSC(3, 64, 32, 64, 32, 1664, 525, 12);