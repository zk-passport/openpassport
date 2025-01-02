pragma circom 2.1.9;

include "../openpassport_dsc.circom";

component main { public [ merkle_root ] } = OPENPASSPORT_DSC(17, 64, 64, 64, 64, 1664, 512, 12);
