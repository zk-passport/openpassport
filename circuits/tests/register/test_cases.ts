// Define the interface for test cases with optional saltLength
export interface TestCase {
  dgHashAlgo: string;
  eContentHashAlgo: string;
  sigAlg: string;
  hashFunction: string;
  domainParameter: string;
  keyLength: string;
  saltLength?: string; // Optional salt length for RSA-PSS
}

export const sigAlgs: TestCase[] = [
  {
    dgHashAlgo: 'sha256',
    eContentHashAlgo: 'sha256',
    hashFunction: 'sha256',
    sigAlg: 'rsapss',
    domainParameter: '65537',
    keyLength: '2048',
    saltLength: '64', // Denmark
  },
];

export const fullSigAlgs: TestCase[] = [
  // RSA
  {
    dgHashAlgo: 'sha1',
    eContentHashAlgo: 'sha1',
    hashFunction: 'sha1',
    sigAlg: 'rsa',
    domainParameter: '65537',
    keyLength: '2048',
  },
  {
    dgHashAlgo: 'sha1',
    eContentHashAlgo: 'sha256',
    hashFunction: 'sha256',
    sigAlg: 'rsa',
    domainParameter: '65537',
    keyLength: '2048',
  },
  {
    dgHashAlgo: 'sha256',
    eContentHashAlgo: 'sha256',
    hashFunction: 'sha256',
    sigAlg: 'rsa',
    domainParameter: '3',
    keyLength: '2048',
  },
  {
    dgHashAlgo: 'sha256',
    eContentHashAlgo: 'sha256',
    hashFunction: 'sha256',
    sigAlg: 'rsa',
    domainParameter: '65537',
    keyLength: '2048',
  },
  {
    dgHashAlgo: 'sha512',
    eContentHashAlgo: 'sha512',
    hashFunction: 'sha256',
    sigAlg: 'rsa',
    domainParameter: '65537',
    keyLength: '4096',
  },
  {
    dgHashAlgo: 'sha512',
    eContentHashAlgo: 'sha512',
    hashFunction: 'sha512',
    sigAlg: 'rsa',
    domainParameter: '65537',
    keyLength: '2048',
  },
  // RSAPSS
  {
    dgHashAlgo: 'sha256',
    eContentHashAlgo: 'sha256',
    hashFunction: 'sha256',
    sigAlg: 'rsapss',
    domainParameter: '3',
    keyLength: '2048',
  },
  {
    dgHashAlgo: 'sha256',
    eContentHashAlgo: 'sha256',
    hashFunction: 'sha256',
    sigAlg: 'rsapss',
    domainParameter: '65537',
    keyLength: '2048',
  },
  {
    dgHashAlgo: 'sha256',
    eContentHashAlgo: 'sha256',
    hashFunction: 'sha256',
    sigAlg: 'rsapss',
    domainParameter: '65537',
    keyLength: '2048',
    saltLength: '64', // Denmark
  },
  {
    dgHashAlgo: 'sha256',
    eContentHashAlgo: 'sha256',
    hashFunction: 'sha256',
    sigAlg: 'rsapss',
    domainParameter: '65537',
    keyLength: '3072',
  },
  {
    dgHashAlgo: 'sha384',
    eContentHashAlgo: 'sha384',
    hashFunction: 'sha384',
    sigAlg: 'rsapss',
    domainParameter: '65537',
    keyLength: '2048',
  },
  {
    dgHashAlgo: 'sha512',
    eContentHashAlgo: 'sha512',
    hashFunction: 'sha512',
    sigAlg: 'rsapss',
    domainParameter: '65537',
    keyLength: '2048',
  },
  // ECDSA
  // brainpool
  {
    dgHashAlgo: 'sha1',
    eContentHashAlgo: 'sha1',
    hashFunction: 'sha1',
    sigAlg: 'ecdsa',
    domainParameter: 'brainpoolP224r1',
    keyLength: '224',
  },
  {
    dgHashAlgo: 'sha224',
    eContentHashAlgo: 'sha224',
    hashFunction: 'sha224',
    sigAlg: 'ecdsa',
    domainParameter: 'brainpoolP224r1',
    keyLength: '224',
  },
  {
    dgHashAlgo: 'sha256',
    eContentHashAlgo: 'sha256',
    hashFunction: 'sha256',
    sigAlg: 'ecdsa',
    domainParameter: 'brainpoolP256r1',
    keyLength: '256',
  },
  {
    dgHashAlgo: 'sha256',
    eContentHashAlgo: 'sha256',
    hashFunction: 'sha256',
    sigAlg: 'ecdsa',
    domainParameter: 'brainpoolP384r1',
    keyLength: '384',
  },
  {
    dgHashAlgo: 'sha384',
    eContentHashAlgo: 'sha384',
    hashFunction: 'sha384',
    sigAlg: 'ecdsa',
    domainParameter: 'brainpoolP384r1',
    keyLength: '384',
  },
  {
    dgHashAlgo: 'sha384',
    eContentHashAlgo: 'sha384',
    hashFunction: 'sha384',
    sigAlg: 'ecdsa',
    domainParameter: 'brainpoolP512r1',
    keyLength: '512',
  },
  {
    dgHashAlgo: 'sha512',
    eContentHashAlgo: 'sha512',
    hashFunction: 'sha512',
    sigAlg: 'ecdsa',
    domainParameter: 'brainpoolP512r1',
    keyLength: '512',
  },
  // secp
  {
    dgHashAlgo: 'sha1',
    eContentHashAlgo: 'sha1',
    hashFunction: 'sha1',
    sigAlg: 'ecdsa',
    domainParameter: 'secp256r1',
    keyLength: '256',
  },
  {
    dgHashAlgo: 'sha256',
    eContentHashAlgo: 'sha224',
    hashFunction: 'sha224',
    sigAlg: 'ecdsa',
    domainParameter: 'secp224r1',
    keyLength: '224',
  },
  {
    dgHashAlgo: 'sha256',
    eContentHashAlgo: 'sha256',
    hashFunction: 'sha256',
    sigAlg: 'ecdsa',
    domainParameter: 'secp256r1',
    keyLength: '256',
  },
  {
    dgHashAlgo: 'sha256',
    eContentHashAlgo: 'sha256',
    hashFunction: 'sha256',
    sigAlg: 'ecdsa',
    domainParameter: 'secp384r1',
    keyLength: '384',
  },
  {
    dgHashAlgo: 'sha384',
    eContentHashAlgo: 'sha384',
    hashFunction: 'sha384',
    sigAlg: 'ecdsa',
    domainParameter: 'secp384r1',
    keyLength: '384',
  },
  {
    dgHashAlgo: 'sha512',
    eContentHashAlgo: 'sha512',
    hashFunction: 'sha512',
    sigAlg: 'ecdsa',
    domainParameter: 'secp521r1',
    keyLength: '521',
  },
];
