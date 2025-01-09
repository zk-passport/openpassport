pragma circom 2.1.9;

include "../openpassport_dsc.circom";

component main { public [  merkle_root] } = OPENPASSPORT_DSC(34, 64, 6, 64, 6, 1664, 32, 12);
