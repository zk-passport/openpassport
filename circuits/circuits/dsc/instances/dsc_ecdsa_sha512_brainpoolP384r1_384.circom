pragma circom 2.1.9;

include "../openpassport_dsc.circom";

component main { public [  merkle_root] } = OPENPASSPORT_DSC(26, 64, 6, 64, 6, 512, 48, 12);
