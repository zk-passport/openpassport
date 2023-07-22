// // SPDX-License-Identifier: MIT
// pragma solidity ^0.8.0;

// // import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
// import {Pairing} from "./RsaSha256Verifier.sol";

// contract ProofOfBaguette {
//     Verifier public immutable verifier;

//     constructor(Verifier v) {
//         verifier = v;
//     }

//     function check(
//         uint256[2] memory a,
//         uint256[2][2] memory b,
//         uint256[2] memory c,
//         uint256[100] memory inputs
//     ) public {
//         require(Pairing.verifyProof(a, b, c, inputs), "Invalid Proof");
//     }
// }
