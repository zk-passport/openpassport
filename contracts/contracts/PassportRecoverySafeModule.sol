pragma solidity ^0.8.13;

import "zodiac/core/Module.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

contract PassportRecoverySafeModule is Module {
    ERC721Enumerable public passportSBT;
    uint256 public id;

    error NotAuthorized();

    constructor() {
        _transferOwnership(msg.sender);
    }

    function setUp(bytes memory initializeParams) public override {}

    function init(address safe, address _passportSBT, uint256 _id) public {
        setAvatar(safe);
        setTarget(safe);
        passportSBT = _passportSBT;
        id = _id;
    }

    function claimSafe(bytes memory data) public {
        if (passportSBT.ownerOf(id) == msg.sender) {
            exec(avatar, 0, data, Enum.Operation.Call);
        } else {
            revert NotAuthorized();
        }
    }
}
