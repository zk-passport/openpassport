import * as fs from 'fs';
import { computeLeafFromModulusBigInt } from '../../../common/src/utils/csca'
import { getPublicKey, isRsaPublicKey, readCertificate } from '../../../common/src/utils/certificates'
import { CSCA_TREE_DEPTH, DEVELOPMENT_MODE } from '../../../common/src/constants/constants';
import { IMT } from '@zk-kit/imt';
import { poseidon2 } from 'poseidon-lite';
import { writeFile } from 'fs/promises';
import * as path from 'path';
import jsrsasign from 'jsrsasign';

function processCertificate(certificate: jsrsasign.X509, filePath: string) {
    const validAlgorithms = [
        "SHA256withRSAandMGF1",
        "SHA256withRSA",
        "rsaPSS",
        "SHA1withRSA"
    ];

    const signatureAlgorithm = certificate.getSignatureAlgorithmField();

    if (!validAlgorithms.includes(signatureAlgorithm)) {
        console.log(`Skipping file ${filePath}: Unsupported signature algorithm ${signatureAlgorithm}`);
        return null;
    }

    const publicKey = getPublicKey(certificate);

    if (!isRsaPublicKey(publicKey)) {
        console.log(`Skipping file ${filePath}: Not an RSA or RSA-PSS key`);
        return null;
    }

    const keyLength = publicKey.n.bitLength();
    if (keyLength > 4096) {
        console.log(`Skipping file ${filePath}: Key length ${keyLength} bits exceeds 4096 bits`);
        return null;
    }

    const modulus = publicKey.n.toString(16);
    const modulus_bigint = BigInt(`0x${modulus}`);

    let n_csca, k_csca;
    console.log("keyLength: ", keyLength);
    if (keyLength === 2048) {
        n_csca = 64;
        k_csca = 32;
    }
    else {
        n_csca = 64;
        k_csca = 64;
    }

    console.log(`File: ${filePath}`);
    console.log(`Key Length: ${keyLength} bits`);
    console.log(`Modulus: ${modulus}`);
    console.log(`Key Type: ${publicKey.type}`);
    console.log(`Signature Algorithm: ${signatureAlgorithm}`);

    const finalPoseidonHash = computeLeafFromModulusBigInt(modulus_bigint);
    console.log(`Final Poseidon Hash: ${finalPoseidonHash}`);

    return finalPoseidonHash.toString();
}

async function buildCscaMerkleTree() {
    const tree = new IMT(poseidon2, CSCA_TREE_DEPTH, 0, 2);
    const path_to_pem_files = "outputs/unique_pem";
    const processedModuli = new Map<string, boolean>();

    for (const file of fs.readdirSync(path_to_pem_files)) {
        const file_path = path.join(path_to_pem_files, file);
        try {
            const { certificate, issuerCountry } = readCertificate(file_path);
            if (issuerCountry !== "FR") {
                tree.insert("0");
                continue;
            }

            const publicKey = getPublicKey(certificate);
            if (!isRsaPublicKey(publicKey)) {
                console.log(`Skipping file ${file_path}: Not an RSA or RSA-PSS key`);
                continue;
            }

            const modulus = publicKey.n.toString(16);

            if (processedModuli.has(modulus)) {
                // console.log(`Skipping file ${file_path}: Modulus already processed`);
                continue;
            }

            const leafValue = processCertificate(certificate, file_path);
            //console.log(`US cert: Leaf Value: ${leafValue}`);
            if (leafValue) {
                tree.insert(leafValue);
                processedModuli.set(modulus, true);
            } else {
                console.log(`Skipping file ${file_path}: Not a valid certificate`);
            }

        } catch (error) {
            console.error(`Error processing file ${file}:`, error);
        }
    }

    if (DEVELOPMENT_MODE) {
        const mockCscaList = [
            '../common/src/mock_certificates/sha256_rsa_4096/mock_csca.pem',
            '../common/src/mock_certificates/sha256_rsa_2048/mock_csca.pem',
            '../common/src/mock_certificates/sha256_rsapss_4096/mock_csca.pem',
            '../common/src/mock_certificates/sha256_rsapss_2048/mock_csca.pem',
            '../common/src/mock_certificates/sha1_rsa_4096/mock_csca.crt',
            '../common/src/mock_certificates/sha1_rsa_2048/mock_csca.crt'
        ];

        for (const mockCscaFile of mockCscaList) {
            try {
                const certPem = fs.readFileSync(mockCscaFile, 'utf8');
                const certificate = new jsrsasign.X509();
                certificate.readCertPEM(certPem);
                const leafValue = processCertificate(certificate, mockCscaFile);
                if (leafValue) {
                    tree.insert(leafValue);
                }
            } catch (error) {
                console.error(`Error processing mock file ${mockCscaFile}:`, error);
            }
        }
    }

    return tree;
}

async function serializeCscaTree(tree: IMT) {
    const serializedTree = tree.nodes.map(layer => layer.map(node => node.toString()));
    await writeFile("outputs/serialized_csca_tree.json", JSON.stringify(serializedTree));
    fs.copyFileSync("outputs/serialized_csca_tree.json", "../common/pubkeys/serialized_csca_tree.json");
    console.log("serialized_csca_tree.json written and copied in common/pubkeys!");
}

async function main() {
    const tree = await buildCscaMerkleTree();
    console.log("\x1b[32m%s\x1b[0m", "Final tree root: ", tree.root.toString());
    await serializeCscaTree(tree);
}

main();