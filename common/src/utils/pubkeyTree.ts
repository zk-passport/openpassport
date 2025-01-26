import { SignatureAlgorithmIndex } from '../constants/constants';
import { LeanIMT } from '@openpassport/zk-kit-lean-imt';
import { poseidon2 } from 'poseidon-lite';
import { parseCertificateSimple } from './certificate_parsing/parseCertificateSimple';
import {
  PublicKeyDetailsECDSA,
  PublicKeyDetailsRSA,
} from './certificate_parsing/dataStructure';
import { PassportData, SignatureAlgorithm } from './types';
import { getNAndK, getNAndKCSCA } from './passports/passport';
import { splitToWords } from './bytes';
import { hexToDecimal } from './bytes';
import { customHasher } from './hash';
import { parseDscCertificateData } from './passports/passport_parsing/parseDscCertificateData';


export function getLeaf(dsc: string): string {
  const parsedCertificate = parseCertificateSimple(dsc);

  const signatureAlgorithm = parsedCertificate.signatureAlgorithm;

  const { publicKeyDetails } = parsedCertificate;

  const { n, k } = getNAndKCSCA(signatureAlgorithm as any);

  if (signatureAlgorithm === 'ecdsa') {
    const { x, y } = publicKeyDetails as PublicKeyDetailsECDSA;
    let qx = splitToWords(BigInt(hexToDecimal(x)), n, k);
    let qy = splitToWords(BigInt(hexToDecimal(y)), n, k);
    return customHasher([...qx, ...qy]);
  } else {
    const { modulus } = publicKeyDetails as PublicKeyDetailsRSA;

    const pubkeyChunked = splitToWords(BigInt(hexToDecimal(modulus)), n, k);
    return customHasher([...pubkeyChunked]);
  }
}

export function getLeafDSCFromPassportData(passportData: PassportData): string {
  if (!passportData.parsed) {
    throw new Error('Passport data not parsed');
  }
  if (!passportData.passportMetadata.cscaFound) {
    throw new Error('CSCA not found');
  }
  return getLeafDscFromDSCAndCsca(passportData.passportMetadata.dsc, passportData.passportMetadata.csca);
}

export function getLeafDsc(dsc: string): string {
  const parsedDsc = parseCertificateSimple(dsc);
  const parsedDscCertificateData = parseDscCertificateData(parsedDsc);
  return getLeafDscFromDSCAndCsca(dsc, parsedDscCertificateData.csca);
}


function getLeafDscFromDSCAndCsca(dsc: string, csca: string): string {
  const leafDSC = getLeaf(dsc);
  const leafCSCA = getLeaf(csca);
  return poseidon2([leafDSC, leafCSCA]).toString();
}

export async function fetchTreeFromUrl(url: string): Promise<LeanIMT> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const commitmentMerkleTree = await response.json();
  console.log('\x1b[90m%s\x1b[0m', 'commitment merkle tree: ', commitmentMerkleTree);
  const tree = LeanIMT.import((a, b) => poseidon2([a, b]), commitmentMerkleTree);
  return tree;
}
