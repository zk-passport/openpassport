#!/bin/bash

CIRCUIT_TYPE="tests/utils"
CIRCUIT_NAME="rsa_verifier"

circom circuits/${CIRCUIT_TYPE}/${CIRCUIT_NAME}.circom -l node_modules -l ./node_modules/@zk-kit/binary-merkle-root.circom/src -l ./node_modules/circomlib/circuits --r1cs --O1 --wasm --output build

snarkjs r1cs export json build/${CIRCUIT_NAME}.r1cs build/${CIRCUIT_NAME}.r1cs.json
