const CYAN = '\x1b[36m';
const YELLOW = '\x1b[33m';
const GREEN = '\x1b[32m';
const RESET = '\x1b[0m';

import {ethers} from "hardhat";
import {BigNumberish} from "ethers";
import {expect} from "chai";
import {Contract, Signer} from "ethers";
import {groth16} from "snarkjs";
import fs from 'fs';
import {loadFixture} from "@nomicfoundation/hardhat-network-helpers";
import { SMT } from "@openpassport/zk-kit-smt";
import { poseidon2 } from "poseidon-lite";

// Common imports
import nameSMT from "../../../common/ofacdata/outputs/nameSMT.json";
import { PassportData } from "../../../common/src/utils/types";
import { genMockPassportData } from "../../../common/src/utils/genMockPassportData";
import { 
    generateCircuitInputsRegister,
    generateCircuitInputsDisclose
} from "../../../common/src/utils/generateInputs";
import {
    generateCircuitInputsDSC
} from "../../../common/src/utils/csca";
import {
    generateDscSecret,
    getCSCAModulusMerkleTree
} from "../../../common/src/utils/csca";
import { 
    RegisterVerifierId,
    DscVerifierId
} from "../../../common/src/constants/constants";
import type { 
    IIdentityVerificationHubV1,
    IRegisterCircuitVerifier,
    IDscCircuitVerifier
} from "../../typechain-types/contracts/IdentityVerificationHubImplV1";
type PassportProof = IIdentityVerificationHubV1.PassportProofStruct;
type RegisterCircuitProof = IRegisterCircuitVerifier.RegisterCircuitProofStruct;
type DscCircuitProof = IDscCircuitVerifier.DscCircuitProofStruct;

import type { CircuitSignals } from "snarkjs";
import type { 
    PublicSignals,
    Groth16Proof
} from "snarkjs";

// Contract imports
import {
    IdentityVerificationHub,
    IdentityVerificationHubImplV1,
    IdentityRegistry,
    IdentityRegistryImplV1,
    Verifier_vc_and_disclose,
    Verifier_register_rsa_65537_sha256,
    Verifier_dsc_rsa_sha256_65537_4096,
} from "../../typechain-types";

import type { Verifier_vc_and_disclose as ProdVerifier } from "../../typechain-types/contracts/verifiers/disclose/Verifier_vc_and_disclose";
import type { Verifier_vc_and_disclose as LocalVerifier } from "../../typechain-types/contracts/verifiers/local/disclose/Verifier_vc_and_disclose";
import type { Verifier_register_rsa_65537_sha256 as ProdRegisterVerifier } from "../../typechain-types/contracts/verifiers/register/Verifier_register_rsa_65537_sha256";
import type { Verifier_register_sha256_sha256_sha256_rsa_65537_4096 as LocalRegisterVerifier } from "../../typechain-types/contracts/verifiers/local/register/Verifier_register_sha256_sha256_sha256_rsa_65537_4096";
import type { Verifier_dsc_rsa_65537_sha256_4096 as ProdDscVerifier } from "../../typechain-types/contracts/verifiers/dsc/Verifier_dsc_rsa_65537_sha256_4096";
import type { Verifier_dsc_rsa_sha256_65537_4096 as LocalDscVerifier } from "../../typechain-types/contracts/verifiers/local/dsc/Verifier_dsc_rsa_sha256_65537_4096";

import VcAndDiscloseVerifierArtifactLocal from "../../artifacts/contracts/verifiers/local/disclose/Verifier_vc_and_disclose.sol/Verifier_vc_and_disclose.json";
import VcAndDiscloseVerifierArtifactProd from "../../artifacts/contracts/verifiers/disclose/Verifier_vc_and_disclose.sol/Verifier_vc_and_disclose.json";
import RegisterVerifierArtifactLocal from "../../artifacts/contracts/verifiers/local/register/Verifier_register_sha256_sha256_sha256_rsa_65537_4096.sol/Verifier_register_sha256_sha256_sha256_rsa_65537_4096.json";
import RegisterVerifierArtifactProd from "../../artifacts/contracts/verifiers/register/Verifier_register_rsa_65537_sha256.sol/Verifier_register_rsa_65537_sha256.json";
import DscVerifierArtifactLocal from "../../artifacts/contracts/verifiers/local/dsc/Verifier_dsc_rsa_sha256_65537_4096.sol/Verifier_dsc_rsa_sha256_65537_4096.json";
import DscVerifierArtifactProd from "../../artifacts/contracts/verifiers/dsc/Verifier_dsc_rsa_65537_sha256_4096.sol/Verifier_dsc_rsa_65537_sha256_4096.json";

type VcAndDiscloseVerifier = typeof process.env.TEST_ENV extends "local" ? LocalVerifier : ProdVerifier;
type RegisterVerifier = typeof process.env.TEST_ENV extends "local" ? LocalRegisterVerifier : ProdRegisterVerifier;
type DscVerifier = typeof process.env.TEST_ENV extends "local" ? LocalDscVerifier : ProdDscVerifier;

interface DeployedActors {
    hub: IdentityVerificationHubImplV1;
    registry: IdentityRegistryImplV1;
    vcAndDisclose: VcAndDiscloseVerifier;
    register: RegisterVerifier;
    dsc: DscVerifier;
    owner: Signer;
    user1: Signer;
    mockPassport: PassportData;
}

type CircuitArtifacts = {
    [key: string]: {
        wasm: string,
        zkey: string,
        vkey: string,
        verifier?: any,
        inputs?: any,
        parsedCallData?: any,
        formattedCallData?: any,
    }
}
const registerCircuits: CircuitArtifacts = {
    "register_sha256_sha256_sha256_rsa_65537_4096": {
        wasm: "../circuits/build/register/register_sha256_sha256_sha256_rsa_65537_4096/register_sha256_sha256_sha256_rsa_65537_4096_js/register_sha256_sha256_sha256_rsa_65537_4096.wasm",
        zkey: "../circuits/build/register/register_sha256_sha256_sha256_rsa_65537_4096/register_sha256_sha256_sha256_rsa_65537_4096_final.zkey",
        vkey: "../circuits/build/register/register_sha256_sha256_sha256_rsa_65537_4096/register_sha256_sha256_sha256_rsa_65537_4096_vkey.json"
    }
};
const dscCircuits: CircuitArtifacts = {
    "dsc_sha256_sha256_sha256_rsa_65537_4096": {
        wasm: "../circuits/build/dsc/dsc_rsa_sha256_65537_4096/dsc_rsa_sha256_65537_4096_js/dsc_rsa_sha256_65537_4096.wasm",
        zkey: "../circuits/build/dsc/dsc_rsa_sha256_65537_4096/dsc_rsa_sha256_65537_4096_final.zkey",
        vkey: "../circuits/build/dsc/dsc_rsa_sha256_65537_4096/dsc_rsa_sha256_65537_4096_vkey.json"
    }
};
const vcAndDiscloseCircuits: CircuitArtifacts = {
    "vc_and_disclose": {
        wasm: "../circuits/build/disclose/vc_and_disclose/vc_and_disclose_js/vc_and_disclose.wasm",
        zkey: "../circuits/build/disclose/vc_and_disclose/vc_and_disclose_final.zkey",
        vkey: "../circuits/build/disclose/vc_and_disclose/vc_and_disclose_vkey.json"
    }
}

describe("Test passport commitment register", async function () {
    this.timeout(0);

    let deployedActors: DeployedActors;

    before(async () => {
        deployedActors = await deploySystemFixtures();
    });

    describe("Contract Initialization", async () => {
        it("should deploy and initialize correctly", async () => {
            const {hub, registry, vcAndDisclose, register, dsc, owner, user1, mockPassport} = deployedActors;
    
            const hubAddress = await registry.getHubAddress();
            expect(hubAddress).to.equal(hub.target);
    
            const registryAddress = await hub.getRegistryAddress();
            expect(registryAddress).to.equal(registry.target);
    
            expect(await hub.owner()).to.equal(await owner.getAddress());
            expect(await registry.owner()).to.equal(await owner.getAddress());
        });
    });

    describe("Identity Commitment Registration", async () => {
        it ("should register a new identity commitment", async () => {
            const {hub, registry, vcAndDisclose, register, dsc, owner, user1, mockPassport} = deployedActors;

            const registerSecret = "1234567890";
            const dscSecret = generateDscSecret();

            const registerProof = await generateRegisterProof(
                registerSecret,
                dscSecret,
                mockPassport
            );

            const dscProof = await generateDscProof(
                dscSecret,
                mockPassport.dsc,
                1664,
            );

            const passportProof: PassportProof = {
                registerCircuitVerifierId: RegisterVerifierId.register_sha256_sha256_sha256_rsa_65537_4096,
                dscCircuitVerifierId: DscVerifierId.dsc_rsa_sha256_65537_4096,
                registerCircuitProof: registerProof,
                dscCircuitProof: dscProof
            };

            const previousRoot = await registry.getIdentityCommitmentMerkleRoot();
            console.log(YELLOW, "Previous root: ", previousRoot, RESET);
            const tx = await hub.verifyAndRegisterPassportCommitment(passportProof);
            const receipt = await tx.wait();

            // const commitmentRegisteredEvent = receipt?.logs.find(
            //     log => {
            //         try {
            //             return registry.interface.parseLog(log as any)?.name === "CommitmentRegistered";
            //         } catch (error) {
            //             return false;
            //         }
            //     }
            // );

            // const commitmentRegisteredEventData = registry.interface.parseLog(commitmentRegisteredEvent as any);
            // if (commitmentRegisteredEventData) {
            //     const parsedLog = registry.interface.parseLog(commitmentRegisteredEvent as any);
            //     expect(parsedLog?.args.attestationId).to.not.be.undefined;
            //     expect(parsedLog?.args.nullifier).to.not.be.undefined;
            //     expect(parsedLog?.args.commitment).to.not.be.undefined;
            //     expect(parsedLog?.args.timestamp).to.not.be.undefined;
            //     expect(parsedLog?.args.imt_root).to.not.be.undefined;
            //     expect(parsedLog?.args.index).to.not.be.undefined;
            // }

            const currentRoot = await registry.getIdentityCommitmentMerkleRoot();
            expect(currentRoot).to.not.equal(previousRoot);

        });
    });
});

async function generateRegisterProof(
    secret: number | string,
    dscSecret: number | string,
    passportData: PassportData
): Promise<RegisterCircuitProof> {
    console.log(CYAN, "=== Start generateRegisterProof ===", RESET);
    
    // Get the circuit inputs
    const registerCircuitInputs: CircuitSignals = generateCircuitInputsRegister(
        secret,
        dscSecret,
        passportData
    );

    // Generate the proof
    const startTime = performance.now();
    
    const registerProof: {
        proof: Groth16Proof,
        publicSignals: PublicSignals
    } = await groth16.fullProve(
        registerCircuitInputs,
        registerCircuits["register_sha256_sha256_sha256_rsa_65537_4096"].wasm,
        registerCircuits["register_sha256_sha256_sha256_rsa_65537_4096"].zkey
    );
    
    const endTime = performance.now();
    console.log(GREEN, `groth16.fullProve execution time: ${((endTime - startTime) / 1000).toFixed(2)} seconds`, RESET);

    // Verify the proof
    const vKey = JSON.parse(fs.readFileSync(registerCircuits["register_sha256_sha256_sha256_rsa_65537_4096"].vkey, 'utf8'));
    const isValid = await groth16.verify(vKey, registerProof.publicSignals, registerProof.proof);
    if (!isValid) {
        throw new Error("Generated register proof verification failed");
    }
    console.log(GREEN, "Register proof verified successfully", RESET);

    const rawCallData = await groth16.exportSolidityCallData(registerProof.proof, registerProof.publicSignals);
    const fixedProof = parseSolidityCalldata(rawCallData, {} as RegisterCircuitProof);

    console.log(CYAN, "=== End generateRegisterProof ===", RESET);
    return fixedProof;
}

async function generateDscProof(
    dscSecret: string,
    dscCertificate: any,
    maxCertBytes: number,
): Promise<DscCircuitProof> {
    console.log(CYAN, "=== Start generateDscProof ===", RESET);

    const dscCircuitInputs: CircuitSignals = generateCircuitInputsDSC(
        dscSecret,
        dscCertificate,
        maxCertBytes,
        true
    ).inputs;

    const startTime = performance.now();
    const dscProof = await groth16.fullProve(
        dscCircuitInputs,
        dscCircuits["dsc_sha256_sha256_sha256_rsa_65537_4096"].wasm,
        dscCircuits["dsc_sha256_sha256_sha256_rsa_65537_4096"].zkey
    );
    const endTime = performance.now();
    console.log(GREEN, `groth16.fullProve execution time: ${((endTime - startTime) / 1000).toFixed(2)} seconds`, RESET);

    // Verify the proof
    const vKey = JSON.parse(fs.readFileSync(dscCircuits["dsc_sha256_sha256_sha256_rsa_65537_4096"].vkey, 'utf8'));
    const isValid = await groth16.verify(vKey, dscProof.publicSignals, dscProof.proof);
    if (!isValid) {
        throw new Error("Generated DSC proof verification failed");
    }
    console.log(GREEN, "DSC proof verified successfully", RESET);

    const rawCallData = await groth16.exportSolidityCallData(dscProof.proof, dscProof.publicSignals);
    const fixedProof = parseSolidityCalldata(rawCallData, {} as DscCircuitProof);

    console.log(CYAN, "=== End generateDscProof ===", RESET);
    return fixedProof;
}

async function deploySystemFixtures() {
    let identityVerificationHubProxy: IdentityVerificationHub;
    let identityVerificationHubImpl: IdentityVerificationHubImplV1;

    let identityRegistryProxy: IdentityRegistry;
    let identityRegistryImpl: IdentityRegistryImplV1;

    let vcAndDiscloseVerifier: VcAndDiscloseVerifier;
    let registerVerifier: RegisterVerifier;
    let dscVerifier: DscVerifier;

    let owner: Signer;
    let user1: Signer;

    let mockPassport: PassportData;

    [owner, user1] = await ethers.getSigners();

    mockPassport = genMockPassportData(
        "sha256",
        "sha256",
        "rsa_sha256_65537_2048",
        "FRA",
        "940131",
        "401031"
    );

    // Deploy verifiers
    // Deploy vc and disclose verifier
    const vcAndDiscloseVerifierArtifact = process.env.TEST_ENV === "local" 
      ? VcAndDiscloseVerifierArtifactLocal 
      : VcAndDiscloseVerifierArtifactProd;
    const vcAndDiscloseVerifierFactory = await ethers.getContractFactory(
        vcAndDiscloseVerifierArtifact.abi,
        vcAndDiscloseVerifierArtifact.bytecode,
        owner
    );
    vcAndDiscloseVerifier = await vcAndDiscloseVerifierFactory.deploy();
    await vcAndDiscloseVerifier.waitForDeployment();

    // Deploy register verifier
    const registerVerifierArtifact = process.env.TEST_ENV === "local" 
      ? RegisterVerifierArtifactLocal 
      : RegisterVerifierArtifactProd;
    const registerVerifierFactory = await ethers.getContractFactory(
        registerVerifierArtifact.abi,
        registerVerifierArtifact.bytecode,
        owner
    );
    registerVerifier = await registerVerifierFactory.deploy();
    await registerVerifier.waitForDeployment();

    // Deploy dsc verifier
    const dscVerifierArtifact = process.env.TEST_ENV === "local" 
      ? DscVerifierArtifactLocal 
      : DscVerifierArtifactProd;
    const dscVerifierFactory = await ethers.getContractFactory(
        dscVerifierArtifact.abi,
        dscVerifierArtifact.bytecode,
        owner
    );
    dscVerifier = await dscVerifierFactory.deploy();
    await dscVerifier.waitForDeployment();

    // Deploy implementation contracts

    // Deploy PoseidonT3
    const PoseidonT3Factory = await ethers.getContractFactory("PoseidonT3", owner);
    const poseidonT3 = await PoseidonT3Factory.deploy();
    await poseidonT3.waitForDeployment();
    
    // Deploy IdentityRegistryImplV1
    const IdentityRegistryImplFactory = await ethers.getContractFactory("IdentityRegistryImplV1", 
        {
            libraries: {
                PoseidonT3: poseidonT3.target
            }
        },
        owner);
    identityRegistryImpl = await IdentityRegistryImplFactory.deploy();
    await identityRegistryImpl.waitForDeployment();

    // Deploy IdentityVerificationHubImplV1
    const IdentityVerificationHubImplFactory = await ethers.getContractFactory("IdentityVerificationHubImplV1", owner);
    identityVerificationHubImpl = await IdentityVerificationHubImplFactory.deploy();
    await identityVerificationHubImpl.waitForDeployment();

    // Deplo registry with mocked hub address
    const temporaryHubAddress = "0x0000000000000000000000000000000000000000";
    const registryInitData = identityRegistryImpl.interface.encodeFunctionData("initialize", [
      temporaryHubAddress
    ]);
    const registryProxyFactory = await ethers.getContractFactory("IdentityRegistry", owner);
    identityRegistryProxy = await registryProxyFactory.deploy(identityRegistryImpl.target, registryInitData);
    await identityRegistryProxy.waitForDeployment();

    // Deploy hub with deployed registry and verifiers
    const initializeData = identityVerificationHubImpl.interface.encodeFunctionData("initialize", [
        identityRegistryProxy.target,
        vcAndDiscloseVerifier.target,
        [RegisterVerifierId.register_sha256_sha256_sha256_rsa_65537_4096],
        [registerVerifier.target],
        [DscVerifierId.dsc_rsa_sha256_65537_4096],
        [dscVerifier.target]
    ]);
    const hubFactory = await ethers.getContractFactory("IdentityVerificationHub", owner);
    identityVerificationHubProxy = await hubFactory.deploy(identityVerificationHubImpl.target, initializeData);
    await identityVerificationHubProxy.waitForDeployment();

    // Get registry and hub contracts with impl abi
    // Update hub address in registry
    const registryContract = await ethers.getContractAt(
        "IdentityRegistryImplV1", 
        identityRegistryProxy.target
    ) as IdentityRegistryImplV1;
    await registryContract.updateHub(identityVerificationHubProxy.target);

    const hubContract = await ethers.getContractAt(
        "IdentityVerificationHubImplV1",
        identityVerificationHubProxy.target
    ) as IdentityVerificationHubImplV1;

    const cscaModulusMerkleTree = getCSCAModulusMerkleTree();
    await registryContract.updateCscaRoot(cscaModulusMerkleTree.root, {from: owner});

    const nameSMT = new SMT(poseidon2, true);
    nameSMT.import(nameSMT.export());
    await registryContract.updateOfacRoot(nameSMT.root, {from: owner});

    return {
        hub: hubContract,
        registry: registryContract,
        vcAndDisclose: vcAndDiscloseVerifier,
        register: registerVerifier,
        dsc: dscVerifier,
        owner: owner,
        user1: user1,
        mockPassport: mockPassport
    }
}

function parseSolidityCalldata<T>(rawCallData: string, _type: T): T {
    const parsed = JSON.parse("[" + rawCallData + "]");
    
    return {
        a: parsed[0].map((x: string) => x.replace(/"/g, '')) as [BigNumberish, BigNumberish],
        b: parsed[1].map((arr: string[]) => 
            arr.map((x: string) => x.replace(/"/g, ''))
        ) as [[BigNumberish, BigNumberish], [BigNumberish, BigNumberish]],
        c: parsed[2].map((x: string) => x.replace(/"/g, '')) as [BigNumberish, BigNumberish],
        pubSignals: parsed[3].map((x: string) => x.replace(/"/g, '')) as BigNumberish[]
    } as T;
}