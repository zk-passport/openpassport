import os
import json
import re


# Paths
path_to_plain_text_csca_certificates = "outputs/unique_txt_fr"
path_to_json_output = "outputs/csca_aki_filename_fr.json"

development_mode = False
    
mockCscaList = [
    '../common/src/mock_certificates/sha256_rsa_4096/mock_csca.txt',
    '../common/src/mock_certificates/sha256_rsa_2048/mock_csca.txt',
]

def map_aki_to_filename(folder_path):
    aki_to_filename = {}
    ski_pattern = re.compile(r"Subject Key Identifier:\s+([0-9A-F:]+)")
    
    def process_file(file_path):
        with open(file_path, 'r') as file:
            content = file.read()
            if "ecdsa" in content.lower() or "id-ecpublickey" in content.lower(): 
                print(f"skipping {file_path} as it is an ECDSA certificate")
                return
            if "6144 bit" in content: # skip 6144 bit certificates for the moment
                return
            ski_match = ski_pattern.search(content)
            if ski_match:
                ski_value = ski_match.group(1)
                aki_to_filename[ski_value] = os.path.basename(file_path)
            else:
                print(f"Filename: {file_path}, Missing: Subject Key Identifier")

    for filename in os.listdir(folder_path):
        if filename.endswith(".txt"):
            file_path = os.path.join(folder_path, filename)
            process_file(file_path)

    if development_mode:
        for mock_file in mockCscaList:
            if not os.path.exists(mock_file):
                print(f"File not found: {mock_file}")
                continue
            print(f"Processing mock file: {mock_file}")
            process_file(mock_file)

    with open(path_to_json_output, 'w') as json_file:
        json.dump(aki_to_filename, json_file, indent=4)

map_aki_to_filename(path_to_plain_text_csca_certificates)
