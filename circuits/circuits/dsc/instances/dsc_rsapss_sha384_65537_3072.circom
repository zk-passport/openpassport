pragma circom 2.1.9;

include "../openpassport_dsc.circom";

component main { public [ merkle_root ] } = OPENPASSPORT_DSC(18, 96, 32, 96, 32, 896, 384, 12);
