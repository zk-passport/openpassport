import * as crypto from 'crypto';
import {
  arraysAreEqual,
  dataHashesObjToArray,
  formatMrz,
  assembleMrz,
  findTimeOfSignature,
  parsePubKeyString,
  formatAndConcatenateDataHashes,
  assembleEContent,
} from '../utils/utils';
import * as forge from 'node-forge';
import passportData from '../server/passportData.json';
import {DataHash} from '../types/passportData';

// This script tests the whole flow from MRZ to signature
// The passportData is imported from passportData.json written by the server

const mrz = assembleMrz(passportData.mrzInfo);

console.log('mrz: ', mrz);

// Transforms the dataHashes object into an array of arrays
const dataHashes = passportData.dataGroupHashes as DataHash[];

const mrzHash = hash(formatMrz(mrz));

console.log('mrzHash:', mrzHash);
console.log('dataHashes[0][1]:', dataHashes[0][1]);
console.log(
  'Are they equal ?',
  arraysAreEqual(mrzHash, dataHashes[0][1] as number[]),
);

const concatenatedDataHashes = formatAndConcatenateDataHashes(
  mrzHash,
  dataHashes,
);

console.log('concatenatedDataHashes', concatenatedDataHashes);
console.log(
  'passportData.contentBytes.content.string',
  passportData.contentBytes.content.string,
);
console.log(
  'Are they equal ?',
  arraysAreEqual(
    concatenatedDataHashes,
    passportData.contentBytes.content.string,
  ),
);

const concatenatedDataHashesHashDigest = hash(concatenatedDataHashes);

const timeOfSignature = findTimeOfSignature(passportData.eContentDecomposed);

const eContent = assembleEContent(
  concatenatedDataHashesHashDigest,
  timeOfSignature,
);

console.log('eContent reconstructed', eContent);
console.log('passportData.eContent', passportData.eContent);
console.log(
  'Are they equal ?',
  arraysAreEqual(eContent, passportData.eContent),
);

// now let's verify the signature
const {modulus, exponent} = parsePubKeyString(passportData.publicKey);
// Create the public key
const rsa = forge.pki.rsa;
const publicKey = rsa.setPublicKey(
  new forge.jsbn.BigInteger(modulus, 16),
  new forge.jsbn.BigInteger(exponent, 16),
);

// SHA-256 hash of the eContent
const md = forge.md.sha256.create();
md.update(forge.util.binary.raw.encode(new Uint8Array(eContent)));
const hashOfEContent = md.digest().getBytes();

console.log('modulus', hexToDecimal(modulus));
console.log('eContent', bytesToBigDecimal(passportData.eContent));
console.log('signature', bytesToBigDecimal(passportData.encryptedDigest));
// Convert the hash to a single decimal number

const hashBigNumber = BigInt('0x' + forge.util.bytesToHex(hashOfEContent));

console.log('hashOfEContent in big decimal', hashBigNumber.toString());

// Signature verification
const signatureBytes = Buffer.from(passportData.encryptedDigest).toString(
  'binary',
);
const valid = publicKey.verify(hashOfEContent, signatureBytes);

if (valid) {
  console.log('The signature is valid.');
} else {
  console.log('The signature is not valid.');
}

function hash(bytesArray: number[]): number[] {
  const hash = crypto.createHash('sha256');
  hash.update(Buffer.from(bytesArray));
  return Array.from(hash.digest()).map(x => (x < 128 ? x : x - 256));
}

function bytesToBigDecimal(arr: number[]): string {
  let result = BigInt(0);
  for (let i = 0; i < arr.length; i++) {
    result = result * BigInt(256) + BigInt(arr[i] & 0xff);
  }
  return result.toString();
}

function hexToDecimal(hex: string): string {
  return BigInt(`0x${hex}`).toString();
}
