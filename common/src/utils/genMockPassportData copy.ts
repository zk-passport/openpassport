import { PassportData } from "./types";
import { hash, assembleEContent, formatAndConcatenateDataHashes, formatMrz, hexToDecimal, getHashLen } from "./utils";
import * as forge from 'node-forge';
import { mock_dsc_key_sha1_rsa_4096, mock_dsc_key_sha256_rsa_4096, mock_dsc_key_sha256_rsapss_2048, mock_dsc_key_sha256_rsapss_4096, mock_dsc_sha1_rsa_4096, mock_dsc_sha256_rsa_4096, mock_dsc_sha256_rsapss_2048, mock_dsc_sha256_rsapss_4096 } from "../constants/mockCertificates";
import { sampleDataHashes_small, sampleDataHashes_large } from "../constants/sampleDataHashes";
import { countryCodes } from "../constants/constants";
import { getSignatureAlgorithm } from "./handleCertificate";

export function genMockPassportData(
  signatureType: 'rsa_sha1' | 'rsa_sha256' | 'rsapss_sha256',
  nationality: keyof typeof countryCodes,
  birthDate: string,
  expiryDate: string,
): PassportData {
  if (birthDate.length !== 6 || expiryDate.length !== 6) {
      throw new Error("birthdate and expiry date have to be in the \"YYMMDD\" format");
  }

  const mrz = `P<${nationality}DUPONT<<ALPHONSE<HUGUES<ALBERT<<<<<<<<<24HB818324${nationality}${birthDate}1M${expiryDate}5<<<<<<<<<<<<<<02`;

  let privateKeyPem: string;
  let dsc: string;
  let sampleDataHashes: [number, number[]][];

  switch (signatureType) {
      case 'rsa_sha1':
          privateKeyPem = mock_dsc_key_sha1_rsa_4096;
          dsc = mock_dsc_sha1_rsa_4096;
          sampleDataHashes = sampleDataHashes_small;
          break;
      case 'rsa_sha256':
          privateKeyPem = mock_dsc_key_sha256_rsa_4096;
          dsc = mock_dsc_sha256_rsa_4096;
          sampleDataHashes = sampleDataHashes_large;
          break;
      case 'rsapss_sha256':
          privateKeyPem = mock_dsc_key_sha256_rsapss_4096;
          dsc = mock_dsc_sha256_rsapss_4096;
          sampleDataHashes = sampleDataHashes_large;
          break;
  }

  const {signatureAlgorithm, hashFunction} = getSignatureAlgorithm(dsc);
  const hashLen = getHashLen(hashFunction);

  const mrzHash = hash(hashFunction, formatMrz(mrz));
  const concatenatedDataHashes = formatAndConcatenateDataHashes(
      [[1, mrzHash], ...sampleDataHashes],
      hashLen,
      30
  );

  const eContent = assembleEContent(hash(hashFunction, concatenatedDataHashes));
  const eContentHash = hash(hashFunction, eContent);

  const signature = sign(privateKeyPem, hashFunction, signatureAlgorithm, eContentHash);
  const signatureBytes = Array.from(signature, byte => byte < 128 ? byte : byte - 256);

  return {
      dsc: dsc,
      mrz: mrz,
      dataGroupHashes: concatenatedDataHashes,
      eContent: eContent,
      encryptedDigest: signatureBytes,
      photoBase64: "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABjElEQVR42mL8//8/AyUYiBQYmIy3..."
  };
}

function sign(privateKeyPem: string, hashFunction: string, signatureAlgorithm: string, eContent: number[]): number[] {
  if (signatureAlgorithm === 'rsapss') {
      const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
      const md = forge.md.sha256.create();
      md.update(forge.util.binary.raw.encode(new Uint8Array(eContent)));
      const pss = forge.pss.create({
          md: forge.md.sha256.create(),
          mgf: forge.mgf.mgf1.create(forge.md.sha256.create()),
          saltLength: 32
      });
      const signatureBytes = privateKey.sign(md, pss);
      return Array.from(signatureBytes, (c: string) => c.charCodeAt(0));
  } else {
    const privKey = forge.pki.privateKeyFromPem(privateKeyPem);
    const md = hashFunction === 'sha1' ? forge.md.sha1.create() : forge.md.sha256.create();
    md.update(forge.util.binary.raw.encode(new Uint8Array(eContent)));
    const forgeSignature = privKey.sign(md);
    return Array.from(forgeSignature, (c: string) => c.charCodeAt(0));
  }
}