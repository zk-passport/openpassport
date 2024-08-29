import { assert } from "../../src/utils/shaPad";
import { PassportData } from "../../src/utils/types";
import { hash, assembleEContent, formatAndConcatenateDataHashes, formatMrz, hexToDecimal, arraysAreEqual, findSubarrayIndex, getHashLen } from "../../src/utils/utils";
import * as forge from 'node-forge';
import { mock_dsc_key_sha256_rsa_4096, mock_dsc_sha256_rsa_4096 } from "../../src/constants/mockCertificates";
import { sampleDataHashes_large } from "../../src/constants/sampleDataHashes";
import { getSignatureAlgorithm } from "../../src/utils/handleCertificate";

export function genMockPassportData_sha256_rsa_65537(mrz: string): PassportData {
  const { hashFunction } = getSignatureAlgorithm(mock_dsc_sha256_rsa_4096);
  const hashLen = getHashLen(hashFunction);
  const mrzHash = hash(hashFunction, formatMrz(mrz));
  const concatenatedDataHashes = formatAndConcatenateDataHashes(
    [[1, mrzHash], ...sampleDataHashes_large],
    hashLen,
    31
  );

  const eContent = assembleEContent(hash(hashFunction, concatenatedDataHashes));

  const privKey = forge.pki.privateKeyFromPem(mock_dsc_key_sha256_rsa_4096);

  const eContentHash = hash(hashFunction, eContent);

  const eContentHashBytes = forge.util.createBuffer(new Uint8Array(eContentHash)).getBytes();

  // const md = forge.md.sha256.create();
  // md.update(forge.util.binary.raw.encode(new Uint8Array(eContent)));

  const signature = privKey.sign(eContentHashBytes)
  const signatureBytes = Array.from(signature, (c: string) => c.charCodeAt(0));

  return {
    mrz: mrz,
    dsc: mock_dsc_sha256_rsa_4096,
    dataGroupHashes: concatenatedDataHashes,
    eContent: eContent,
    encryptedDigest: signatureBytes,
    photoBase64: "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABjElEQVR42mL8//8/AyUYiBQYmIw3..."
  }
}

export function verify_sha256_rsa_65537(passportData: PassportData): boolean {
  const { mrz, dsc, dataGroupHashes, eContent, encryptedDigest } = passportData;
  const { hashFunction } = getSignatureAlgorithm(dsc);
  const hashLen = getHashLen(hashFunction);

  const mrzHash = hash(hashFunction, formatMrz(mrz));
  const dg1HashOffset = findSubarrayIndex(dataGroupHashes, mrzHash)
  console.log('dg1HashOffset', dg1HashOffset);
  assert(dg1HashOffset !== -1, 'MRZ hash index not found in dataGroupHashes');

  const concatHash = hash(hashFunction, dataGroupHashes)
  assert(
    arraysAreEqual(
      concatHash,
      eContent.slice(eContent.length - hashLen)
    ),
    'concatHash is not at the right place in eContent'
  );

  const publicKey = forge.pki.certificateFromPem(dsc).publicKey as {n: forge.jsbn.BigInteger, e: forge.jsbn.BigInteger};
  const rsaPublicKey = forge.pki.rsa.setPublicKey(publicKey.n, publicKey.e);

  const eContentHash = hash(hashFunction, eContent);

  const signature = Buffer.from(encryptedDigest).toString(
    'binary',
  );

  const eContentHashBytes = forge.util.createBuffer(new Uint8Array(eContentHash)).getBytes();
  return rsaPublicKey.verify(eContentHashBytes, signature);
}
