import * as crypto from 'crypto';
import {
  dg1File,
  dataHashes,
  contentBytes,
  eContent,
  modulusHex,
  exponentHex,
  encryptedDigest,
} from './env';
import {toUnsigned, arraysAreEqual} from './utils';
import * as forge from 'node-forge';

const mrzInfo = dg1File.mrzInfo;

const mrz =
  mrzInfo.documentCode +
  '<' +
  mrzInfo.issuingState +
  mrzInfo.primaryIdentifier +
  '<<' +
  mrzInfo.secondaryIdentifier +
  mrzInfo.documentNumber +
  mrzInfo.documentNumberCheckDigit +
  mrzInfo.nationality +
  mrzInfo.dateOfBirth +
  mrzInfo.dateOfBirthCheckDigit +
  mrzInfo.gender.substring(0, 1) +
  mrzInfo.dateOfExpiry +
  mrzInfo.dateOfExpiryCheckDigit +
  mrzInfo.optionalData1 +
  mrzInfo.compositeCheckDigit;

// Transforms the dataHashes object into an array of arrays
const dataHashesAsArray = Object.keys(dataHashes)
  .map(key => {
    const dataHash = dataHashes[key as keyof typeof dataHashes];
    return [Number(key), dataHash];
  })
  .sort((a, b) => (a[0] as number) - (b[0] as number));

console.log('dataHashesAsArray:', dataHashesAsArray);

console.log('mrz: ', mrz);

const mrzCharcodes = [...mrz].map(char => char.charCodeAt(0));

console.log('mrzCharcodes:', mrzCharcodes);

mrzCharcodes.unshift(88); // the length of the mrz data
mrzCharcodes.unshift(95, 31); // the MRZ_INFO_TAG
mrzCharcodes.unshift(91); // the new length of the whole array
mrzCharcodes.unshift(97); // the tag for DG1

console.log('mrzCharcodes with tags:', mrzCharcodes);

const hash = crypto.createHash('sha256');
hash.update(Buffer.from(mrzCharcodes));
const mrzHash = Array.from(hash.digest()).map(x => (x < 128 ? x : x - 256));

// Ça correspond bien :
console.log('mrzHash:', mrzHash);
console.log('dataHashes["1"]:', dataHashes['1']);
console.log('Are they equal ?', arraysAreEqual(mrzHash, dataHashes['1']));

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

// They are equal !
console.log('concatenatedDataHashes', concatenatedDataHashes);
console.log('contentBytes', contentBytes);
console.log(
  'Are they equal ?',
  arraysAreEqual(concatenatedDataHashes, contentBytes),
);

// please hash concatenatedDataHashes
const concatenatedDataHashesHash = crypto.createHash('sha256');
concatenatedDataHashesHash.update(Buffer.from(concatenatedDataHashes));
const concatenatedDataHashesHashDigest = Array.from(
  concatenatedDataHashesHash.digest(),
).map(x => (x < 128 ? x : x - 256));

// Now let's reconstruct the eContent

const constructedEContent = [];

// 191216172238Z : 16th December 2019, 17:22:38 UTC
const timeOfSignature = [
  49, 15, 23, 13, 49, 57, 49, 50, 49, 54, 49, 55, 50, 50, 51, 56, 90,
];

// Detailed description is in private file r&d.ts for now
// First, the tag and length, assumed to be always the same
constructedEContent.push(...[49, 102]);

// 1.2.840.113549.1.9.3 is RFC_3369_CONTENT_TYPE_OID
constructedEContent.push(...[48, 21, 6, 9, 42, 134, 72, 134, 247, 13, 1, 9, 3]);
// 2.23.136.1.1.1 is ldsSecurityObject
constructedEContent.push(...[49, 8, 6, 6, 103, 129, 8, 1, 1, 1]);

// 1.2.840.113549.1.9.5 is signing-time
constructedEContent.push(...[48, 28, 6, 9, 42, 134, 72, 134, 247, 13, 1, 9, 5]);
// time of the signature
constructedEContent.push(...timeOfSignature);
// 1.2.840.113549.1.9.4 is RFC_3369_MESSAGE_DIGEST_OID
constructedEContent.push(...[48, 47, 6, 9, 42, 134, 72, 134, 247, 13, 1, 9, 4]);
// TAG and length of the message digest
constructedEContent.push(...[49, 34, 4, 32]);

constructedEContent.push(
  ...concatenatedDataHashesHashDigest.map((byte: number) => toUnsigned(byte)),
);

console.log('constructedEContent', constructedEContent);
console.log('eContent', eContent);
console.log('Are they equal ?', arraysAreEqual(constructedEContent, eContent));

// now let's verify the signature

// Create the public key
const rsa = forge.pki.rsa;
const publicKey = rsa.setPublicKey(
  new forge.jsbn.BigInteger(modulusHex, 16),
  new forge.jsbn.BigInteger(exponentHex, 16),
);

// SHA-256 hash of the eContent
const md = forge.md.sha256.create();
md.update(forge.util.binary.raw.encode(new Uint8Array(constructedEContent)));
const hashOfEContent = md.digest().getBytes();

// Signature verification
const signatureBytes = encryptedDigest.toString('binary');
const valid = publicKey.verify(hashOfEContent, signatureBytes);

if (valid) {
  console.log('The signature is valid.');
} else {
  console.log('The signature is not valid.');
}
