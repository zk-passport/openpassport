export type MrzInfo = {
  compositeCheckDigit: string;
  dateOfBirth: string;
  dateOfBirthCheckDigit: string;
  dateOfExpiry: string;
  dateOfExpiryCheckDigit: string;
  documentCode: string;
  documentNumber: string;
  documentNumberCheckDigit: string;
  documentType: number;
  gender: string;
  issuingState: string;
  nationality: string;
  optionalData1: string;
  primaryIdentifier: string;
  secondaryIdentifier: string;
};

export type DataHash = [number, number[]];

export type PassportData = {
  mrzInfo: MrzInfo;
  publicKey: any;
  publicKeyPEM: string;
  dataGroupHashes: DataHash[];
  eContent: any;
  encryptedDigest: any;
  contentBytes: any;
  eContentDecomposed: any;
};
