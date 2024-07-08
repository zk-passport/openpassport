"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const snarkjs_1 = require("snarkjs");
const generateInputs_1 = require("../../common/src/utils/generateInputs");
const mockPassportData_1 = require("../../common/src/utils/mockPassportData");
const lean_imt_1 = require("@zk-kit/lean-imt");
const poseidon_lite_1 = require("poseidon-lite");
const constants_1 = require("../../common/src/constants/constants");
const utils_1 = require("../../common/src/utils/utils");
const pubkeyTree_1 = require("../../common/src/utils/pubkeyTree");
const index_1 = require("../index");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const path_disclose_wasm = "../circuits/build/disclose_js/disclose.wasm";
const path_disclose_zkey = "../circuits/build/disclose_final.zkey";
describe('Circuit Proving Tests', () => {
    it('proofOfPassportWeb2Verifier - should verify', async () => {
        /// Generate circuit inputs
        const passportData = mockPassportData_1.mockPassportData_sha256WithRSAEncryption_65537;
        const imt = new lean_imt_1.LeanIMT((a, b) => (0, poseidon_lite_1.poseidon2)([a, b]), []);
        const bitmap = Array(90).fill("1");
        const scope = BigInt(1).toString();
        const majority = ["1", "8"];
        const secret = BigInt(0).toString();
        const mrz_bytes = (0, utils_1.packBytes)((0, utils_1.formatMrz)(passportData.mrz));
        const pubkey_leaf = (0, pubkeyTree_1.getLeaf)({
            signatureAlgorithm: passportData.signatureAlgorithm,
            modulus: passportData.pubKey.modulus,
            exponent: passportData.pubKey.exponent,
        }).toString();
        const commitment = (0, poseidon_lite_1.poseidon6)([
            secret,
            constants_1.PASSPORT_ATTESTATION_ID,
            pubkey_leaf,
            mrz_bytes[0],
            mrz_bytes[1],
            mrz_bytes[2]
        ]);
        imt.insert(commitment);
        const inputs = (0, generateInputs_1.generateCircuitInputsDisclose)(secret, constants_1.PASSPORT_ATTESTATION_ID, passportData, imt, majority, bitmap, scope, BigInt(5).toString());
        // Generate proof and public signals
        const { proof, publicSignals } = await snarkjs_1.groth16.fullProve(inputs, path_disclose_wasm, path_disclose_zkey);
        /// Verify using web2 verifier
        const proofOfPassportWeb2Verifier = new index_1.ProofOfPassportWeb2Verifier({
            scope: scope,
            requirements: [["older_than", "18"], ["nationality", "France"]]
        });
        const proofOfPassportWeb2Inputs = new index_1.ProofOfPassportWeb2Inputs(publicSignals, proof);
        const result = await proofOfPassportWeb2Verifier.verify(proofOfPassportWeb2Inputs);
        console.log(result.toJson());
        (0, chai_1.expect)(result.valid).to.be.true;
    });
    it('proofOfPassportWeb3Verifier - should succeed', async () => {
        const scope = BigInt(1).toString();
        /// Verify using web3 verifier
        const proofOfPassportWeb3Verifier = new index_1.ProofOfPassportWeb3Verifier({
            scope: scope
        });
        const result = await proofOfPassportWeb3Verifier.verify(process.env.TEST_ADDRESS, Number(process.env.TOKEN_ID));
        (0, chai_1.expect)(result.valid).to.be.true;
    });
    it('proofOfPassportWeb3Verifier - should fail', async () => {
        const scope = BigInt(1).toString();
        /// Verify using web3 verifier
        const proofOfPassportWeb3Verifier = new index_1.ProofOfPassportWeb3Verifier({
            scope: scope,
            requirements: [["older_than", "18"]]
        });
        const result = await proofOfPassportWeb3Verifier.verify(process.env.TEST_ADDRESS, Number(process.env.TOKEN_ID));
        (0, chai_1.expect)(result.older_than).to.be.true;
        (0, chai_1.expect)(result.valid).to.be.false;
    });
});
