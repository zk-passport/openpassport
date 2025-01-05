#!/bin/bash

# Function to generate certificates based on algorithm parameters
generate_certificates() {
    local hash=$1
    local sig_alg=$2
    local exp=$3      # exponent comes first for regular RSA
    local bits=$4     # bits for RSA
    local salt=""     # salt is only for rsapss

    # For rsapss, reorder parameters: salt is $3, exp is $4, bits is $5
    if [ "$sig_alg" = "rsapss" ]; then
        salt=$3
        exp=$4
        bits=$5
    fi

    # Construct directory name based on parameters
    if [ "$sig_alg" = "ecdsa" ]; then
        dir_name="${hash}_${sig_alg}_${exp}"  # exp is curve name for ECDSA
    elif [ "$sig_alg" = "rsapss" ]; then
        dir_name="${hash}_${sig_alg}_${salt}_${exp}_${bits}"
    else
        dir_name="${hash}_${sig_alg}_${exp}_${bits}"  # regular RSA
    fi

    echo "Generating certificates for: $dir_name"
    
    # Create directory
    mkdir -p "$dir_name"
    cd "$dir_name"

    # Remove any existing files
    rm -f *.pem *.key *.csr

    # Generate certificates based on algorithm type
    if [ "$sig_alg" = "ecdsa" ]; then
        # Generate ECDSA key and certificate
        openssl ecparam -name $exp -genkey -noout -out mock_csca_key.pem
        openssl req -new -x509 -key mock_csca_key.pem -out mock_csca.pem \
            -days 3650 -sha${hash#sha} \
            -subj "/C=FR/ST=IDF/L=Paris/O=Mock CSCA/OU=PKI/CN=Mock CSCA"
    else
        # Generate RSA key and certificate
        if [ "$sig_alg" = "rsapss" ]; then
            openssl genpkey -algorithm RSA-PSS -pkeyopt rsa_keygen_bits:$bits \
                -pkeyopt rsa_keygen_pubexp:$exp -out mock_csca_key.pem
            openssl req -new -x509 -key mock_csca_key.pem -out mock_csca.pem \
                -days 3650 -sha${hash#sha} -sigopt rsa_padding_mode:pss \
                -sigopt rsa_pss_saltlen:$salt \
                -subj "/C=FR/ST=IDF/L=Paris/O=Mock CSCA/OU=PKI/CN=Mock CSCA"
        else
            openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:$bits \
                -pkeyopt rsa_keygen_pubexp:$exp -out mock_csca_key.pem
            openssl req -new -x509 -key mock_csca_key.pem -out mock_csca.pem \
                -days 3650 -sha${hash#sha} \
                -subj "/C=FR/ST=IDF/L=Paris/O=Mock CSCA/OU=PKI/CN=Mock CSCA"
        fi
    fi

    cd ..
}

# Create certificates for RSA
generate_certificates "sha1" "rsa" "65537" "4096"
generate_certificates "sha1" "rsa" "3" "4096"
generate_certificates "sha256" "rsa" "65537" "4096"
generate_certificates "sha384" "rsa" "65537" "4096"
generate_certificates "sha512" "rsa" "65537" "4096"
generate_certificates "sha1" "rsa" "65537" "6144"

# Create certificates for RSA-PSS with correct parameter order (hash, sig_alg, salt, exp, bits)
generate_certificates "sha256" "rsapss" "32" "65537" "4096"
generate_certificates "sha256" "rsapss" "32" "3" "4096"
generate_certificates "sha384" "rsapss" "48" "65537" "4096"
generate_certificates "sha512" "rsapss" "64" "65537" "4096"

# Create certificates for ECDSA
generate_certificates "sha1" "ecdsa" "secp256r1"
generate_certificates "sha1" "ecdsa" "brainpoolP256r1"
generate_certificates "sha256" "ecdsa" "brainpoolP256r1"
generate_certificates "sha384" "ecdsa" "brainpoolP384r1"
generate_certificates "sha512" "ecdsa" "brainpoolP512r1"
generate_certificates "sha256" "ecdsa" "secp256r1"
generate_certificates "sha384" "ecdsa" "secp384r1"
generate_certificates "sha512" "ecdsa" "secp521r1"