pragma circom 2.1.9;

include "../openpassport_dsc.circom";

component main { public [ merkle_root ] } = OPENPASSPORT_DSC(19, 96, 32, 96, 32, 1664, 384, 12);
