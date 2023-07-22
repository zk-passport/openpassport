// Copyright (c) 2018 Jordi Baylina
// License: LGPL-3.0+
//

const Web3Utils = require("web3-utils");

const Contract = require("./evmasm");

function createCode(seed, n) {

    let ci = Web3Utils.keccak256(seed);

    const C = new Contract();

    C.push(0x64);
    C.push("0x00");
    C.push("0x00");
    C.calldatacopy();
    C.push("0x0100000000000000000000000000000000000000000000000000000000");
    C.push("0x00");
    C.mload();
    C.div();
    C.push("0x3f1a1187"); // MiMCSponge(uint256,uint256,uint256)
    C.eq();
    C.jmpi("start");
    C.invalid();

    C.label("start");
    C.push("0x30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f0000001");  // q
    C.push("0x44");
    C.mload();          // k q
    C.push("0x04");
    C.mload();          // xL k q
    C.dup(2);           // q xL k q
    C.push("0x24");
    C.mload();          // xR q xL k q
    C.dup(1);           // q xR q xL k q
    C.dup(0);           // q q xR q xL k q
    C.dup(4);           // xL q q xR q xL k q
    C.dup(6);           // k xL q q xR q xL k q
    C.addmod();         // t=k+xL q xR q xL k q
    C.dup(1);           // q t q xR q xL k q
    C.dup(0);           // q q t q xR q xL k q
    C.dup(2);           // t q q t q xR q xL k q
    C.dup(0);           // t t q q t q xR q xL k q
    C.mulmod();         // b=t^2 q t q xR q xL k q
    C.dup(0);           // b b q t q xR q xL k q
    C.mulmod();         // c=t^4 t q xR q xL k q
    C.mulmod();         // d=t^5 xR q xL k q
    C.addmod();         // e=t^5+xR xL k q (for next round: xL xR k q)

    for (let i=0; i<n-1; i++) {
        if (i < n-2) {
          ci = Web3Utils.keccak256(ci);
        } else {
          ci = "0x00";
        }
        C.swap(1);      // xR xL k q
        C.dup(3);       // q xR xL k q
        C.dup(3);       // k q xR xL k q
        C.dup(1);       // q k q xR xL k q
        C.dup(4);       // xL q k q xR xL k q
        C.push(ci);     // ci xL q k q xR xL k q
        C.addmod();     // a=ci+xL k q xR xL k q
        C.addmod();     // t=a+k xR xL k q
        C.dup(4);       // q t xR xL k q
        C.swap(1);      // t q xR xL k q
        C.dup(1);       // q t q xR xL k q
        C.dup(0);       // q q t q xR xL k q
        C.dup(2);       // t q q t q xR xL k q
        C.dup(0);       // t t q q t q xR xL k q
        C.mulmod();     // b=t^2 q t q xR xL k q
        C.dup(0);       // b b q t q xR xL k q
        C.mulmod();     // c=t^4 t q xR xL k q
        C.mulmod();     // d=t^5 xR xL k q
        C.dup(4);       // q d xR xL k q
        C.swap(2);      // xR d q xL k q
        C.addmod();     // e=t^5+xR xL k q (for next round: xL xR k q)
    }

    C.push("0x20");
    C.mstore();     // Save it to pos 0;
    C.push("0x00");
    C.mstore();     // Save it to pos 1;
    C.push("0x40");
    C.push("0x00");
    C.return();

    return C.createTxData();
}

module.exports.abi = [
    {
        "constant": true,
        "inputs": [
            {
                "name": "xL_in",
                "type": "uint256"
            },
            {
                "name": "xR_in",
                "type": "uint256"
            },
            {
                "name": "k",
                "type": "uint256"
            }
        ],
        "name": "MiMCSponge",
        "outputs": [
            {
                "name": "xL",
                "type": "uint256"
            },
            {
                "name": "xR",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "pure",
        "type": "function"
    }
];

module.exports.createCode = createCode;


