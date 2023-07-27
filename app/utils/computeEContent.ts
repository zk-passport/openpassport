import {PassportData} from '../types/passportData';
import {
  arraysAreEqual,
  assembleEContent,
  assembleMrz,
  findTimeOfSignature,
  formatAndConcatenateDataHashes,
  formatMrz,
} from './utils';
const sha256 = require('js-sha256');

export function computeAndCheckEContent(passportData: PassportData) {
  const mrz = assembleMrz(passportData.mrzInfo);
  const dataHashes = passportData.dataGroupHashes;
  const mrzHash = hash(formatMrz(mrz));

  if (!arraysAreEqual(mrzHash, dataHashes[0][1])) {
    throw new Error('MRZ hash does not match data group hash 1');
  }

  const concatenatedDataHashes = formatAndConcatenateDataHashes(
    mrzHash,
    dataHashes,
  );

  if (
    !arraysAreEqual(
      concatenatedDataHashes,
      passportData.contentBytes.content.string,
    )
  ) {
    throw new Error('Concatenated data hashes do not match content bytes');
  }

  const concatenatedDataHashesHashDigest = hash(concatenatedDataHashes);

  const timeOfSignature = findTimeOfSignature(passportData.eContentDecomposed);

  return assembleEContent(concatenatedDataHashesHashDigest, timeOfSignature);
}

// hash logic here because the one in utils.ts only works with node
export function hash(bytesArray: number[]) {
  let unsignedBytesArray = bytesArray.map(toUnsignedByte);
  let hash = sha256(unsignedBytesArray);
  return hexToSignedBytes(hash);
}

function hexToSignedBytes(hexString: string) {
  let bytes = [];
  for (let i = 0; i < hexString.length - 1; i += 2) {
    let byte = parseInt(hexString.substr(i, 2), 16);
    bytes.push(byte >= 128 ? byte - 256 : byte);
  }
  return bytes;
}

function toUnsignedByte(signedByte: number) {
  return signedByte < 0 ? signedByte + 256 : signedByte;
}
