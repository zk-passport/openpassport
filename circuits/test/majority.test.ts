// Import necessary libraries
import chai, { assert, expect } from 'chai'
import path from "path";
import { genSampleData } from "../../common/src/utils/passportData";
import { getAdjustedTimestampBytes, getTimestampBytesFromYearFraction, yearFractionToYYMMDD, yymmddToByteArray } from "../../common/src/utils/majority";

import { DataHash } from "../../common/src/utils/types";
const wasm_tester = require("circom_tester").wasm;

describe("Checks Test", function () {
    this.timeout(0);
    let circuit: any;
    let w: any;
    let inputs: any;
    let sampleData: any;
    let current_time: any;
    let yymmdd: any;

    // n: number of timestamps to test
    let n: number = 10;
    // yearStart: the first year to test
    let yearStart: number = 2000;
    // yearEnd: the last year to test
    let yearEnd: number = 2100;
    // maxDiff: set to 99 as a user of 101 yo will be 1 yo in the circuit
    let maxDiff: number = 99;
    // minDiff: minimum difference between  current time and birth time, has to be equal to majority defined in circuit
    let minDiff: number = 18;
    // create an array of "actual timestamps" to test the circuit
    let timestamps = Array(n).fill(0).map((_, i) => yearStart + (yearEnd - yearStart) * i / n);

    let timestamps_birth_major = timestamps.map((timestamp) => {
        let randomDiff = (Math.random() * ((0.99 * maxDiff) - (1.01 * minDiff)) + 1.01 * minDiff);
        let birthTimestamp = timestamp - randomDiff;
        return birthTimestamp;
    });

    let timestamps_birth_minor = timestamps.map((timestamp) => {
        let randomDiff = (Math.random() * (0.99 * minDiff - 0.01 * minDiff) + 0.01 * minDiff);
        let birthTimestamp = timestamp - randomDiff;
        return birthTimestamp;
    });

    before(async () => {
        circuit = await wasm_tester(path.join(__dirname, "../circuits/majority_test.circom"),
            { include: ["node_modules"] },
        );
        sampleData = genSampleData("000000");
        yymmdd = yymmddToByteArray("010101");
        current_time = getAdjustedTimestampBytes();
        inputs = {
            "yymmdd": yymmdd,
            "current_timestamp": current_time
        }
        console.log("mrz:" + inputs.mrz);
        w = await circuit.calculateWitness(inputs);
    });

    describe("Circuit Test", function () {
        it("compile and load the circuit", async function () {
            return expect(circuit).to.not.be.undefined;
        });

        it("generate proof", async function () {
            expect(w).to.not.be.undefined;
            const ouputs = await circuit.getDecoratedOutput(w);
            console.log("outputs: " + ouputs);
        });

        it("check contraints", async function () {
            await circuit.checkConstraints(w);
        });

        describe("Majority tests", function () {
            timestamps.forEach((timestamp, index) => {
                it(`majority check for ${timestamp}`, async function () {
                    const yymmdd = yearFractionToYYMMDD(timestamps_birth_major[index]);
                    const byteArray = yymmddToByteArray(yymmdd);
                    current_time = getTimestampBytesFromYearFraction(timestamps[index]);
                    const inputs = {
                        "yymmdd": byteArray,
                        "current_timestamp": current_time
                    }
                    /*
                    console.log("timestamps_birth: " + timestamps_birth_major[index]);
                    console.log("timestamps: " + timestamps[index]);
                    console.log("age in mocha: " + (timestamps[index] - timestamps_birth_major[index]));
                    console.log("yymmdd: " + byteArray);
                    console.log("current_time: " + current_time);
                    */
                    const w = await circuit.calculateWitness(inputs);
                    const output = w[1];
                    assert.strictEqual(output, BigInt(1), "Output should be equal to 1n");
                });
            });
        });

        describe("Minority Tests", function () {
            timestamps.forEach((timestamp, index) => {
                it(`minority check for ${timestamp}`, async function () {
                    const yymmdd = yearFractionToYYMMDD(timestamps_birth_minor[index]);
                    const byteArray = yymmddToByteArray(yymmdd);
                    current_time = getTimestampBytesFromYearFraction(timestamps[index]);
                    const inputs = {
                        "yymmdd": byteArray,
                        "current_timestamp": current_time
                    }
                    /*
                    console.log("timestamps_birth_minor: " + timestamps_birth_minor[index]);
                    console.log("timestamps: " + timestamps[index]);
                    console.log("age in mocha: " + (timestamps[index] - timestamps_birth_minor[index]));
                    console.log("yymmdd: " + byteArray);
                    console.log("current_time: " + current_time);
                    */
                    const w = await circuit.calculateWitness(inputs);
                    const output = w[1];
                    assert.strictEqual(output, BigInt(0), "Output should be equal to 0n");
                });
            });
        });

    });

});
