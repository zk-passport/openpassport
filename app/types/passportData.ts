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
  mrz: string;
  modulus: string;
  dataGroupHashes: DataHash[];
  eContent: number[];
  encryptedDigest: number[];
};
