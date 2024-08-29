import { assert } from "../../src/utils/shaPad";
import { PassportData } from "../../src/utils/types";
import { hash, assembleEContent, formatAndConcatenateDataHashes, formatMrz, arraysAreEqual, findSubarrayIndex, getHashLen } from "../../src/utils/utils";
import * as forge from 'node-forge';
import { mock_dsc_key_sha256_rsapss_2048, mock_dsc_sha256_rsapss_2048 } from "../../src/constants/mockCertificates";
import { getSignatureAlgorithm } from "../../src/utils/handleCertificate";
import { sampleDataHashes_large } from "./sampleDataHashes";

export function genMockPassportData_sha256_rsapss_65537(mrz: string): PassportData {
  const { hashFunction } = getSignatureAlgorithm(mock_dsc_sha256_rsapss_2048);
  const hashLen = getHashLen(hashFunction);

  const privateKeyPem = forge.pki.privateKeyFromPem(mock_dsc_key_sha256_rsapss_2048);

  const mrzHash = hash(hashFunction, formatMrz(mrz));
  const concatenatedDataHashes = formatAndConcatenateDataHashes(
    [[1, mrzHash], ...sampleDataHashes_large],
    hashLen,
    30
  );

  const eContent = assembleEContent(hash(hashFunction, concatenatedDataHashes));

  const md = forge.md.sha256.create();
  md.update(forge.util.binary.raw.encode(new Uint8Array(eContent)));
  const pss = forge.pss.create({
      md: forge.md.sha256.create(),
      mgf: forge.mgf.mgf1.create(forge.md.sha256.create()),
      saltLength: 32
  });
  const signatureBytes = privateKeyPem.sign(md, pss);
  const signature = Array.from(signatureBytes, (c: string) => c.charCodeAt(0));

  const signatureArray = Array.from(signature, byte => byte < 128 ? byte : byte - 256);

  return {
    mrz: mrz,
    dsc: mock_dsc_sha256_rsapss_2048,
    dataGroupHashes: concatenatedDataHashes,
    eContent: eContent,
    encryptedDigest: signatureArray,
    photoBase64: "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABjElEQVR42mL8//8/AyUYiBQYmIw3..."
  }
}

export function verify_sha256_rsapss_65537(passportData: PassportData): boolean {
  const { mrz, dsc, dataGroupHashes, eContent, encryptedDigest } = passportData;
  const { hashFunction } = getSignatureAlgorithm(dsc);
  const hashLen = getHashLen(hashFunction);

  const formattedMrz = formatMrz(mrz);
  const mrzHash = hash(hashFunction, formattedMrz);
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
  
  const publicKey = forge.pki.certificateFromPem(dsc).publicKey as forge.pki.rsa.PublicKey;
  
  const md = forge.md.sha256.create();
  md.update(forge.util.binary.raw.encode(new Uint8Array(eContent)));
  
  const pss = forge.pss.create({
    md: forge.md.sha256.create(),
    mgf: forge.mgf.mgf1.create(forge.md.sha256.create()),
    saltLength: 32
  });

  const signature = Buffer.from(encryptedDigest).toString('binary');

  const isVerified = publicKey.verify(md.digest().getBytes(), signature, pss);

  return isVerified;
}