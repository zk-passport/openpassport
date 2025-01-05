import os
import re

def read_certificate_content(file_path):
    with open(file_path, 'r') as f:
        content = f.read()
        # Remove BEGIN and END certificate lines and empty lines
        content = re.sub(r'-----BEGIN CERTIFICATE-----\n', '', content)
        content = re.sub(r'-----END CERTIFICATE-----\n', '', content)
        content = content.strip()
        return content

def read_private_key_content(file_path):
    with open(file_path, 'r') as f:
        content = f.read()
        # Remove BEGIN and END private key lines and empty lines
        content = re.sub(r'-----BEGIN (?:EC )?PRIVATE KEY-----\n', '', content)
        content = re.sub(r'-----END (?:EC )?PRIVATE KEY-----\n', '', content)
        content = content.strip()
        return content

def format_variable_name(dir_name):
    # Split the directory name into components
    parts = dir_name.split('_')
    
    # Handle RSA-PSS certificates differently
    if 'rsapss' in parts:
        if len(parts) == 4:  # Old format: sha256_rsapss_3_4096
            hash_algo = parts[0]
            exp = parts[2]
            bits = parts[3]
            # Default salt length based on hash algorithm
            salt_lengths = {
                'sha256': '32',
                'sha384': '48',
                'sha512': '64'
            }
            salt = salt_lengths.get(hash_algo, '32')
            return f"{hash_algo}_rsapss_{salt}_{exp}_{bits}"
        elif len(parts) == 5:  # New format: sha256_rsapss_3_32_4096
            return dir_name
    
    # Return original name for all other cases (RSA, ECDSA)
    return dir_name

def generate_typescript_file():
    typescript_content = "// Auto-generated file\n\n"
    
    # Process each subdirectory
    for subdir in sorted(os.listdir('.')):
        if os.path.isdir(subdir) and not subdir.startswith('.'):
            cert_path = os.path.join(subdir, 'mock_csca.pem')
            key_path = os.path.join(subdir, 'mock_csca_key.pem')
            
            if os.path.exists(cert_path) and os.path.exists(key_path):
                cert_content = read_certificate_content(cert_path)
                key_content = read_private_key_content(key_path)
                
                # Convert directory name to variable name format with special handling for RSA-PSS
                formatted_name = format_variable_name(subdir)
                var_name = f"mock_csca_{formatted_name}"
                key_var_name = f"{var_name}_key"
                
                typescript_content += f"""export const {var_name} = `{cert_content}`

export const {key_var_name} = `{key_content}`

"""
    
    # Write the TypeScript file
    with open('../constants/mockCertificates.ts', 'w') as f:
        f.write(typescript_content)

# Run the script
generate_typescript_file()