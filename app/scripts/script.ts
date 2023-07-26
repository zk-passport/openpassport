// const crypto = require('crypto');
import * as crypto from 'crypto';

const firstName = 'FLORENTHUGUESJEAN';
const lastName = 'TAVERNIER';
const gender = 'MALE';
const issuer = 'FRA';
const nationality = 'FRA';
const photo = {
  base64:
    'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gIoSUNDX1BST0ZJTEUAAQEAAAIYAAAAAAIQAABtbnRyUkdCIFhZWiAAAAAAAAAAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAAHRyWFlaAAABZAAAABRnWFlaAAABeAAAABRiWFlaAAABjAAAABRyVFJDAAABoAAAAChnVFJDAAABoAAAAChiVFJDAAABoAAAACh3dHB0AAAByAAAABRjcHJ0AAAB3AAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAFgAAAAcAHMAUgBHAEIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFhZWiAAAAAAAABvogAAOPUAAAOQWFlaIAAAAAAAAGKZAAC3hQAAGNpYWVogAAAAAAAAJKAAAA+EAAC2z3BhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABYWVogAAAAAAAA9tYAAQAAAADTLW1sdWMAAAAAAAAAAQAAAAxlblVTAAAAIAAAABwARwBvAG8AZwBsAGUAIABJAG4AYwAuACAAMgAwADEANv/bAEMA///////////////////////////////////////////////////////////////////////////////////////bAEMB///////////////////////////////////////////////////////////////////////////////////////AABEIAUAA8AMBIgACEQEDEQH/xAAXAAEBAQEAAAAAAAAAAAAAAAAAAQID/8QAIRABAQABAwQDAQAAAAAAAAAAAAERAhJhMYGh8CFB0VH/xAAVAQEBAAAAAAAAAAAAAAAAAAAAAf/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/ANmRAXJlFAAAAAAAAAAAEAUQBcmUAXJlAFyIAogCiAKIAqKgCoAoAAACKgKIAAAAAAAAAAAAAAAAAAAqKAgKAigAIADFoN5kZ3MgLupuqANbqu5gB0zBzMg6DE1YbAAAAAAAAAABQQAAFEAAtc7bQW3LIAAAAAAAAALLhAHSVXJqXANhLkAAAAAABQAQFBALcAzqv0wdQAAAAAAAAAAAFBBcICyukuXNZcA2AAAACgIqAAAMar9NuYIAAAAAALhcAyq4XAMmGsAJhcKAmEsaKDCNVkG9N+mnJ0lzAUABUUBFQAAC9HJvV0YAAAFMZBMNyEigAIoKAgoCKigIqKJWHRiiI1prIDqEAAABUAABjV1Zb1MAA1AMNIoAACoCqIAoggAKAAgxW2KCAsB0nQJ0AAAUEBUAGdTC6rmoBG2Z1aBREBcmWcGAayZZUGhAVUyIIZMphcAZXKAKzWkoMrIjpOgKAAACgAIqAxq+mWtXVkFjTMaATKpATItiSAKAKqKKyKgiCpgF5MqmAVKqUEb09HN009AUAAAFAARUBnVPth0vRzoLG2I0AKAiKAigAqKKgAIoCAKAzWmaCRudGI6QAAAAFRQBFARit1kGY0z0aBQBUFAQABUUEAAVFABAGa0n2ISNsxoAAAAFAARUASxQGaLhAFQBUAUBKCjKiKMqKoAAAgDUAgAAAAAKAAigIAAipQQAAAAAEFQFEUUAAAEGmY0AAAAAACgAIqAAAAAyLUABAPkAE+RQEUAFQBQAWKAAAAAAAKAAioAAAADNv0jOfloFEABQEFAQUBAAFlRJfkHQAAAAAAAFQAAAAS3AKl6VjdUttBGpWQGxnKgqoAqACoAAiZAtQAdZ0ipLmKAAAAAAACWyAqZwxdX8QGrq/jAAAAAAAA1KrC5BpEyZBTKZQFQAAAGpq/rIDqrlLY3NQNAAAAxdX8YAAAAAAAAAAAAAAAAAAAAAAAAAFlsdJcuQDsMTV/W5cg4jrsnPvY2Tn3sDkOuyc+9jZOfH4DkOuyc+9jZOfH4DkOuyc+9jZOfewOQ67Jz72Nk597A5DrsnPj8Nk58fgOQ67Jz72Nk597A5DrsnPvY2Tnx+A5DrsnPj8Nk58fgOQ67Jz72Nk597A5DrsnPvY2Tn3sDkOuyc+9jZOfewOQ67Jz4/DZOfH4DkOuyc+Pw2Tn3sDksvy6bJz72Nk597A//Z',
  height: 320,
  width: 240,
};
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
const publicKey =
  'RSA Public Key [81:f8:a9:ad:98:ce:a1:f8:41:b7:41:73:c8:4e:a9:a8:c9:32:c3:a2],[56:66:d1:a4]';
const modulus =
  'df11ba06d7937a059e8ce7916ab0fb0b094a9b9ecf98e97eda6834a23075f2030072a3c7868f85045af2acb5f5c2bedf6c25614d99232b98bb456e5f8ce32148882f2281537ac7aa80e4cdb79e0cdf4627cd08da32ce263ef54a26c2ca3493f1d02d9fabcd89952058cb0085fa356b13f9e2cc1e9ca4f47678dc49129d55531bd2817dd436d5aef778d4d439d2d659b0cf9d58eeff43ce2cff26d5c66d23164123fc9c3e6cd4902e9d7b54d9509b03f95debfc3fb15ef7b458ac64a2c6e26bf010451eff67ed87f6ca7a946dd7ac86dea2566cbdc9aa0e3cbaad9f5ed4b6886cd08f6baf1487b58f6ba33075968396c216ef65b0eb49c6978464dcde99f9a9a1';
const exponent = 10001;
const publicKeyOldSchool =
  'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA3xG6BteTegWejOeRarD7CwlKm57PmOl+2mg0ojB18gMAcqPHho+FBFryrLX1wr7fbCVhTZkjK5i7RW5fjOMhSIgvIoFTeseqgOTNt54M30YnzQjaMs4mPvVKJsLKNJPx0C2fq82JlSBYywCF+jVrE/nizB6cpPR2eNxJEp1VUxvSgX3UNtWu93j1DnS1lmwz51Y7v9Dziz/JtXGbSMWQSP8nD5s1JAunXtU2VCbA/ld6/w/sV73tFisZKLG4mvwEEUe/2fth/bKepRt16yG3qJWbL3Jqg48uq2fXtS2iGzQj2uvFIe1j2ujMHWWg5bCFu9lsOtJxpeEZNzemfmpoQIDAQAB';
const dataGroupHashes = {
  '1': [
    99, 19, -77, -51, 55, 104, 45, -42, -123, 101, -23, -79, -126, 1, 37, 89,
    125, -27, -117, 34, -124, -110, 28, 116, -8, -70, 63, -61, 96, -105, 26,
    -41,
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
  '2': [
    63, -22, 106, 78, 31, 16, 114, -119, -19, 17, 92, 71, -122, 47, 62, 78, -67,
    -23, -55, -43, 53, 4, 47, -67, -55, -123, 6, 121, 34, -125, 64, -114,
  ],
  '3': [
    -120, -101, 87, -112, 121, 15, -104, 127, 85, 25, -102, 80, 20, 58, 51, 75,
    -63, 116, -22, 0, 60, 30, 29, 30, -73, -115, 72, -9, -1, -53, 100, 124,
  ],
};
const eContent =
  '3166301506092a864886f70d01090331080606678108010101301c06092a864886f70d010905310f170d3139313231363137323233385a302f06092a864886f70d01090431220420b0603bd5835259f8697d25b19ea2892b0d2773063be5516e314bffb89b497456';
const encryptedDigest =
  '5a78c5d241463136f26255cb75fe2de2dbaeda10ef7c7eea2f6b635940e079b04d6bfec592ef1293366076382e2a9543bd84a973c66e6c0715e468738c5d802c98cd81aa3d338a4e338e93e219412835456c4a0208587c360a5b8d4c2d09d069671e4175104c69c8ad2dadc6dea40729463dd8543392420406c08a020dadcb14ec78fad95ccef0cbe06a5416c45a9abc31c38d88190cb650a6536f0357bb6a04c59817a889d2eee4128b7757b2f7b52e572b030ef7b362dbad20de3a2a2c488134042fb8b18a254d2332cde4996e768da37863419a2760b9f394de395425db5b8276a24b60f02a0b595bf81a28dc3bd7584863641a75504b0df267467de87516';

// Assemble the MRZ in two lines
// let mrzLine1 =
//   dg1File.mrzInfo.documentCode +
//   dg1File.mrzInfo.issuingState +
//   dg1File.mrzInfo.primaryIdentifier +
//   dg1File.mrzInfo.optionalData1.toUpperCase();

// let mrzLine2 =
//   dg1File.mrzInfo.documentNumber +
//   dg1File.mrzInfo.documentNumberCheckDigit +
//   dg1File.mrzInfo.nationality +
//   dg1File.mrzInfo.dateOfBirth +
//   dg1File.mrzInfo.dateOfBirthCheckDigit +
//   dg1File.mrzInfo.gender +
//   dg1File.mrzInfo.dateOfExpiry +
//   dg1File.mrzInfo.dateOfExpiryCheckDigit +
//   dg1File.mrzInfo.secondaryIdentifier.toUpperCase() +
//   dg1File.mrzInfo.compositeCheckDigit;

// Form the MRZ string
// const mrzString = `${dg1File.mrzInfo.documentCode}<${dg1File.mrzInfo.issuingState}${dg1File.mrzInfo.primaryIdentifier}<<${dg1File.mrzInfo.secondaryIdentifier}\n${dg1File.mrzInfo.documentNumber}${dg1File.mrzInfo.documentNumberCheckDigit}${dg1File.mrzInfo.nationality}${dg1File.mrzInfo.dateOfBirth}${dg1File.mrzInfo.dateOfBirthCheckDigit}${dg1File.mrzInfo.gender}${dg1File.mrzInfo.dateOfExpiry}${dg1File.mrzInfo.dateOfExpiryCheckDigit}${dg1File.mrzInfo.optionalData1}${dg1File.mrzInfo.compositeCheckDigit}`;

// console.log('MRZ string:', mrzString);

// // Convert the MRZ string to a byte array
// const mrzByteArray = Array.from(Buffer.from(mrzString, 'utf8'));

// console.log('MRZ byte array:', mrzByteArray);

// // Hash the MRZ byte array using SHA-256
// const sha256 = crypto.createHash('sha256');
// sha256.update(Buffer.from(mrzByteArray));
// const hash = sha256.digest();

// // Convert the hash to a byte array
// const hashByteArray = Array.from(hash);

// console.log('Hash byte array:', hashByteArray);

// The MRZ information
// const mrz =
//   'P<FRATAVERNIER<<FLORENT<HUGUES<JEAN<<<<<<<<<\n19HA348284FRA0007191M2912095<<<<<<<<<<<<<<02';

// // Convert the MRZ information to a Buffer
// const mrzBuffer = Buffer.from(mrz);

// // Create a SHA-256 hash of the MRZ information
// const hash = crypto.createHash('sha256').update(mrzBuffer).digest('hex');

// console.log(hash);

// let sodFile = {
//   digestAlgorithm: 'sha256',
//   // assuming dataGroupHashes is an array of data groups. Initialize it as needed
//   dataGroupHashes: [],
// };

// let dg1File = {
//   encoded: Buffer.from([
//     97, 91, 95, 31, 88, 80, 60, 70, 82, 65, 84, 65, 86, 69, 82, 78, 73, 69, 82,
//     60, 60, 70, 76, 79, 82, 69, 78, 84, 60, 72, 85, 71, 85, 69, 83, 60, 74, 69,
//     65, 78, 60, 60, 60, 60, 60, 60, 60, 60, 60, 49, 57, 72, 65, 51, 52, 56, 50,
//     56, 52, 70, 82, 65, 48, 48, 48, 55, 49, 57, 49, 77, 50, 57, 49, 50, 48, 57,
//     53, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 48, 50,
//   ]),
// };

// // dataGroupHashes["1"] c'est dg1.encoded (hash du DG1 ?)

// let digest = crypto.createHash(sodFile.digestAlgorithm);
// let dg1Hash = digest.update(dg1File.encoded).digest();

// console.log('dg1Hash:', dg1Hash.toString('hex'));

// function encodeDg1File(dg1File: any) {
//   // Convert the MRZ Info to a string in the MRZ format
//   let mrzString =
//     dg1File.mrzInfo.documentCode +
//     dg1File.mrzInfo.issuingState +
//     dg1File.mrzInfo.primaryIdentifier +
//     '<<' +
//     dg1File.mrzInfo.secondaryIdentifier +
//     dg1File.mrzInfo.documentNumber +
//     dg1File.mrzInfo.documentNumberCheckDigit +
//     dg1File.mrzInfo.nationality +
//     dg1File.mrzInfo.dateOfBirth +
//     dg1File.mrzInfo.dateOfBirthCheckDigit +
//     dg1File.mrzInfo.gender +
//     dg1File.mrzInfo.dateOfExpiry +
//     dg1File.mrzInfo.dateOfExpiryCheckDigit +
//     dg1File.mrzInfo.optionalData1 +
//     dg1File.mrzInfo.compositeCheckDigit;

//   // Replace < characters with ASCII code for <
//   mrzString = mrzString.replace(/</g, String.fromCharCode(60));

//   // Create a new array of ASCII codes from the MRZ string
//   let encoded = [];
//   for (let i = 0; i < mrzString.length; i++) {
//     encoded.push(mrzString.charCodeAt(i));
//   }

//   // Return the encoded array
//   return encoded;
// }

// const encoded = encodeDg1File(dg1File);

// const encodedString = encoded.map(code => String.fromCharCode(code)).join('');

// console.log('encodedString', encodedString);

// const hash = crypto.createHash('sha256');
// hash.update(encodedString);
// const hashedEncoded = hash.digest('hex');

// console.log('hashedEncoded', hashedEncoded);

// const hash2 = crypto.createHash('sha256');
// hash2.update(Buffer.from(encoded));
// const hashedEncoded2 = hash2.digest('hex');

// console.log('hashedEncoded2', hashedEncoded2);

function getEncoded(dg1File: any) {
  let buffers = [];

  // helper to write string as ASCII codes
  const write = (str: string) => {
    buffers.push(Buffer.from(str, 'utf8'));
  };

  // helper to write '<' filled string of certain length
  const writeFixedSize = (str: any, size: any) => {
    str = str.padEnd(size, '<');
    buffers.push(Buffer.from(str, 'utf8'));
  };

  const writeDocumentType = () => write(dg1File.mrzInfo.documentCode);
  const writeIssuingState = () => write(dg1File.mrzInfo.issuingState);
  const writeDocumentNumber = () =>
    writeFixedSize(dg1File.mrzInfo.documentNumber, 9);
  const writeDateOfBirth = () => write(dg1File.mrzInfo.dateOfBirth);
  const writeGender = () => write(dg1File.mrzInfo.gender);
  const writeDateOfExpiry = () => write(dg1File.mrzInfo.dateOfExpiry);
  const writeNationality = () => write(dg1File.mrzInfo.nationality);
  const writeName = () =>
    writeFixedSize(
      dg1File.mrzInfo.primaryIdentifier +
        '<<' +
        dg1File.mrzInfo.secondaryIdentifier,
      39,
    );

  if (dg1File.mrzInfo.documentType === 3) {
    // check if it's an ID3 document
    writeDocumentType();
    writeIssuingState();
    writeName();
    writeDocumentNumber();
    buffers.push(
      Buffer.from([dg1File.mrzInfo.documentNumberCheckDigit.charCodeAt(0)]),
    ); // Convert string digit to ASCII code
    writeNationality();
    writeDateOfBirth();
    buffers.push(
      Buffer.from([dg1File.mrzInfo.dateOfBirthCheckDigit.charCodeAt(0)]),
    ); // Convert string digit to ASCII code
    writeGender();
    writeDateOfExpiry();
    buffers.push(
      Buffer.from([dg1File.mrzInfo.dateOfExpiryCheckDigit.charCodeAt(0)]),
    ); // Convert string digit to ASCII code
    // assuming personal number is optionalData1
    writeFixedSize(dg1File.mrzInfo.optionalData1, 14);
    // assuming personal number check digit is missing
    buffers.push(
      Buffer.from([dg1File.mrzInfo.compositeCheckDigit.charCodeAt(0)]),
    ); // Convert string digit to ASCII code
  } else {
    console.error('Unsupported document type: ', dg1File.mrzInfo.documentType);
  }

  return Buffer.concat(buffers);
}

const encoded = Array.from(getEncoded(dg1File));
console.log(encoded);
const a = [
  80, 70, 82, 65, 84, 65, 86, 69, 82, 78, 73, 69, 82, 60, 60, 70, 76, 79, 82,
  69, 78, 84, 60, 72, 85, 71, 85, 69, 83, 60, 74, 69, 65, 78, 60, 60, 60, 60,
  60, 60, 60, 60, 60, 49, 57, 72, 65, 51, 52, 56, 50, 56, 4, 70, 82, 65, 48, 48,
  48, 55, 49, 57, 1, 77, 65, 76, 69, 50, 57, 49, 50, 48, 57, 5, 60, 60, 60, 60,
  60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 48, 2,
];

console.log('a', a.map(code => String.fromCharCode(code)).join(''));

const b = [
  97, 91, 95, 31, 88, 80, 60, 70, 82, 65, 84, 65, 86, 69, 82, 78, 73, 69, 82,
  60, 60, 70, 76, 79, 82, 69, 78, 84, 60, 72, 85, 71, 85, 69, 83, 60, 74, 69,
  65, 78, 60, 60, 60, 60, 60, 60, 60, 60, 60, 49, 57, 72, 65, 51, 52, 56, 50,
  56, 52, 70, 82, 65, 48, 48, 48, 55, 49, 57, 49, 77, 50, 57, 49, 50, 48, 57,
  53, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 48, 50,
];
console.log('b', b.map(code => String.fromCharCode(code)).join(''));

// PFRATAVERNIER<<FLORENT<HUGUES<JEAN<<<<<<<<<19HA34828FRA000719MALE291209<<<<<<<<<<<<<<0
// a[_XP<FRATAVERNIER<<FLORENT<HUGUES<JEAN<<<<<<<<<19HA348284FRA0007191M2912095<<<<<<<<<<<<<<02
