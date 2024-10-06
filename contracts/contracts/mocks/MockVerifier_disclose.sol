// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

contract MockVerifier_disclose {
    function verifyProof(
        uint[2] calldata _pA,
        uint[2][2] calldata _pB,
        uint[2] calldata _pC,
        uint[16] calldata _pubSignals
    ) public view returns (bool) {
        if (_pubSignals[0] == 1) {
            return false;
        }
        return true;
    }
}