import { groth16 } from "snarkjs"
import {
    generateCircuitInputsRegister
} from "../../common/src/utils/generateInputs"
import { getCSCAInputs } from "../../common/src/utils/csca"
import { describe } from 'mocha'
import fs from "fs";
import forge from "node-forge";
import { MODAL_SERVER_ADDRESS } from "../../common/src/constants/constants";
import { castCSCAProof } from "../../common/src/utils/types";
const n_dsc = 121;
const k_dsc = 17;
const n_csca = 121;
const k_csca = 34;
const max_cert_bytes = 1664;
const dsc = fs.readFileSync('../common/src/mock_certificates/sha256_rsa_4096/mock_dsc.pem', 'utf8');
const csca = fs.readFileSync('../common/src/mock_certificates/sha256_rsa_4096/mock_csca.pem', 'utf8');
const dscCert = forge.pki.certificateFromPem(dsc);
const cscaCert = forge.pki.certificateFromPem(csca);
const inputs_csca = getCSCAInputs(BigInt(0).toString(), dscCert, cscaCert, n_dsc, k_dsc, n_csca, k_csca, max_cert_bytes, true);
import { mockPassportData_sha256WithRSAEncryption_65537 } from "../../common/src/utils/mockPassportData";
async function requestCSCAProof(inputs) {
    try {
        console.log("inputs_csca before requesting modal server - cscaRequest.ts");
        const response = await fetch(MODAL_SERVER_ADDRESS, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(inputs)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const cscaProof = castCSCAProof(data);
        console.log('Response from server:', data);
        return cscaProof;
    } catch (error) {
        console.error('Error during request:', error);
        throw error;
    }
}
let circuit: any;
let inputs: any;
let attestation_id: string;
import path from "path";
import { poseidon1 } from "poseidon-lite";
import { verifyProofs } from "../ProofOfPassportRegister";
let proof: any;
let publicSignals: any;
let cscaProof: any;
describe("Testing the register flow", function () {
    this.timeout(0);
    before(async () => {
        const sha256WithRSAEncryption_65537 = {
            wasm: "../circuits/build/register_sha256WithRSAEncryption_65537_js/register_sha256WithRSAEncryption_65537.wasm",
            zkey: "../circuits/build/register_sha256WithRSAEncryption_65537_final.zkey",
            vkey: "../circuits/build/register_sha256WithRSAEncryption_65537_vkey.json"
        }
        const secret = BigInt(0).toString();
        console.log("secret", secret);

        const attestation_name = "E-PASSPORT";
        attestation_id = poseidon1([
            BigInt(Buffer.from(attestation_name).readUIntBE(0, 6))
        ]).toString();

        inputs = generateCircuitInputsRegister(
            secret,
            BigInt(0).toString(),
            attestation_id,
            mockPassportData_sha256WithRSAEncryption_65537,
            n_dsc,
            k_dsc,
            [mockPassportData_sha256WithRSAEncryption_65537]
        );
        console.log('\x1b[32m%s\x1b[0m', `Generating proof register `);
        ({ proof, publicSignals } = await groth16.fullProve(
            inputs,
            sha256WithRSAEncryption_65537.wasm,
            sha256WithRSAEncryption_65537.zkey
        ))
    });


    it('should successfully request and receive a CSCA proof', async () => {
        try {
            console.log('Requesting CSCA proof...');
            cscaProof = await requestCSCAProof(inputs_csca);
            console.log('CSCA proof received:', cscaProof);
            // Add assertions here to verify the proof structure
            // For example:
            // assert.ok(cscaProof.proof, 'Proof should exist');
            // assert.ok(cscaProof.publicSignals, 'Public signals should exist');
        } catch (error) {
            console.error('Error in CSCA proof request:', error);
            throw error;
        }
    });

    it('should successfully verify the proof to register', async () => {
        const proof_register = {
            proof: proof,
            publicSignals: publicSignals
        }
        const proof_csca = {
            proof: cscaProof.proof,
            publicSignals: cscaProof.pub_signals
        }
        const result = await verifyProofs(proof_register, proof_csca);
        console.log('Verification result:', result);

    });
});

