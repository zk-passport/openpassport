import { Crypto } from "@peculiar/webcrypto";
import * as x509 from '@peculiar/x509';
import { SignatureAlgorithm, SignatureAlgorithmCSCA } from './types';
import {
    mock_csca_sha1_ecdsa_secp256r1,
    mock_csca_sha1_ecdsa_secp256r1_key,
    mock_csca_sha256_ecdsa_secp256r1,
    mock_csca_sha256_ecdsa_secp256r1_key,
    mock_csca_sha384_ecdsa_secp384r1,
    mock_csca_sha384_ecdsa_secp384r1_key,
    mock_csca_sha512_ecdsa_secp521r1,
    mock_csca_sha512_ecdsa_secp521r1_key,
    mock_csca_sha1_brainpoolP256r1,
    mock_csca_sha1_brainpoolP256r1_key,
    mock_csca_sha256_ecdsa_brainpoolP256r1,
    mock_csca_sha256_ecdsa_brainpoolP256r1_key,
    mock_csca_sha384_ecdsa_brainpoolP384r1,
    mock_csca_sha384_ecdsa_brainpoolP384r1_key,
    mock_csca_sha512_ecdsa_brainpoolP512r1,
    mock_csca_sha512_ecdsa_brainpoolP512r1_key,
    mock_csca_sha256_rsapss_32_3_4096,
    mock_csca_sha256_rsapss_32_3_4096_key,
    mock_csca_sha256_rsa_65537_4096,
    mock_csca_sha256_rsa_65537_4096_key,
    mock_csca_sha384_rsa_65537_4096,
    mock_csca_sha384_rsa_65537_4096_key,
    mock_csca_sha512_rsa_65537_4096,
    mock_csca_sha512_rsa_65537_4096_key,
    mock_csca_sha1_rsa_3_4096,
    mock_csca_sha1_rsa_3_4096_key

} from '../constants/mockCertificates';
import { getCurveForPecularX509 } from "./certificate_parsing/curves";

const crypto = new Crypto();
x509.cryptoProvider.set(crypto);

interface CertificateResult {
    dsc: string;
    dscKeyPair: CryptoKeyPair;
}

export async function generateCertificate(signatureType: SignatureAlgorithm, signatureTypeCSCA: SignatureAlgorithmCSCA): Promise<CertificateResult> {
    let privateKeyPem: string;
    let csca: string;
    // Get the private key PEM based on signature type
    switch (signatureTypeCSCA) {
        case 'rsa_sha256_65537_4096':
            privateKeyPem = mock_csca_sha256_rsa_65537_4096_key;
            csca = mock_csca_sha256_rsa_65537_4096;
            break;
        case 'rsapss_sha256_32_65537_4096':
            privateKeyPem = mock_csca_sha256_rsapss_32_3_4096_key;
            csca = mock_csca_sha256_rsapss_32_3_4096;
            break;
        case 'ecdsa_sha256_secp256r1_256':
            privateKeyPem = mock_csca_sha256_ecdsa_secp256r1_key;
            csca = mock_csca_sha256_ecdsa_secp256r1;
            break;
        case 'ecdsa_sha384_secp384r1_384':
            privateKeyPem = mock_csca_sha384_ecdsa_secp384r1_key;
            csca = mock_csca_sha384_ecdsa_secp384r1;
            break;
        case 'ecdsa_sha512_brainpoolP512r1_512':
            privateKeyPem = mock_csca_sha512_ecdsa_brainpoolP512r1_key;
            csca = mock_csca_sha512_ecdsa_brainpoolP512r1;
            break;
        case 'rsa_sha512_65537_4096':
            privateKeyPem = mock_csca_sha512_rsa_65537_4096_key;
            csca = mock_csca_sha512_rsa_65537_4096;
            break;
        case 'ecdsa_sha1_secp256r1_256':
            privateKeyPem = mock_csca_sha1_ecdsa_secp256r1_key;
            csca = mock_csca_sha1_ecdsa_secp256r1;
            break;
        case 'ecdsa_sha512_secp521r1_521':
            privateKeyPem = mock_csca_sha512_ecdsa_secp521r1_key;
            csca = mock_csca_sha512_ecdsa_secp521r1;
            break;
        case 'ecdsa_sha1_brainpoolP256r1_256':
            privateKeyPem = mock_csca_sha1_brainpoolP256r1_key;
            csca = mock_csca_sha1_brainpoolP256r1;
            break;
        case 'ecdsa_sha256_brainpoolP256r1_256':
            privateKeyPem = mock_csca_sha256_ecdsa_brainpoolP256r1_key;
            csca = mock_csca_sha256_ecdsa_brainpoolP256r1;
            break;
        case 'ecdsa_sha384_brainpoolP384r1_384':
            privateKeyPem = mock_csca_sha384_ecdsa_brainpoolP384r1_key;
            csca = mock_csca_sha384_ecdsa_brainpoolP384r1;
            break;
        case 'rsa_sha384_65537_4096':
            privateKeyPem = mock_csca_sha384_rsa_65537_4096_key;
            csca = mock_csca_sha384_rsa_65537_4096;
            break;
        case 'rsa_sha1_3_4096':
            privateKeyPem = mock_csca_sha1_rsa_3_4096_key;
            csca = mock_csca_sha1_rsa_3_4096;
            break;
        default:
            throw new Error(`Unsupported signature type: ${signatureTypeCSCA}`);
    }

    // Define the signing algorithm based on CSCA type
    let signingAlgorithm: any;
    if (signatureTypeCSCA.split('_')[0] === 'rsapss') {
        signingAlgorithm = {
            name: "RSASSA-PSS",
            hash: { name: `SHA-${signatureTypeCSCA.split('_')[1].replace('sha', '').toUpperCase()}` },
            saltLength: parseInt(signatureTypeCSCA.split('_')[2]),
        };
    } else if (signatureTypeCSCA.split('_')[0] === 'rsa') {
        signingAlgorithm = {
            name: "RSASSA-PKCS1-v1_5",
            hash: { name: `SHA-${signatureTypeCSCA.split('_')[1].replace('sha', '').toUpperCase()}` },
        };
    } else if (signatureTypeCSCA.split('_')[0] === 'ecdsa') {
        signingAlgorithm = {
            name: "ECDSA",
            hash: { name: `SHA-${signatureTypeCSCA.split('_')[1].replace('sha', '').toUpperCase()}` },
            namedCurve: signatureTypeCSCA.split('_')[2].toUpperCase(),
        };
    }

    // Convert PEM to binary for CSCA key
    const pemContents = privateKeyPem
        .split('\n')
        .filter(line => !line.includes('BEGIN') && !line.includes('END'))
        .join('');
    const binaryDer = Buffer.from(pemContents, 'base64');

    // Import CSCA signing key
    const cscaSigningKey = await crypto.subtle.importKey(
        'pkcs8',
        binaryDer,
        signingAlgorithm,
        false,
        ['sign']
    );

    // Generate DSC key pair
    let dscKeyPair: CryptoKeyPair;
    if (signatureType.split('_')[0] === 'ecdsa') {
        dscKeyPair = await crypto.subtle.generateKey(
            {
                name: "ECDSA",
                namedCurve: getCurveForPecularX509(signatureType.split('_')[2]),
                hash: { name: `SHA-${signatureType.split('_')[1].replace('sha', '').toUpperCase()}` },
            },
            true,
            ["sign", "verify"]
        );
    } else if (signatureType.split('_')[0] === 'rsa') {
        const exponent = signatureType.split('_')[2] === '65537' ? new Uint8Array([0x01, 0x00, 0x01]) : new Uint8Array([0x03]);
        console.log('exponent', exponent);
        dscKeyPair = await crypto.subtle.generateKey(
            {
                name: "RSASSA-PKCS1-v1_5",
                modulusLength: parseInt(signatureType.split('_')[3]),
                publicExponent: exponent,
                hash: { name: `SHA-${signatureType.split('_')[1].replace('sha', '').toUpperCase()}` },
            },
            true,
            ["sign", "verify"]
        );
    }
    else if (signatureType.split('_')[0] === 'rsapss') {
        console.log('signatureType', signatureType);
        const modulusLength = parseInt(signatureType.split('_')[4]);
        const exponent = signatureType.split('_')[3] === '65537' ?
            new Uint8Array([0x01, 0x00, 0x01]) : new Uint8Array([0x03]);
        const saltLength = parseInt(signatureType.split('_')[2]);

        const keyGenParams = {
            name: "RSA-PSS",
            modulusLength: modulusLength,
            publicExponent: exponent,
            hash: { name: `SHA-${signatureType.split('_')[1].replace('sha', '').toUpperCase()}` }
        };

        dscKeyPair = await crypto.subtle.generateKey(
            keyGenParams,
            true,
            ["sign", "verify"]
        );

        // Update the signing algorithm for RSA-PSS
        signingAlgorithm = {
            name: "RSA-PSS",
            hash: {
                name: `SHA-${signatureType.split('_')[1].replace('sha', '').toUpperCase()}`
            },
            saltLength: saltLength, // e.g. 32 bytes
        };
    }

    // Create DSC certificate
    const dscCert = await x509.X509CertificateGenerator.create({
        serialNumber: "02",
        subject: new x509.Name("CN=Mock DSC"),
        issuer: new x509.Name("CN=Mock CSCA"),
        notBefore: new Date(),
        notAfter: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        signingAlgorithm,               // The RSA-PSS parameters (with saltLength)
        publicKey: dscKeyPair.publicKey,
        signingKey: cscaSigningKey,     // The CA’s private key
        extensions: [
            new x509.BasicConstraintsExtension(false, undefined, true),
            new x509.KeyUsagesExtension(
                x509.KeyUsageFlags.digitalSignature |
                x509.KeyUsageFlags.keyCertSign,
                true
            ),
            await x509.SubjectKeyIdentifierExtension.create(dscKeyPair.publicKey),
            new x509.ExtendedKeyUsageExtension(["2.23.136.1.1.1"], true),
        ],
    });
    console.log('dscCert', dscCert.toString('text'));

    return {
        dsc: dscCert.toString('pem'),
        dscKeyPair
    };
}
