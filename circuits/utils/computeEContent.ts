import {sha256} from 'js-sha256';

// hash logic here because the one in utils.ts only works with node
export function hash(bytesArray: number[]) {
  let unsignedBytesArray = bytesArray.map(toUnsignedByte);
  let hash = sha256(unsignedBytesArray);
  return hexToSignedBytes(hash);
}

export function hexToSignedBytes(hexString: string): number[] {
  let bytes = [];
  for (let i = 0; i < hexString.length - 1; i += 2) {
    let byte = parseInt(hexString.substr(i, 2), 16);
    bytes.push(byte >= 128 ? byte - 256 : byte);
  }
  return bytes;
}

export function toUnsignedByte(signedByte: number) {
  return signedByte < 0 ? signedByte + 256 : signedByte;
}
