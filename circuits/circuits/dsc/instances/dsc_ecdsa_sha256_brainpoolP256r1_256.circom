pragma circom 2.1.9;

include "../openpassport_dsc.circom";

component main { public [  merkle_root] } = OPENPASSPORT_DSC(21, 64, 4, 64, 4, 1664, 32, 12);
