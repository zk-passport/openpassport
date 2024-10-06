//SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import {IRegister} from "../interfaces/IRegister.sol";

contract MockRegister is IRegister {

    function validateProof(
        RegisterProof calldata proof,
        CSCAProof calldata proof_csca,
        uint256 signature_algorithm,
        uint256 signature_algorithm_csca
    ) external {}

    function verifyProofRegister(
        RegisterProof calldata proof,
        uint256 signature_algorithm
    ) external view returns (bool) {
        return true;
    }

    function verifyProofCSCA(
        CSCAProof calldata proof,
        uint256 signature_algorithm_csca
    ) external view returns (bool) {
        return true;
    }

    function checkRoot(uint root) external view returns (bool) {
        if (root == uint(1)) {
            return false;
        }
        return true;
    }

    function getMerkleTreeSize() external view returns (uint) {
        return uint(16);
    }

    function getMerkleRoot() external view returns (uint) {
        return uint(0);
    }

    function indexOf(uint commitment) external view returns (uint) {
        return uint(0);
    }

    function devAddCommitment(uint commitment) external {}

}