pragma solidity 0.5.1;

library RsaVerify {
    function memcpy(
        uint256 _dest,
        uint256 _src,
        uint256 _len
    ) internal pure {
        // Copy word-length chunks while possible
        for (; _len >= 32; _len -= 32) {
            assembly {
                mstore(_dest, mload(_src))
            }
            _dest += 32;
            _src += 32;
        }

        // Copy remaining bytes
        uint256 mask = 256**(32 - _len) - 1;
        assembly {
            let srcpart := and(mload(_src), not(mask))
            let destpart := and(mload(_dest), mask)
            mstore(_dest, or(destpart, srcpart))
        }
    }

    function join(
        bytes memory _s,
        bytes memory _e,
        bytes memory _m
    ) internal pure returns (bytes memory) {
        uint256 inputLen = 0x60 + _s.length + _e.length + _m.length;

        uint256 slen = _s.length;
        uint256 elen = _e.length;
        uint256 mlen = _m.length;
        uint256 sptr;
        uint256 eptr;
        uint256 mptr;
        uint256 inputPtr;

        bytes memory input = new bytes(inputLen);
        assembly {
            sptr := add(_s, 0x20)
            eptr := add(_e, 0x20)
            mptr := add(_m, 0x20)
            mstore(add(input, 0x20), slen)
            mstore(add(input, 0x40), elen)
            mstore(add(input, 0x60), mlen)
            inputPtr := add(input, 0x20)
        }
        memcpy(inputPtr + 0x60, sptr, _s.length);
        memcpy(inputPtr + 0x60 + _s.length, eptr, _e.length);
        memcpy(inputPtr + 0x60 + _s.length + _e.length, mptr, _m.length);

        return input;
    }

     /** @dev Verifies a PKCSv1.5 SHA256 signature
      * @param _data is the sign of the data
      * @param _s is the signature
      * @param _e is the exponent
      * @param _n is the public key modulus
      * @return 0 if success, >0 otherwise
    */  
    function VerifyPKCS1v15(
        bytes memory _data,
        bytes memory _s,
        bytes memory _e,
        bytes memory _n
    ) public view returns (uint256) {
        bytes32 _sha256 = sha256(_data);
        uint8[19] memory sha256HashPrefix = [
            0x30,
            0x31,
            0x30,
            0x0d,
            0x06,
            0x09,
            0x60,
            0x86,
            0x48,
            0x01,
            0x65,
            0x03,
            0x04,
            0x02,
            0x01,
            0x05,
            0x00,
            0x04,
            0x20
        ];
        uint256 sha256HashLen = 32;

        uint256 tLen = sha256HashPrefix.length + _sha256.length;
        uint256 k = _n.length;
        // invalid input params length
        if (k < tLen + 11) {
            return 1;
        }

        uint256 i;

        bytes memory input = join(_s, _e, _n);
        uint256 inputLen = input.length;
          // EM = 0x00 || 0x01 || PS || 0x00 || T
        uint256 emLen = _n.length;
        bytes memory em = new bytes(emLen);

        assembly {
            pop(
                staticcall(
                    sub(gas(), 2000),
                    5,
                    add(input, 0x20),
                    inputLen,
                    add(em, 0x20),
                    emLen
                )
            )
        }

        // EM = 0x00 || 0x01 || PS || 0x00 || T
        if (em[0] != 0 || uint8(em[1]) != 1) {
            return 1;
        }
        // Check hashed data
        for (i = 0; i < sha256HashLen; i++) {
            if ((em[k - sha256HashLen + i]) != _sha256[i]) {
                return 2;
            }
        }
        // Check sha256Hash prefix
        for (i = 0; i < sha256HashPrefix.length; i++) {
            // return k - tLen + i;
            if (uint8(em[k - tLen + i]) != sha256HashPrefix[i]) {
                return 3;
            }
        }
        // Check 4 byte is 0x00
        if (em[k - tLen - 1] != 0) {
            return 4;
        }
        // padding
        for (i = 2; i < k - tLen - 1; i++) {
            if (em[i] != 0xff) {
                return 5;
            }
        }

        return 0;
    }
}
