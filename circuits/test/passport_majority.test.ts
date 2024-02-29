// Import necessary libraries
import chai, { assert, expect } from 'chai'
import path from "path";
import { getPassportData } from "../../common/src/utils/passportData";
import { hash, toUnsignedByte, arraysAreEqual, bytesToBigDecimal, formatAndConcatenateDataHashes, formatMrz, splitToWords } from '../../common/src/utils/utils'
import { DataHash } from "../../common/src/utils/types";
import { getAdjustedTimestampBytes } from '../../common/src/utils/majority';
const wasm_tester = require("circom_tester").wasm;
import { writeFileSync } from 'fs';

describe("Circuit Test", function () {
    this.timeout(0); // Disable timeout
    let inputs: any;
    let circuit: any;
    let w: any;
    let current_time: any;

    before(async () => {

        circuit = await wasm_tester(path.join(__dirname, "../circuits/proof_of_passport_majority.circom"),
            { include: ["node_modules"] },
        );

        const passportData = getPassportData();

        const formattedMrz = formatMrz(passportData.mrz);
        const mrzHash = hash(formatMrz(passportData.mrz));
        const concatenatedDataHashes = formatAndConcatenateDataHashes(
            mrzHash,
            passportData.dataGroupHashes as DataHash[],
        );

        const concatenatedDataHashesHashDigest = hash(concatenatedDataHashes);

        assert(
            arraysAreEqual(passportData.eContent.slice(72, 72 + 32), concatenatedDataHashesHashDigest),
            'concatenatedDataHashesHashDigest is at the right place in passportData.eContent'
        )

        const reveal_bitmap = Array(88).fill('1');
        current_time = getAdjustedTimestampBytes();
        inputs = {
            mrz: formattedMrz.map(byte => String(byte)),
            reveal_bitmap: reveal_bitmap.map(byte => String(byte)),
            dataHashes: concatenatedDataHashes.map(toUnsignedByte).map(byte => String(byte)),
            eContentBytes: passportData.eContent.map(toUnsignedByte).map(byte => String(byte)),
            pubkey: splitToWords(
                BigInt(passportData.pubKey.modulus),
                BigInt(64),
                BigInt(32)
            ),
            signature: splitToWords(
                BigInt(bytesToBigDecimal(passportData.encryptedDigest)),
                BigInt(64),
                BigInt(32)
            ),
            address: "0x70997970c51812dc3a010c7d01b50e0d17dc79c8", // sample address
            current_timestamp: current_time

        }
        console.log("current_time: " + current_time);
        //console.log("mrz:" + inputs.mrz);
        w = await circuit.calculateWitness(inputs);

    });

    it("compile and load the circuit", async function () {
        console.log("current_time: " + current_time);
        expect(circuit).to.not.be.undefined;
    });

    /*
    it("generate proof", async function () {
        expect(w).to.not.be.undefined;

        const outputs =
            console.log(outputs);

    }); */

    it("check contraints", async function () {
        await circuit.checkConstraints(w);
    });

    it("verify reveal_packed outputs", async function () {
        // Example outputs from your test
        const outputs = await circuit.getOutput(w, ["reveal_packed[3]"]);
        const unpackedReveals = unpackRevealPacked(outputs);
        const expectedReveals = generateExpectedReveals(inputs);
        const charUnpacked = convertBytesToCharacters(unpackedReveals);
        const charExpected = convertBytesToCharacters(expectedReveals);

        /*
        console.log(unpackedReveals);
        console.log(expectedReveals);
        console.log("Output: " + charUnpacked);
        console.log("Expected: " + charExpected);
        */

        expect(unpackedReveals).to.deep.equal(expectedReveals, "Circuit output does not match expected output");
    });
});

function unpackRevealPacked(packed) {
    let unpacked = [];
    const bytesCount = [31, 31, 27];

    Object.keys(packed).forEach((key, index) => {
        let element = BigInt(packed[key]);
        for (let j = 0; j < bytesCount[index]; j++) {
            const byte = Number(element & BigInt(0xFF));
            unpacked.push(byte);
            element = element >> BigInt(8);
        }
    });

    return unpacked;
}

function convertBytesToCharacters(bytes) {
    return bytes.map(byte => String.fromCharCode(byte)).join('');
}

function generateExpectedReveals(inputs) {
    let expectedReveals = [];
    for (let i = 0; i < inputs.reveal_bitmap.length; i++) {
        expectedReveals.push(inputs.reveal_bitmap[i] === '1' ? parseInt(inputs.mrz[i + 5]) : 0); // Adjust indexing based on your logic
    }
    expectedReveals.push(18);
    return expectedReveals;
}