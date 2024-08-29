import assert from 'assert';
import { PassportData } from '../../../common/src/utils/types';
import {
  hash,
  assembleEContent,
  formatAndConcatenateDataHashes,
  formatMrz,
  arraysAreEqual,
  findSubarrayIndex,
  getHashLen,
} from '../../../common/src/utils/utils';
import elliptic from 'elliptic';
import * as asn1 from 'asn1js';
import { Certificate } from 'pkijs';
import { mock_dsc_key_sha256_ecdsa, mock_dsc_sha256_ecdsa } from "../../src/constants/mockCertificates";
import { getSignatureAlgorithm } from '../../src/utils/handleCertificate';
import { sampleDataHashes_large } from '../../src/constants/sampleDataHashes';

const sampleMRZ =
  'P<FRADUPONT<<ALPHONSE<HUGUES<ALBERT<<<<<<<<<24HB818324FRA0402111M3111115<<<<<<<<<<<<<<02';

export function genMockPassportData_sha256_ecdsa(): PassportData {
  const { hashFunction } = getSignatureAlgorithm(mock_dsc_sha256_ecdsa);
  const hashLen = getHashLen(hashFunction);

  const mrzHash = hash(hashFunction, formatMrz(sampleMRZ));
  sampleDataHashes_large.unshift([1, mrzHash]);
  const concatenatedDataHashes = formatAndConcatenateDataHashes(
    [[1, mrzHash], ...sampleDataHashes_large],
    hashLen,
    33
  );
  const eContent = assembleEContent(hash(hashFunction, concatenatedDataHashes));

  const privateKeyDer = Buffer.from(mock_dsc_key_sha256_ecdsa.replace(/-----BEGIN EC PRIVATE KEY-----|\n|-----END EC PRIVATE KEY-----/g, ''), 'base64');
  const asn1Data = asn1.fromBER(privateKeyDer);
  const privateKeyBuffer = (asn1Data.result.valueBlock as any).value[1].valueBlock.valueHexView;

  const ec = new elliptic.ec('p256');
  const keyPair = ec.keyFromPrivate(privateKeyBuffer);

  const eContentHash = hash(hashFunction, eContent);
  const signature = keyPair.sign(eContentHash);
  const signatureBytes = signature.toDER();

  return {
    mrz: sampleMRZ,
    dsc: mock_dsc_sha256_ecdsa,
    dataGroupHashes: concatenatedDataHashes,
    eContent: eContent,
    encryptedDigest: Array.from(Buffer.from(signatureBytes, 'hex')),
    photoBase64: 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABjElEQVR42mL8//8/AyUYiBQYmIw3...',
  };
}

function verify(passportData: PassportData): boolean {
  const { mrz, dsc, dataGroupHashes, eContent, encryptedDigest } = passportData;
  const { hashFunction } = getSignatureAlgorithm(mock_dsc_sha256_ecdsa);
  const hashLen = getHashLen(hashFunction);

  const mrzHash = hash(hashFunction, formatMrz(mrz));
  const dg1HashOffset = findSubarrayIndex(dataGroupHashes, mrzHash);
  assert(dg1HashOffset !== -1, 'MRZ hash index not found in dataGroupHashes');

  const concatHash = hash(hashFunction, dataGroupHashes);
  assert(
    arraysAreEqual(concatHash, eContent.slice(eContent.length - hashLen)),
    'concatHash is not at the right place in eContent'
  );

  const certBuffer = Buffer.from(dsc.replace(/(-----(BEGIN|END) CERTIFICATE-----|\n)/g, ''), 'base64');
  const asn1Data = asn1.fromBER(certBuffer);
  const cert = new Certificate({ schema: asn1Data.result });
  const publicKeyInfo = cert.subjectPublicKeyInfo;
  const publicKeyBuffer = publicKeyInfo.subjectPublicKey.valueBlock.valueHexView;

  const ec = new elliptic.ec('p256');
  const key = ec.keyFromPublic(publicKeyBuffer);

  const eContentHash = hash(hashFunction, eContent);
  const signature = Buffer.from(encryptedDigest).toString('hex');

  return key.verify(eContentHash, signature);
}

const passportData = genMockPassportData_sha256_ecdsa();
console.log('verify', verify(passportData));