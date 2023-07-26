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
const dataHash = hash.digest('hex');

console.log('dataHash:', dataHash);
// C'est bien dataHashes["1"]

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

const dataHashesAsArray = [
  [
    99, 19, -77, -51, 55, 104, 45, -42, -123, 101, -23, -79, -126, 1, 37, 89,
    125, -27, -117, 34, -124, -110, 28, 116, -8, -70, 63, -61, 96, -105, 26,
    -41,
  ],
  [
    63, -22, 106, 78, 31, 16, 114, -119, -19, 17, 92, 71, -122, 47, 62, 78, -67,
    -23, -55, -43, 53, 4, 47, -67, -55, -123, 6, 121, 34, -125, 64, -114,
  ],
  [
    -120, -101, 87, -112, 121, 15, -104, 127, 85, 25, -102, 80, 20, 58, 51, 75,
    -63, 116, -22, 0, 60, 30, 29, 30, -73, -115, 72, -9, -1, -53, 100, 124,
  ],
  [
    0, -62, 104, 108, -19, -10, 97, -26, 116, -58, 69, 110, 26, 87, 17, 89, 110,
    -57, 108, -6, 36, 21, 39, 87, 110, 102, -6, -43, -82, -125, -85, -82,
  ],
  [
    -66, 82, -76, -21, -34, 33, 79, 50, -104, -120, -114, 35, 116, -32, 6, -14,
    -100, -115, -128, -9, 10, 61, 98, 86, -8, 45, -49, -46, 90, -24, -81, 38,
  ],
  [
    91, -34, -46, -63, 63, -34, 104, 82, 36, 41, -118, -3, 70, 15, -108, -48,
    -100, 45, 105, -85, -15, -61, -71, 43, -39, -94, -110, -55, -34, 89, -18,
    38,
  ],
  [
    76, 123, -40, 13, 52, -29, 72, -11, 59, -63, -18, -90, 103, 49, 24, -92,
    -85, -68, -62, -59, -100, -69, -7, 28, -58, 95, 69, 15, -74, 56, 54, 38,
  ],
];

function concatenateHashes(hashes: Buffer[]): Buffer {
  return Buffer.concat(hashes);
}
function hashData(data: Buffer): string {
  const hash = crypto.createHash('sha256');
  hash.update(data);
  // return new Uint8Array(hash.digest().buffer);
  return hash.digest('hex');
}

console.log(
  'concatenateHashes(dataHashes) hash:',
  hashData(concatenateHashes(dataHashesAsArray.map(hash => Buffer.from(hash)))),
);

// const concat = [
//   99, 19, -77, -51, 55, 104, 45, -42, -123, 101, -23, -79, -126, 1, 37, 89, 125,
//   -27, -117, 34, -124, -110, 28, 116, -8, -70, 63, -61, 96, -105, 26, -41, 63,
//   -22, 106, 78, 31, 16, 114, -119, -19, 17, 92, 71, -122, 47, 62, 78, -67, -23,
//   -55, -43, 53, 4, 47, -67, -55, -123, 6, 121, 34, -125, 64, -114, -120, -101,
//   87, -112, 121, 15, -104, 127, 85, 25, -102, 80, 20, 58, 51, 75, -63, 116, -22,
//   0, 60, 30, 29, 30, -73, -115, 72, -9, -1, -53, 100, 124, 0, -62, 104, 108,
//   -19, -10, 97, -26, 116, -58, 69, 110, 26, 87, 17, 89, 110, -57, 108, -6, 36,
//   21, 39, 87, 110, 102, -6, -43, -82, -125, -85, -82, -66, 82, -76, -21, -34,
//   33, 79, 50, -104, -120, -114, 35, 116, -32, 6, -14, -100, -115, -128, -9, 10,
//   61, 98, 86, -8, 45, -49, -46, 90, -24, -81, 38, 91, -34, -46, -63, 63, -34,
//   104, 82, 36, 41, -118, -3, 70, 15, -108, -48, -100, 45, 105, -85, -15, -61,
//   -71, 43, -39, -94, -110, -55, -34, 89, -18, 38, 76, 123, -40, 13, 52, -29, 72,
//   -11, 59, -63, -18, -90, 103, 49, 24, -92, -85, -68, -62, -59, -100, -69, -7,
//   28, -58, 95, 69, 15, -74, 56, 54, 38,
// ];

// const concatHash = crypto.createHash('sha256');
// concatHash.update(Buffer.from(concat));
// const concatHashBytes = new Uint8Array(concatHash.digest().buffer);

// console.log('concatHashBytes:', concatHashBytes);

const messageDigest = [
  -80, 96, 59, -43, -125, 82, 89, -8, 105, 125, 37, -79, -98, -94, -119, 43, 13,
  39, 115, 6, 59, -27, 81, 110, 49, 75, -1, -72, -101, 73, 116, 86,
];

// console.log('messageDigest:', messageDigest);

// Convert signed bytes to unsigned
const unsignedBytes = messageDigest.map(b => (b < 0 ? b + 256 : b));

// Convert to a Buffer, then to hex
const messageDigestHex = Buffer.from(unsignedBytes).toString('hex');

console.log('messageDigest:', messageDigestHex);

// const eContent =
//   '3166301506092a864886f70d01090331080606678108010101301c06092a864886f70d010905310f170d3139313231363137323233385a302f06092a864886f70d01090431220420b0603bd5835259f8697d25b19ea2892b0d2773063be5516e314bffb89b497456';

// function hexToBytes(hex: string) {
//   let bytes = new Uint8Array(Math.ceil(hex.length / 2));
//   for (let i = 0; i < bytes.length; i++) {
//     bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
//   }
//   return bytes;
// }

// console.log('hexToBytes(eContent):', hexToBytes(eContent));

// const eContentUTF8 = Buffer.from(eContent, 'hex').toString('ascii');
// console.log(eContentUTF8);

// 49 : TAG
// 102 : LENGTH
// 48... : sequence
//      49, 102,  48,  21,   6,  9,  42, 134,  72, 134, 247,  13,
//       1,   9,   3,  49,   8,  6,   6, 103, 129,   8,   1,   1,
//       1,  48,  28,   6,   9, 42, 134,  72, 134, 247,  13,   1,
//       9,   5,  49,  15,  23, 13,  49,  57,  49,  50,  49,  54,
//      49,  55,  50,  50,  51, 56,  90,  48,  47,   6,   9,  42,
//     134,  72, 134, 247,  13,  1,   9,   4,  49,  34,   4,  32,
//     176,  96,  59, 213, 131, 82,  89, 248, 105, 125,  37, 177,
//     158, 162, 137,  43,  13, 39, 115,   6,  59, 229,  81, 110,
//      49,  75, 255, 184, 155, 73, 116,  86

// "1.2.840.113549.1.9.4"

//                             TAG, LGT, RFC_3369 TAG...,                                          TAG,  SEQUENCE...
// RFC_3369_CONTENT_TYPE_OID    48,  21,   6,   9,  42, 134,  72, 134, 247,  13,   1,   9,   3, |   49,   8,   6,   6, 103, 129,   8,   1,   1,   1,
// signing-time                 48,  28,   6,   9,  42, 134,  72, 134, 247,  13,   1,   9,   5, |   49,  15,  23,  13,  49,  57,  49,  50,  49,  54,  49,  55,  50,  50,  51,  56,  90,
// RFC_3369_MESSAGE_DIGEST_OID  48,  47,   6,   9,  42, 134,  72, 134, 247,  13,   1,   9,   4, |   49,  34,   4,  32, | 176,  96,  59, 213, 131,  82,  89, 248, 105, 125,  37, 177, 158, 162, 137,  43,  13, 39, 115,   6,  59, 229,  81, 110,  49,  75, 255, 184, 155,  73, 116,  86

// Donc je veux arriver au hash suivant pour les dataHashes concaténés:
// 34,   4,  32, | 176,  96,  59, 213, 131,  82,  89, 248, 105, 125,  37, 177, 158, 162, 137,  43,  13, 39, 115,   6,  59, 229,  81, 110,  49,  75, 255, 184, 155,  73, 116,  86

// const dataHashes = {
//   '1': [
//     99, 19, -77, -51, 55, 104, 45, -42, -123, 101, -23, -79, -126, 1, 37, 89,
//     125, -27, -117, 34, -124, -110, 28, 116, -8, -70, 63, -61, 96, -105, 26,
//     -41,
//   ],
//   '2': [
//     63, -22, 106, 78, 31, 16, 114, -119, -19, 17, 92, 71, -122, 47, 62, 78, -67,
//     -23, -55, -43, 53, 4, 47, -67, -55, -123, 6, 121, 34, -125, 64, -114,
//   ],
//   '3': [
//     -120, -101, 87, -112, 121, 15, -104, 127, 85, 25, -102, 80, 20, 58, 51, 75,
//     -63, 116, -22, 0, 60, 30, 29, 30, -73, -115, 72, -9, -1, -53, 100, 124,
//   ],
//   '11': [
//     0, -62, 104, 108, -19, -10, 97, -26, 116, -58, 69, 110, 26, 87, 17, 89, 110,
//     -57, 108, -6, 36, 21, 39, 87, 110, 102, -6, -43, -82, -125, -85, -82,
//   ],
//   '12': [
//     -66, 82, -76, -21, -34, 33, 79, 50, -104, -120, -114, 35, 116, -32, 6, -14,
//     -100, -115, -128, -9, 10, 61, 98, 86, -8, 45, -49, -46, 90, -24, -81, 38,
//   ],
//   '13': [
//     91, -34, -46, -63, 63, -34, 104, 82, 36, 41, -118, -3, 70, 15, -108, -48,
//     -100, 45, 105, -85, -15, -61, -71, 43, -39, -94, -110, -55, -34, 89, -18,
//     38,
//   ],
//   '14': [
//     76, 123, -40, 13, 52, -29, 72, -11, 59, -63, -18, -90, 103, 49, 24, -92,
//     -85, -68, -62, -59, -100, -69, -7, 28, -58, 95, 69, 15, -74, 56, 54, 38,
//   ],
// };

// ContentInfo encapContentInfo = signedData.getEncapContentInfo();
// DEROctetString eContent = (DEROctetString)encapContentInfo.getContent();

const signedData = {
  bodyLength: -1,
  elements: [
    {
      bodyLength: -1,
      elements: [
        {
          body: [42, -122, 72, -122, -9, 13, 1, 9, 3],
          identifier: '1.2.840.113549.1.9.3',
        },
        {
          bodyLength: -1,
          elements: [
            {body: [103, -127, 8, 1, 1, 1], identifier: '2.23.136.1.1.1'},
          ],
          isSorted: true,
        },
      ],
    },
    {
      bodyLength: -1,
      elements: [
        {
          body: [42, -122, 72, -122, -9, 13, 1, 9, 5],
          identifier: '1.2.840.113549.1.9.5',
        },
        {
          bodyLength: -1,
          elements: [
            {time: [49, 57, 49, 50, 49, 54, 49, 55, 50, 50, 51, 56, 90]},
          ],
          isSorted: true,
        },
      ],
    },
    {
      bodyLength: -1,
      elements: [
        {
          body: [42, -122, 72, -122, -9, 13, 1, 9, 4],
          identifier: '1.2.840.113549.1.9.4',
        },
        {
          bodyLength: -1,
          elements: [
            {
              string: [
                -80, 96, 59, -43, -125, 82, 89, -8, 105, 125, 37, -79, -98, -94,
                -119, 43, 13, 39, 115, 6, 59, -27, 81, 110, 49, 75, -1, -72,
                -101, 73, 116, 86,
              ],
            },
          ],
          isSorted: true,
        },
      ],
    },
  ],
  isSorted: false,
};

// Convert the byte arrays into hex strings, and store them in an array in the correct order
const hashHexStrings = Object.keys(dataHashes)
  .sort()
  .map(key => {
    const byteArray = dataHashes[key as keyof typeof dataHashes];
    // Convert signed bytes to unsigned, then to hex string
    const hexString = byteArray
      .map(b => (b < 0 ? b + 256 : b))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    return hexString;
  });

// Concatenate the hex strings
const concatenatedHashesHex = hashHexStrings.join('');

// Hash the concatenated hashes to get the message digest in hex
const messageDigestHex2 = hashDataHex(concatenatedHashesHex);

console.log('messageDigestHex2:', messageDigestHex2);

// Function to hash hex data
function hashDataHex(dataHex: string): string {
  const hash = crypto.createHash('sha256');
  hash.update(dataHex, 'hex');
  return hash.digest('hex');
}
