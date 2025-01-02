pragma circom 2.1.9;

include "../openpassport_dsc.circom";

component main { public [ merkle_root ] } = OPENPASSPORT_DSC(18, 64, 64, 64, 64, 1024, 512, 12);
