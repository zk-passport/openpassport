pragma circom 2.1.9;

include "../openpassport_dsc.circom";

component main { public [ merkle_root ] } = OPENPASSPORT_DSC(4, 64, 32, 64, 32, 1664, 256, 12);
