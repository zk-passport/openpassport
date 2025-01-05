import { PassportData, SignatureAlgorithmCSCA } from './types';
import { hash, generateSignedAttr, formatAndConcatenateDataHashes, formatMrz, getHashLen } from './utils';
import * as forge from 'node-forge';
import * as asn1 from 'asn1js';
import elliptic from 'elliptic';

import { countryCodes } from '../constants/constants';
import { parseCertificateSimple } from './certificate_parsing/parseCertificateSimple';
import { SignatureAlgorithm } from './types';
import { PublicKeyDetailsECDSA, PublicKeyDetailsRSAPSS } from './certificate_parsing/dataStructure';
import { getCurveForElliptic } from './certificate_parsing/curves';
import { Crypto } from "@peculiar/webcrypto";
import * as x509 from '@peculiar/x509';
import { generateCertificate } from './genMockCertificate';
const crypto = new Crypto();
x509.cryptoProvider.set(crypto);

function generateRandomBytes(length: number): number[] {
  // Generate numbers between -128 and 127 to match the existing signed byte format
  return Array.from({ length }, () => Math.floor(Math.random() * 256) - 128);
}

function generateDataGroupHashes(mrzHash: number[], hashLen: number): [number, number[]][] {
  // Generate hashes for DGs 2-15 (excluding some DGs that aren't typically used)
  const dataGroups: [number, number[]][] = [
    [1, mrzHash], // DG1 must be the MRZ hash
    [2, generateRandomBytes(hashLen)],
    [3, generateRandomBytes(hashLen)],
    [4, generateRandomBytes(hashLen)],
    [5, generateRandomBytes(hashLen)],
    [7, generateRandomBytes(hashLen)],
    [11, generateRandomBytes(hashLen)],
    [12, generateRandomBytes(hashLen)],
    [14, generateRandomBytes(hashLen)]
  ];

  return dataGroups;
}

export async function genMockPassportData(
  dgHashAlgo: string,
  eContentHashAlgo: string,
  signatureType: SignatureAlgorithm,
  signatureTypeCSCA: SignatureAlgorithmCSCA,
  nationality: keyof typeof countryCodes,
  birthDate: string,
  expiryDate: string,
  passportNumber: string = '15AA81234',
  lastName: string = 'DUPONT',
  firstName: string = 'ALPHONSE HUGHUES ALBERT'
): Promise<PassportData> {
  if (birthDate.length !== 6 || expiryDate.length !== 6) {
    throw new Error('birthdate and expiry date have to be in the "YYMMDD" format');
  }

  // Prepare last name: Convert to uppercase, remove invalid characters, split by spaces, and join with '<'
  const lastNameParts = lastName
    .toUpperCase()
    .replace(/[^A-Z< ]/g, '')
    .split(' ');
  const formattedLastName = lastNameParts.join('<');

  // Prepare first name: Convert to uppercase, remove invalid characters, split by spaces, and join with '<'
  const firstNameParts = firstName
    .toUpperCase()
    .replace(/[^A-Z< ]/g, '')
    .split(' ');
  const formattedFirstName = firstNameParts.join('<');

  // Build the first line of MRZ
  let mrzLine1 = `P<${nationality}${formattedLastName}<<${formattedFirstName}`;

  // Pad the first line with '<' to make it exactly 44 characters
  mrzLine1 = mrzLine1.padEnd(44, '<');

  if (mrzLine1.length > 44) {
    throw new Error('First line of MRZ exceeds 44 characters');
  }

  // Build the second line of MRZ
  const mrzLine2 = `${passportNumber}4${nationality}${birthDate}1M${expiryDate}5<<<<<<<<<<<<<<02`;

  // Combine both lines to form the MRZ
  const mrz = mrzLine1 + mrzLine2;

  // Validate the MRZ length
  if (mrz.length !== 88) {
    throw new Error(`MRZ must be 88 characters long, got ${mrz.length}`);
  }

  const { dsc, dscKeyPair } = await generateCertificate(signatureType, signatureTypeCSCA);


  // Generate MRZ hash first
  const mrzHash = hash(dgHashAlgo, formatMrz(mrz));

  // Generate random hashes for other DGs, passing mrzHash for DG1
  const dataGroupHashes = generateDataGroupHashes(mrzHash, getHashLen(dgHashAlgo));

  const eContent = formatAndConcatenateDataHashes(
    dataGroupHashes,
    63
  );

  const signedAttr = generateSignedAttr(hash(eContentHashAlgo, eContent));
  const hashAlgo = signatureType.split('_')[1];
  const signature = await sign(dscKeyPair, dsc, hashAlgo, signedAttr);
  const signatureBytes = Array.from(signature, (byte) => (byte < 128 ? byte : byte - 256));

  return {
    dsc: dsc,
    mrz: mrz,
    dg2Hash: dataGroupHashes.find(([dgNum]) => dgNum === 2)?.[1] || [],
    eContent: eContent,
    signedAttr: signedAttr,
    encryptedDigest: signatureBytes,
    photoBase64: 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABjElEQVR42mL8//8/AyUYiBQYmIy3...',
    mockUser: true,
  };
}
async function sign(keyPair: CryptoKeyPair, dsc: string, hashAlgorithm: string, eContent: number[]): Promise<number[]> {
  const { signatureAlgorithm } = parseCertificateSimple(dsc);
  const parsedCertificate = parseCertificateSimple(dsc);
  console.log('parsedCertificate', parsedCertificate);

  if (signatureAlgorithm === 'ecdsa') {
    // Use WebCrypto for signing
    const signature = await crypto.subtle.sign(
      {
        name: "ECDSA",
        hash: { name: `SHA-${hashAlgorithm.replace('sha', '').toUpperCase()}` },
      },
      keyPair.privateKey,
      new Uint8Array(eContent)
    );

    // Get r and s from the signature
    const signatureBytes = new Uint8Array(signature);
    const r = Array.from(signatureBytes.slice(0, 32));
    const s = Array.from(signatureBytes.slice(32, 64));

    // Ensure positive integers by prepending 0x00 if highest bit is set
    const rPadded = (r[0] & 0x80) ? [0, ...r] : r;
    const sPadded = (s[0] & 0x80) ? [0, ...s] : s;

    // Calculate lengths
    const rLength = rPadded.length;
    const sLength = sPadded.length;
    const totalLength = rLength + sLength + 4; // 2 bytes each for type and length

    // Create DER structure
    const derSignature = [
      0x30, totalLength,  // SEQUENCE
      0x02, rLength,      // INTEGER for r
      ...rPadded,        // r value
      0x02, sLength,     // INTEGER for s
      ...sPadded         // s value
    ];

    console.log('Generated signature:', {
      rLength,
      sLength,
      totalLength,
      derLength: derSignature.length
    });

    return derSignature;
  }
  else if (signatureAlgorithm === 'rsa') {
    // Use WebCrypto for RSA-PKCS1 signing
    console.log('hashAlgo', `SHA-${hashAlgorithm.replace('sha', '').toUpperCase()}`);

    const signature = await crypto.subtle.sign(
      {
        name: "RSASSA-PKCS1-v1_5",
        hash: { name: `SHA-${hashAlgorithm.replace('sha', '').toUpperCase()}` },
      },
      keyPair.privateKey,
      new Uint8Array(eContent)
    );

    // RSA signatures are already in DER format
    return Array.from(new Uint8Array(signature));
  }
  else if (signatureAlgorithm === 'rsapss') {
    // Extract salt length from certificate details
    const { publicKeyDetails } = parseCertificateSimple(dsc);
    const saltLength = (publicKeyDetails as PublicKeyDetailsRSAPSS).saltLength || 32;

    // Use WebCrypto for RSA-PSS signing
    const signature = await crypto.subtle.sign(
      {
        name: "RSASSA-PSS",
        saltLength: Number(saltLength),
        hash: {
          name: `SHA-${hashAlgorithm.replace('sha', '').toUpperCase()}`
        }
      } as RsaPssParams,
      keyPair.privateKey,
      new Uint8Array(eContent)
    );

    // RSA-PSS signatures are already in the correct format
    return Array.from(new Uint8Array(signature));
  }

  throw new Error(`Signature algorithm ${signatureAlgorithm} not yet implemented`);
}
