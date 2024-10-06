import { ethers } from "hardhat";
import { expect, assert } from "chai";
import { BigNumberish, Block, dataLength } from "ethers";
import { genMockPassportData } from "../../common/src/utils/genMockPassportData";
import { 
    generateCircuitInputsProve,
    generateCircuitInputsDisclose
} from "../../common/src/utils/generateInputs";
import { getCSCAModulusMerkleTree } from "../../common/src/utils/csca";
import { formatRoot } from "../../common/src/utils/utils";
import { SBTProof } from "../../common/src/utils/types";
import { IMT } from "../../common/node_modules/@zk-kit/imt";

describe("Test SBT Contract", function () {

    let verifier_disclose: any;
    let formatter: any;
    let registry: any;
    let sbt: any;

    let owner: any;
    let addr1: any;
    let addr2: any;

    let merkleTree: IMT;

    before(async function () {
        // TODO: I need to figure out what is deploy options

        [owner, addr1, addr2] = await ethers.getSigners();

        const verifierDiscloseFactory = await ethers.getContractFactory("Verifier_disclose");
        verifier_disclose = await verifierDiscloseFactory.deploy();
        await verifier_disclose.waitForDeployment();
        console.log('\x1b[34m%s\x1b[0m', `Verifier_disclose deployed to ${verifier_disclose.target}`);

        const formatterFactory = await ethers.getContractFactory("Formatter");
        formatter = await formatterFactory.deploy();
        await formatter.waitForDeployment();
        console.log('\x1b[34m%s\x1b[0m', `formatter deployed to ${formatter.target}`);

        const registryFactory = await ethers.getContractFactory("Registry");
        // I need to figure out this merkle root
        merkleTree = getCSCAModulusMerkleTree();
        registry = await registryFactory.deploy(formatRoot(merkleTree.root))
        // console.log("merkleRoot: ", formatRoot(merkleTree.root));
        await registry.waitForDeployment();
        console.log('\x1b[34m%s\x1b[0m', `register deployed to ${registry.target}`);

        const sbtFactory = await ethers.getContractFactory("SBT");
        sbt = await sbtFactory.deploy(
            verifier_disclose,
            formatter,
            registry
        );
        await sbt.waitForDeployment();
        console.log('\x1b[34m%s\x1b[0m', `sbt deployed to ${sbt.target}`);
    });

    describe("Test mint and attr functions in SBT", function () {
        let mockedSbt: any;

        before(async function () {
            console.log('\x1b[36m%s\x1b[0m', `Deploy sbt with mock verifier again`);
            const verifierDiscloseFactory = await ethers.getContractFactory("MockVerifier_disclose");
            verifier_disclose = await verifierDiscloseFactory.deploy();
            await verifier_disclose.waitForDeployment();
            console.log('\x1b[34m%s\x1b[0m', `Verifier_disclose deployed to ${verifier_disclose.target}`);

            const registerFactory = await ethers.getContractFactory("MockRegister");
            registry = await registerFactory.deploy();
            await registry.waitForDeployment();
            console.log('\x1b[34m%s\x1b[0m', `registry deployed to ${registry.target}`);

            const sbtFactory = await ethers.getContractFactory("SBT");
            mockedSbt = await sbtFactory.deploy(
                verifier_disclose,
                formatter,
                registry
            );
            await mockedSbt.waitForDeployment();
            console.log('\x1b[34m%s\x1b[0m', `sbt deployed to ${sbt.target}`);
        });

        it("Test: mint, should be reverted if register.checkRoot returns false", async function() {
            let mockSBTProof: SBTProof = createMockSBTProof({ merkle_root: "1" });
            await expect(mockedSbt.mint(mockSBTProof)).to.be.revertedWith("Invalid merkle root");
        });

        it("Test:mint, should be reverted if currentTimestamp is not within a +1 day range", async function() {
            let passedTwoDays = new Date();
            passedTwoDays.setUTCDate(passedTwoDays.getUTCDate() + 2);
            
            let mockSBTProof: SBTProof = createMockSBTProof({ current_date: getDateNum(passedTwoDays) });

            await expect(mockedSbt.mint(mockSBTProof)).to.be.revertedWith("Current date is not within the valid range");
        });

        it("Test:mint, should be reverted if currentTimestamp is not within a -1 day range", async function() {
            let twoDaysBefore = new Date();
            twoDaysBefore.setUTCDate(twoDaysBefore.getUTCDate() - 2);
            
            let mockSBTProof: SBTProof = createMockSBTProof({ current_date: getDateNum(twoDaysBefore) });

            await expect(mockedSbt.mint(mockSBTProof)).to.be.revertedWith("Current date is not within the valid range");
        });

        it("Test:mint, should be reverted if verifyProof returns false", async function () {
            let mockSBTProof: SBTProof = createMockSBTProof({ nullifier: "1" });
            await expect(mockedSbt.mint(mockSBTProof)).to.be.revertedWith("Invalid Proof");
        });

        it("Test:mint, should mint token if all validation was passed", async function () {
            let mockSBTProof: SBTProof = createMockSBTProof();
            await mockedSbt.mint(mockSBTProof);

            expect(await mockedSbt.totalSupply()).to.be.equal(1);
            expect(await mockedSbt.ownerOf(0)).to.be.equal(addr1.address);
        });

    });

    describe("Test attr functions in SBT", function() {

        before(async function() {
            let mockSBTProof: SBTProof = createMockSBTProof();
            await sbt.mint(mockSBTProof);
        });

        it("Test:attr, check issuing state is correctly registered", async function () { 
            let attr0 = await sbt.getIssuingStateOf(0);
            console.log("issuing state: ", attr0);
        });
    });

    describe("Test utils functions in SBT", function() {

        it("Test: getCurrentTimestamp, should matches with actual timestamp within 1 day", async function () {

            const dateNum = getDateNum();
            const block = await ethers.provider.getBlock("latest") as Block;
            const blockTimestamp = BigInt(block.timestamp);
            const currentTimestamp = await sbt.getCurrentTimestamp(dateNum);

            const difference = currentTimestamp - blockTimestamp;
            const differenceAbs = (difference < 0n) ? -difference : difference;

            // Check if generated timestamp is within 1 day of block.timestamp
            expect(differenceAbs).to.be.lte(86400);
        });

        it ("Test: isStringEqual, Should return true when pass same string to isStringEqual", async function () {
            let string_a = "openpassport";
            let string_b = "openpassport";
            expect(await sbt.isStringEqual(string_a, string_b)).to.equal(true);
        });

        it ("Test: isStringEqual, Should return false when pass different string to isStringEqual", async function () {
            let string_a = "openpassport";
            let string_b = "closepassport";
            expect(await sbt.isStringEqual(string_a, string_b)).to.equal(false);
        });

        it ("Test: substring, Should return specified substring", async function () {
            const originalStr = "openpassport";
            const start = 4;
            const end = 9;
            const expectedSubstr = "openpassport".substring(start, end);
            const originalBytes = ethers.toUtf8Bytes(originalStr);
            const resultBytes: string = await sbt.substring(originalBytes, start, end);
            const resultStr = ethers.toUtf8String(resultBytes);
            expect(resultStr).to.equal(expectedSubstr);
        });
    });
});

function getDateNum(date: Date = new Date()): number[] {

    const year = date.getUTCFullYear() % 100;
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();

    const dateNum = [
        Math.floor(year / 10),
        year % 10,
        Math.floor(month / 10),
        month % 10,
        Math.floor(day / 10),
        day % 10,
    ];

    return dateNum;
}

function createMockSBTProof(options: Partial<SBTProof> = {}): SBTProof {
    const defaults: SBTProof = {
      nullifier: "0",
      revealedData_packed: ["115261408968607033031307466064449130912187328440927354228438530358556114000", "90441811083069593795566189778555936593460904044458972628079823996559114828", "80649680061362283084530183871589323447324161052952025077985585"],
      older_than: ["0", "0"],
      attestation_id: "42",
      merkle_root: "3371222684175752517807407619934459293988404217060542944534570329838598875982",
      scope: "1049",
      current_date: getDateNum(),
      user_identifier: "642829559307850963015472508762062935916233390536",
      a: ["1", "1"],
      b: [["1", "1"], ["1", "1"]],
      c: ["1", "1"]
    };
  
    return { ...defaults, ...options };
  }