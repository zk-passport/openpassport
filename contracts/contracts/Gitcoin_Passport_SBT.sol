// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "./SBT.sol";

contract GitcoinProofOfPassportSBT is SBT {
    constructor(
        string memory name,
        string memory symbol,
        Verifier_disclose v,
        Formatter f,
        IRegister r
    ) SBT(name, symbol, v, f, r) {}
}