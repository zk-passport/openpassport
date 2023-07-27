import * as crypto from 'crypto';
import {
  arraysAreEqual,
  dataHashesObjToArray,
  formatMrz,
  assembleMrz,
  findTimeOfSignature,
  parsePubKeyString,
} from '../utils/utils';
import * as forge from 'node-forge';
import passportData from '../server/passportData.json';

// This script tests the whole flow from MRZ to signature
// The passportData is imported from passportData.json written by the server

const mrz = assembleMrz(passportData.mrzInfo);

console.log('mrz: ', mrz);

// Transforms the dataHashes object into an array of arrays
const dataHashesAsArray = dataHashesObjToArray(passportData.dataGroupHashes);

const formmattedMrz = formatMrz(mrz);

const hash = crypto.createHash('sha256');
hash.update(Buffer.from(formmattedMrz));
const mrzHash = Array.from(hash.digest()).map(x => (x < 128 ? x : x - 256));

console.log('mrzHash:', mrzHash);
console.log('dataHashesAsArray[0][1]:', dataHashesAsArray[0][1]);
console.log(
  'Are they equal ?',
  arraysAreEqual(mrzHash, dataHashesAsArray[0][1]),
);

// Let's replace the first array with the MRZ hash
dataHashesAsArray.shift();
dataHashesAsArray.unshift([1, mrzHash]);
// Concaténons les dataHashes :
const concatenatedDataHashes: number[] = [].concat(
  ...dataHashesAsArray.map((dataHash: any) => {
    dataHash[1].unshift(...[48, 37, 2, 1, dataHash[0], 4, 32]);
    return dataHash[1];
  }),
);

// Starting sequence. Should be the same for everybody, but not sure
concatenatedDataHashes.unshift(
  ...[
    48, -126, 1, 37, 2, 1, 0, 48, 11, 6, 9, 96, -122, 72, 1, 101, 3, 4, 2, 1,
    48, -126, 1, 17,
  ],
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

// please hash concatenatedDataHashes
const concatenatedDataHashesHash = crypto.createHash('sha256');
concatenatedDataHashesHash.update(Buffer.from(concatenatedDataHashes));
const concatenatedDataHashesHashDigest = Array.from(
  concatenatedDataHashesHash.digest(),
).map(x => (x < 128 ? x : x - 256));

// Now let's reconstruct the eContent

const constructedEContent = [];

// Detailed description is in private file r&d.ts for now
// First, the tag and length, assumed to be always the same
constructedEContent.push(...[49, 102]);

// 1.2.840.113549.1.9.3 is RFC_3369_CONTENT_TYPE_OID
constructedEContent.push(
  ...[48, 21, 6, 9, 42, -122, 72, -122, -9, 13, 1, 9, 3],
);
// 2.23.136.1.1.1 is ldsSecurityObject
constructedEContent.push(...[49, 8, 6, 6, 103, -127, 8, 1, 1, 1]);

// 1.2.840.113549.1.9.5 is signing-time
constructedEContent.push(
  ...[48, 28, 6, 9, 42, -122, 72, -122, -9, 13, 1, 9, 5],
);
// time of the signature
constructedEContent.push(
  ...findTimeOfSignature(passportData.eContentDecomposed),
);
// 1.2.840.113549.1.9.4 is RFC_3369_MESSAGE_DIGEST_OID
constructedEContent.push(
  ...[48, 47, 6, 9, 42, -122, 72, -122, -9, 13, 1, 9, 4],
);
// TAG and length of the message digest
constructedEContent.push(...[49, 34, 4, 32]);

constructedEContent.push(...concatenatedDataHashesHashDigest);

console.log('constructedEContent', constructedEContent);
console.log('passportData.eContent', passportData.eContent);
console.log(
  'Are they equal ?',
  arraysAreEqual(constructedEContent, passportData.eContent),
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
md.update(forge.util.binary.raw.encode(new Uint8Array(constructedEContent)));
const hashOfEContent = md.digest().getBytes();

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
