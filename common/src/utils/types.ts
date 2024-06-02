export type PassportData = {
  mrz: string;
  signatureAlgorithm: string;
  pubKey: {modulus?: string, exponent?: string, curveName?: string, publicKeyQ?: string};
  dataGroupHashes: number[];
  eContent: number[];
  encryptedDigest: number[];
  photoBase64: string;
};

export type PassportData_ECDSA = {
  mrz: string;
  signatureAlgorithm: string;
  dataGroupHashes: number[];
  pubKey: {x: Uint8Array, y: Uint8Array, curveName?: string};
  eContent: number[];
  signature: {r: Uint8Array, s: Uint8Array};
  photoBase64: string;
}

export type Proof = {
  proof: {
    a: [string, string],
    b: [[string, string], [string, string]],
    c: [string, string]
  };
  pub_signals: string[];
}