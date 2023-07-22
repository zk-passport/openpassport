// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import {Pairing} from "./RsaSha256Verifier.sol";

contract ProofOfBaguette is ERC721Enumerable, Ownable {
    using Counters for Counters.Counter;

    Verifier public immutable verifier;
    address public cscaPubkey = 0x0000000

    constructor(Verifier v, address _owner) {
      verifier = v;
      transferOwnership(_owner);
    }

    function setCSCApubKey(address _CSCApubKey) public onlyOwner {
      cscaPubkey = _CSCApubKey;
    }

    // function check(
    //     uint256[2] memory a,
    //     uint256[2][2] memory b,
    //     uint256[2] memory c,
    //     uint256[100] memory inputs
    // ) public {
    //     require(Pairing.verifyProof(a, b, c, inputs), "Invalid Proof");
    // }

    function mint(uint256[2] memory a, uint256[2][2] memory b, uint256[2] memory c, uint256[100] memory inputs)
        public
    {
        // Check eth address committed to in proof matches msg.sender, to avoid replayability
        // require(address(uint160(inputs[addressIndexInSignals])) == msg.sender, "Invalid address");

        // Verify that the public key for RSA matches the hardcoded one
        // for (uint256 i = body_len; i < msg_len - 1; i++) {
        //     require(mailServer.isVerified(domain, i - body_len, inputs[i]), "Invalid: RSA modulus not matched");
        // }

        // Verify that the public key for RSA matches the hardcoded one
        // commented out for now, since hard to keep up with all
        // require(cscaPubkey == inputs[], "Invalid pubkey in inputs");

        require(verifier.verifyProof(a, b, c, inputs), "Invalid Proof");

        // Effects: Mint token
        uint256 tokenId = tokenCounter.current() + 1;
        tokenIDToName[tokenId] = messageBytes;
        _mint(msg.sender, tokenId);
        tokenCounter.increment();
    }

    function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal {
        require(from == address(0), "Cannot transfer - Passport is soulbound");
    }
}
