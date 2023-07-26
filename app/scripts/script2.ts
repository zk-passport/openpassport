import * as crypto from 'crypto';

// On a la donnée de base :
const dg1File = {
  length: 91,
  mrzInfo: {
    compositeCheckDigit: '2',
    dateOfBirth: '000719',
    dateOfBirthCheckDigit: '1',
    dateOfExpiry: '291209',
    dateOfExpiryCheckDigit: '5',
    documentCode: 'P',
    documentNumber: '19HA34828',
    documentNumberCheckDigit: '4',
    documentType: 3,
    gender: 'MALE',
    issuingState: 'FRA',
    nationality: 'FRA',
    optionalData1: '<<<<<<<<<<<<<<0',
    primaryIdentifier: 'TAVERNIER',
    secondaryIdentifier: 'FLORENT<HUGUES<JEAN<<<<<<<<<',
  },
  tag: 97,
};
const mrzInfo = dg1File.mrzInfo;

// 'P<FRATAVERNIER<<FLORENT<HUGUES<JEAN<<<<<<<<<19HA348284FRA0007191M2912095<<<<<<<<<<<<<<02';
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

const dataHashes = {
  '1': [
    99, 19, -77, -51, 55, 104, 45, -42, -123, 101, -23, -79, -126, 1, 37, 89,
    125, -27, -117, 34, -124, -110, 28, 116, -8, -70, 63, -61, 96, -105, 26,
    -41,
  ],
  '2': [
    63, -22, 106, 78, 31, 16, 114, -119, -19, 17, 92, 71, -122, 47, 62, 78, -67,
    -23, -55, -43, 53, 4, 47, -67, -55, -123, 6, 121, 34, -125, 64, -114,
  ],
  '3': [
    -120, -101, 87, -112, 121, 15, -104, 127, 85, 25, -102, 80, 20, 58, 51, 75,
    -63, 116, -22, 0, 60, 30, 29, 30, -73, -115, 72, -9, -1, -53, 100, 124,
  ],
  '11': [
    0, -62, 104, 108, -19, -10, 97, -26, 116, -58, 69, 110, 26, 87, 17, 89, 110,
    -57, 108, -6, 36, 21, 39, 87, 110, 102, -6, -43, -82, -125, -85, -82,
  ],
  '12': [
    -66, 82, -76, -21, -34, 33, 79, 50, -104, -120, -114, 35, 116, -32, 6, -14,
    -100, -115, -128, -9, 10, 61, 98, 86, -8, 45, -49, -46, 90, -24, -81, 38,
  ],
  '13': [
    91, -34, -46, -63, 63, -34, 104, 82, 36, 41, -118, -3, 70, 15, -108, -48,
    -100, 45, 105, -85, -15, -61, -71, 43, -39, -94, -110, -55, -34, 89, -18,
    38,
  ],
  '14': [
    76, 123, -40, 13, 52, -29, 72, -11, 59, -63, -18, -90, 103, 49, 24, -92,
    -85, -68, -62, -59, -100, -69, -7, 28, -58, 95, 69, 15, -74, 56, 54, 38,
  ],
};

const contentBytes = [
  48, -126, 1, 37, 2, 1, 0, 48, 11, 6, 9, 96, -122, 72, 1, 101, 3, 4, 2, 1, 48,
  -126, 1, 17, 48, 37, 2, 1, 1, 4, 32, 99, 19, -77, -51, 55, 104, 45, -42, -123,
  101, -23, -79, -126, 1, 37, 89, 125, -27, -117, 34, -124, -110, 28, 116, -8,
  -70, 63, -61, 96, -105, 26, -41, 48, 37, 2, 1, 2, 4, 32, 63, -22, 106, 78, 31,
  16, 114, -119, -19, 17, 92, 71, -122, 47, 62, 78, -67, -23, -55, -43, 53, 4,
  47, -67, -55, -123, 6, 121, 34, -125, 64, -114, 48, 37, 2, 1, 3, 4, 32, -120,
  -101, 87, -112, 121, 15, -104, 127, 85, 25, -102, 80, 20, 58, 51, 75, -63,
  116, -22, 0, 60, 30, 29, 30, -73, -115, 72, -9, -1, -53, 100, 124, 48, 37, 2,
  1, 11, 4, 32, 0, -62, 104, 108, -19, -10, 97, -26, 116, -58, 69, 110, 26, 87,
  17, 89, 110, -57, 108, -6, 36, 21, 39, 87, 110, 102, -6, -43, -82, -125, -85,
  -82, 48, 37, 2, 1, 12, 4, 32, -66, 82, -76, -21, -34, 33, 79, 50, -104, -120,
  -114, 35, 116, -32, 6, -14, -100, -115, -128, -9, 10, 61, 98, 86, -8, 45, -49,
  -46, 90, -24, -81, 38, 48, 37, 2, 1, 13, 4, 32, 91, -34, -46, -63, 63, -34,
  104, 82, 36, 41, -118, -3, 70, 15, -108, -48, -100, 45, 105, -85, -15, -61,
  -71, 43, -39, -94, -110, -55, -34, 89, -18, 38, 48, 37, 2, 1, 14, 4, 32, 76,
  123, -40, 13, 52, -29, 72, -11, 59, -63, -18, -90, 103, 49, 24, -92, -85, -68,
  -62, -59, -100, -69, -7, 28, -58, 95, 69, 15, -74, 56, 54, 38,
];

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
