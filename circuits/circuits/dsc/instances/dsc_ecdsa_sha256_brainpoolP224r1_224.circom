pragma circom 2.1.9;

include "../openpassport_dsc.circom";

component main { public [  merkle_root] } = OPENPASSPORT_DSC(28, 32, 7, 32, 7, 1664, 28, 12);
