import { parseCertificate } from "../../common/src/utils/certificate_parsing/parseCertificate";
import path from 'path';
import fs from 'fs';
const csca_path = path.join(__dirname, '..', 'outputs', 'csca', 'pem_masterlist');
const csca_augmented_path = path.join(__dirname, '..', 'outputs', 'csca', 'pem_masterlist_augmented');
const dsc_path = path.join(__dirname, '..', 'outputs', 'dsc', 'pem_masterlist');
import { CertificateData } from "../../common/src/utils/certificate_parsing/dataStructure";
import countries from 'i18n-iso-countries';
function main(arg: string) {

    // CSCA certificates
    if (arg === 'csca') {
        function getIssuerCountryToAmountOfCertificates(certificates: { [key: string]: CertificateData }) {
            const issuerCountryToAmountOfCertificates = new Map<string, number>();
            for (const certificate of Object.values(certificates)) {
                const issuerCountry = countries.getName(certificate.issuer, 'en') === undefined ? certificate.issuer : countries.getName(certificate.issuer, 'en');
                if (issuerCountryToAmountOfCertificates.has(issuerCountry)) {
                    issuerCountryToAmountOfCertificates.set(issuerCountry, issuerCountryToAmountOfCertificates.get(issuerCountry)! + 1);
                } else {
                    issuerCountryToAmountOfCertificates.set(issuerCountry, 1);
                }
            }
            return issuerCountryToAmountOfCertificates;
        }

        const csca_certificates = getCertificateDataMap(csca_path);
        const csca_augmented_certificates = getCertificateDataMap(csca_augmented_path);
        const issuerCountryToAmountOfCertificates = getIssuerCountryToAmountOfCertificates(csca_certificates);
        const csca_augmented_issuerCountryToAmountOfCertificates = getIssuerCountryToAmountOfCertificates(csca_augmented_certificates);
        const list_of_issuer_presents_in_csca_augmented_and_not_in_csca = Array.from(csca_augmented_issuerCountryToAmountOfCertificates.entries())
            .filter(([issuer, amount]) => !issuerCountryToAmountOfCertificates.has(issuer))
            .map(([issuer, amount]) => issuer);

        console.log('list of issuers presents in csca_augmented and not in csca', list_of_issuer_presents_in_csca_augmented_and_not_in_csca);

        const sortedEntries = Array.from(issuerCountryToAmountOfCertificates.entries())
            .sort((a, b) => a[0].localeCompare(b[0]));
        const sortedMap = new Map(sortedEntries);

        const sortedEntries_csca_augmented = Array.from(csca_augmented_issuerCountryToAmountOfCertificates.entries())
            .sort((a, b) => a[0].localeCompare(b[0]));
        const sortedMap_csca_augmented = new Map(sortedEntries_csca_augmented);

        console.log('Number of unique issuers:', sortedMap.size);
        console.log('Number of unique issuers in csca_augmented:', sortedMap_csca_augmented.size);

        const mapAsObject = Object.fromEntries(sortedMap);
        const mapAsObject_csca_augmented = Object.fromEntries(sortedMap_csca_augmented);
        const outputDir = path.join(__dirname, '..', 'outputs', 'csca', 'parsing');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        fs.writeFileSync(
            path.join(outputDir, 'issuer_country_to_amount_of_certificates.json'),
            JSON.stringify(mapAsObject, null, 2)
        );
        fs.writeFileSync(
            path.join(outputDir, 'issuer_country_to_amount_of_certificates_csca_augmented.json'),
            JSON.stringify(mapAsObject_csca_augmented, null, 2)
        );

        console.log('\nProcessed certificates:', Object.keys(csca_certificates).length);


    }
}

const arg = process.argv[2];
main(arg);


function getCertificateDataMap(directoryPath: string) {
    const certificates: { [key: string]: CertificateData } = {};
    const seenSKIs = new Set<string>();
    const duplicates: string[] = [];

    const files = fs.readdirSync(directoryPath);
    for (const file of files) {
        const pemContent = fs.readFileSync(path.join(directoryPath, file), 'utf8');
        try {
            const certificate = parseCertificate(pemContent, file);
            if (certificate) {
                certificates[certificate.subjectKeyIdentifier] = certificate;
            }
        }
        catch (error) {
            console.log(error);
            // console.log('\x1b[90m%s\x1b[0m', `certificate ${file} is invalid.`);
        }
    }

    if (duplicates.length > 0) {
        console.log('\x1b[33m%s\x1b[0m', `\nFound ${duplicates.length} duplicate certificates (by SKI):`);
        duplicates.forEach(file => console.log('\x1b[33m%s\x1b[0m', `- ${file}`));
    }
    return certificates;
}
