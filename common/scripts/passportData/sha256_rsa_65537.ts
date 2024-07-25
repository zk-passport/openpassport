import assert from "assert";
import { PassportData } from "../../src/utils/types";
import { hash, assembleEContent, formatAndConcatenateDataHashes, formatMrz, hexToDecimal, arraysAreEqual, findSubarrayIndex } from "../../src/utils/utils";
import * as forge from 'node-forge';
import { writeFileSync, readFileSync } from "fs";
import { mock_dsc_key_sha256_rsa_4096 } from "../../src/constants/mockCertificates";


const sampleMRZ = "P<FRADUPONT<<ALPHONSE<HUGUES<ALBERT<<<<<<<<<24HB818324FRA0402111M3111115A549102934<<<<02"
const sampleDataHashes = [
  [
    2,
    [-66, 82, -76, -21, -34, 33, 79, 50, -104, -120, -114, 35, 116, -32, 6, -14, -100, -115, -128, -8]
  ],
  [
    3,
    [0, -62, 104, 108, -19, -10, 97, -26, 116, -58, 69, 110, 26, 87, 17, 89, 110, -57, 108, -6]
  ],
  [
    11,
    [-120, -101, 87, -112, 111, 15, -104, 127, 85, 25, -102, 81, 20, 58, 51, 75, -63, 116, -22, 0, 60, 30, 29, 30, -73, -115, 72, -9, -1, -53, 100, 124]
  ],
  [
    12,
    [41, -22, 106, 78, 31, 11, 114, -119, -19, 17, 92, 71, -122, 47, 62, 78, -67, -23, -55, -42, 53, 4, 47, -67, -55, -123, 6, 121, 34, -125, 64, -114]
  ],
  [
    14,
    [76, 123, -40, 13, 51, -29, 72, -11, 59, -63, -18, -90, 103, 49, 23, -92, -85, -68, -62, -59]
  ]
] as [number, number[]][]
const signatureAlgorithm = 'sha256WithRSAEncryption'
const hashLen = 32

export function genMockPassportData_sha256WithRSAEncryption_65537(): PassportData {
  const mrzHash = hash(signatureAlgorithm, formatMrz(sampleMRZ));
  const concatenatedDataHashes = formatAndConcatenateDataHashes(
    [[1, mrzHash], ...sampleDataHashes],
    hashLen,
    31
  );

  const eContent = assembleEContent(hash(signatureAlgorithm, concatenatedDataHashes));

  const rsa = forge.pki.rsa;
  const privKey = rsa.generateKeyPair({ bits: 2048 }).privateKey;
  // const privKey = forge.pki.privateKeyFromPem(mock_dsc_key_sha256_rsa_4096);
  const modulus = privKey.n.toString(16);

  const md = forge.md.sha256.create();
  md.update(forge.util.binary.raw.encode(new Uint8Array(eContent)));

  const signature = privKey.sign(md)
  const signatureBytes = Array.from(signature, (c: string) => c.charCodeAt(0));

  return {
    mrz: sampleMRZ,
    signatureAlgorithm: signatureAlgorithm,
    pubKey: {
      modulus: hexToDecimal(modulus),
      exponent: '65537',
    },
    dataGroupHashes: concatenatedDataHashes,
    eContent: eContent,
    encryptedDigest: signatureBytes,
    photoBase64: "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABjElEQVR42mL8//8/AyUYiBQYmIw3..."
  }
}

function verify(passportData: PassportData): boolean {
  const { mrz, signatureAlgorithm, pubKey, dataGroupHashes, eContent, encryptedDigest } = passportData;
  const formattedMrz = formatMrz(mrz);
  const mrzHash = hash(signatureAlgorithm, formattedMrz);
  const dg1HashOffset = findSubarrayIndex(dataGroupHashes, mrzHash)
  console.log('dg1HashOffset', dg1HashOffset);
  assert(dg1HashOffset !== -1, 'MRZ hash index not found in dataGroupHashes');

  const concatHash = hash(signatureAlgorithm, dataGroupHashes)
  assert(
    arraysAreEqual(
      concatHash,
      eContent.slice(eContent.length - hashLen)
    ),
    'concatHash is not at the right place in eContent'
  );

  const modulus = new forge.jsbn.BigInteger(pubKey.modulus, 10);
  const exponent = new forge.jsbn.BigInteger(pubKey.exponent, 10);
  const rsaPublicKey = forge.pki.rsa.setPublicKey(modulus, exponent);

  const md = forge.md.sha256.create();
  md.update(forge.util.binary.raw.encode(new Uint8Array(eContent)));

  const signature = Buffer.from(encryptedDigest).toString(
    'binary',
  );

  return rsaPublicKey.verify(md.digest().bytes(), signature);
}

const mockPassportData = genMockPassportData_sha256WithRSAEncryption_65537();
console.log("Passport Data:", JSON.stringify(mockPassportData, null, 2));
console.log("Signature valid:", verify(mockPassportData));

writeFileSync(__dirname + '/passportData.json', JSON.stringify(mockPassportData, null, 2));