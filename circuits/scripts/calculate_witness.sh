#!/bin/bash

CIRCUIT_NAME="rsa_verifier_4096"
NUM="4"
node build/${CIRCUIT_NAME}_js/generate_witness.js build/${CIRCUIT_NAME}_js/${CIRCUIT_NAME}.wasm tests/utils/inputs_rsa_4096_${NUM}.json ${CIRCUIT_NAME}_snarkjs_witness_${NUM}.wtns
snarkjs wtns export json ${CIRCUIT_NAME}_snarkjs_witness_${NUM}.wtns ${CIRCUIT_NAME}_snarkjs_witness_${NUM}.wtns.json
