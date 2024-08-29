import { writeFileSync } from "fs";
import { genMockPassportData_sha256_rsa_65537, verify_sha256_rsa_65537 } from "./sha256_rsa_65537";

const sampleMRZ =
  'P<FRADUPONT<<ALPHONSE<HUGUES<ALBERT<<<<<<<<<24HB818324FRA0402111M3111115<<<<<<<<<<<<<<02';

const mockPassportData = genMockPassportData_sha256_rsa_65537(sampleMRZ);
console.log('Passport Data:', JSON.stringify(mockPassportData, null, 2));
console.log('Signature valid:', verify_sha256_rsa_65537(mockPassportData));

writeFileSync(__dirname + '/passportData.json', JSON.stringify(mockPassportData, null, 2));
