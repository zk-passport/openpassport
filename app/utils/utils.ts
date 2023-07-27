import {DataHash, MrzInfo, PassportData} from '../types/passportData';

export function toUnsigned(byte: number) {
  return byte & 0xff;
}

export function arraysAreEqual(array1: number[], array2: number[]) {
  return (
    array1.length === array2.length &&
    array1.every((value, index) => value === array2[index])
  );
}

export function toSigned(byte: number) {
  return byte > 127 ? byte - 256 : byte;
}

export function dataHashesObjToArray(dataHashes: {
  [key: string]: number[];
}): DataHash[] {
  return Object.keys(dataHashes)
    .map(key => {
      const dataHash = dataHashes[key as keyof typeof dataHashes];
      return [Number(key), dataHash];
    })
    .sort((a, b) => (a[0] as number) - (b[0] as number)) as DataHash[];
}

export function assembleMrz(mrzInfo: MrzInfo) {
  return (
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
    mrzInfo.compositeCheckDigit
  );
}

export function formatMrz(mrz: string) {
  const mrzCharcodes = [...mrz].map(char => char.charCodeAt(0));

  // console.log('mrzCharcodes:', mrzCharcodes);

  mrzCharcodes.unshift(88); // the length of the mrz data
  mrzCharcodes.unshift(95, 31); // the MRZ_INFO_TAG
  mrzCharcodes.unshift(91); // the new length of the whole array
  mrzCharcodes.unshift(97); // the tag for DG1

  // console.log('mrzCharcodes with tags:', mrzCharcodes);

  return mrzCharcodes;
}

// Example: [49, 15, 23, 13, 49, 57, 49, 50, 49, 54, 49, 55, 50, 50, 51, 56, 90]
// Is "191216172238Z" - 16th December 2019, 17:22:38 UTC
export function findTimeOfSignature(eContentDecomposed: any) {
  const timeElement: any = eContentDecomposed.elements.find(
    (element: any) => element.elements[0].identifier === '1.2.840.113549.1.9.5',
  );

  if (!timeElement) {
    throw new Error('No time element found in eContentDecomposed');
  }

  const timeFound = timeElement.elements[1].elements[0].time;
  console.log('timeFound', timeFound);

  // Adding the 4 bytes of the ASN.1 tag and length
  // 49 : SET, 15 : LGT, 23 : UTCTIME, 13 : LGT
  timeFound.unshift(...[49, 15, 23, 13]);

  return timeFound;
}

export function parsePubKeyString(pubKeyString: string) {
  const modulusMatch = pubKeyString.match(/modulus: (\w+)/);
  const publicExponentMatch = pubKeyString.match(/public exponent: (\w+)/);

  const modulus = modulusMatch ? modulusMatch[1] : null;
  const exponent = publicExponentMatch ? publicExponentMatch[1] : null;

  console.log('Modulus:', modulus);
  console.log('Public Exponent:', exponent);

  if (!modulus || !exponent) {
    throw new Error('Could not parse public key string');
  }

  return {
    modulus,
    exponent,
  };
}
