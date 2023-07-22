// Copyright (c) 2018 Jordi Baylina
// License: LGPL-3.0+
//

const Web3Utils = require("web3-utils");

const Contract = require("./evmasm");

function createCode(seed, n) {

    let ci = Web3Utils.keccak256(seed);

    const C = new Contract();

    C.push(0x44);
    C.push("0x00");
    C.push("0x00");
    C.calldatacopy();
    C.push("0x0100000000000000000000000000000000000000000000000000000000");
    C.push("0x00");
    C.mload();
    C.div();
    C.push("0xd15ca109"); // MiMCpe7(uint256,uint256)
//    C.push("0x8c42199e"); // MiMCpe7(uint256,uint256,uint256)
    C.eq();
    C.jmpi("start");
    C.invalid();

    C.label("start");
    C.push("0x30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f0000001");  // q
    C.push("0x24");
    C.mload();          // k q


    C.dup(1);           // q k q
    C.dup(0);           // q q k q
    C.push("0x04");
    C.mload();          // x q q k q
    C.dup(3);           // k x q q k q
    C.addmod();         // t=x+k q k q
    C.dup(1);           // q t q k q
    C.dup(0);           // q q t q k q
    C.dup(2);           // t q q t q k q
    C.dup(0);           // t t q q t q k q
    C.mulmod();         // a=t^2 q t q k q
    C.dup(1);           // q a q t q k q
    C.dup(1);           // a q a q t q k q
    C.dup(0);           // a a q a q t q k q
    C.mulmod();         // b=t^4 a q t q k q
    C.mulmod();         // c=t^6 t q k q
    C.mulmod();         // r=t^7 k q

    for (let i=0; i<n-1; i++) {
        ci = Web3Utils.keccak256(ci);
        C.dup(2);       // q r k q
        C.dup(0);       // q q r k q
        C.dup(0);       // q q q r k q
        C.swap(3);      // r q q q k q
        C.push(ci);     // c r q q k q
        C.addmod();     // s=c+r q q k q
        C.dup(3);       // k s q q k q
        C.addmod();     // t=s+k q k q
        C.dup(1);       // q t q k q
        C.dup(0);       // q q t q k q
        C.dup(2);       // t q q t q k q
        C.dup(0);       // t t q q t q k q
        C.mulmod();     // a=t^2 q t q k q
        C.dup(1);       // q a q t q k q
        C.dup(1);       // a q a q t q k q
        C.dup(0);       // a a q a q t q k q
        C.mulmod();     // b=t^4 a q t q k q
        C.mulmod();     // c=t^6 t q k q
        C.mulmod();     // r=t^7 k q
    }

    C.addmod();     // res=t^7+k
    C.push("0x00");
    C.mstore();     // Save it to pos 0;
    C.push("0x20");
    C.push("0x00");
    C.return();

    return C.createTxData();
}

module.exports.abi = [
    {
        "constant": true,
        "inputs": [
            {
                "name": "in_x",
                "type": "uint256"
            },
            {
                "name": "in_k",
                "type": "uint256"
            }
        ],
        "name": "MiMCpe7",
        "outputs": [
            {
                "name": "out_x",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "pure",
        "type": "function"
    }
];

module.exports.createCode = createCode;


