// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IVcAndDiscloseCircuitVerifier {
    struct VcAndDiscloseProof {
        uint[2] a;
        uint[2][2] b;
        uint[2] c;
        uint[10] pubSignals;
    }

    function verifyProof(
        uint[2] calldata a,
        uint[2][2] calldata b,
        uint[2] calldata c,
        uint[10] calldata pubSignals
    ) external view returns (bool);
}
