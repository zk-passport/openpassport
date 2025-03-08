import { ethers } from "ethers";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { RegisterVerifierId } from "../../common/src/constants/constants";

dotenv.config();

const identityVerificationHubAbiFile = fs.readFileSync(path.join(__dirname, "../ignition/deployments/chain-42220/artifacts/DeployHub#IdentityVerificationHubImplV1.json"), "utf-8");
const identityVerificationHubAbi = JSON.parse(identityVerificationHubAbiFile).abi;

const registerProof = {
    pi_a: ["8615379007983708039376022001963239271870407865915312307232447765192717699146", "10615975053480782972258212872348982336020594443471015478889839872744533273494", "1"],
    pi_b: [
        ["9319251587239099463235937641588887604546739337996672901955949927560605266181", "19746964671035836586117712040644820478992810792484246268290553800142061249481"],
        ["17252946549007078227003842202076749983058764742284176452974068122173605108322", "3611304225151244488480214284050630135431358807424637797111935396089197368122"],
        ["1", "0"]
    ],
    pi_c: ["16133385892204017405417405567139295969153697411362392668267240436161446232117", "20066069383047536907014750257411062166266882551042086680303242665821720847029", "1"],
    protocol: "groth16",
    pubSignals: [
        "17175256258089168743375784055508498022330990530537906858753745743412835607168",
        "12250217936044168031815820369012078352671345868443554697111115675743006691920", 
        "1288094306199660900295983276417237689651483177040742536650983773930384322800"
    ]
};

async function main() {
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    const wallet = new ethers.Wallet(process.env.CELO_KEY as string, provider);

    const hubAddress = "0x77117D60eaB7C044e785D68edB6C7E0e134970Ea"
    if (!hubAddress) {
        throw new Error("Hub address not found in deployed_addresses.json");
    }

    const identityVerificationHub = new ethers.Contract(
        hubAddress,
        identityVerificationHubAbi,
        wallet
    );

    const tx = await identityVerificationHub.registerPassportCommitment(
        RegisterVerifierId.register_sha256_sha256_sha256_rsapss_65537_32_2048,
        {
            a: [registerProof.pi_a[0], registerProof.pi_a[1]],
            b: [
                [registerProof.pi_b[0][0], registerProof.pi_b[0][1]],
                [registerProof.pi_b[1][0], registerProof.pi_b[1][1]],
            ],
            c: [registerProof.pi_c[0], registerProof.pi_c[1]],
            pubSignals: registerProof.pubSignals
        }
    );
    const receipt = await tx.wait();
    console.log("Registration tx hash:", receipt.hash);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});