# Master list generator

## What is it?
This script will create a file containing a set of unique CSCA (Country Signing Certificate Authority) certificates in PEM format from a country master List or the ICAO PKD repository.

These are used to verify both Document Signing certificates and Security Object DS Signatures (SOD) contained in e-passports and other electronic identity cards.

It can accept either the ICOA PDK master list file in LDIF format (which is a collection of master lists from validated countries), or a single Country masterlist file in Cryptographic Message Syntax (CMS) format.

# Where can I get a master list from?
ICAO makes their master lists available "freely available online to any person or State who wishes to download it. However, the process of downloading is manual and cannot be automated" (https://www.icao.int/Security/FAL/PKD/BVRT/Pages/Access.aspx) 

The master lists can be downloaded from: https://download.pkd.icao.int (previously was https://pkddownloadsg.icao.int but this seems to be unavailable now)

These are in LDIF (LDAP Data Interchange Format) format

Additionally, some countries make their master lists available (e.g. Germany, France and Italy are ones I've found). Do a search for <country> masterlist or the JMRTD project has a list (some links no longer work though) - https://jmrtd.org/certificates.shtml Yobi Wifi

These files will usually be zipped, so extract these files and you should end up with a <file>.ml.
 
 Obviously you should only use masterlists from a source you trust!

## Requirements

The script uses Python 3.7 (other versions of Python 3 may work - not tried).


It also requires a version of OpenSSL that supports the CMS flag.

The version that comes with macOS (including Catalina) doesn't support this so you will need to get that from somewhere else (e.g. Homebrew).

## Usage
To run the script, simply run:
python extract.py [Country master list.ml|ICAO LDIF file]

    e.g.
    python extract.py icaopkd-002-ml-000119.ldif


It will run through the masterlist(s) contained within the file and you should end up with a new masterList.pem file which is a concatenation of all the unique certificates.

This can then be imported into the NFCPassportReader app and used to verify an e-passport using Passive Authentication.

## Credits
This script is pretty much based on the details from http://wiki.yobi.be/wiki/EPassport with some additional bits for de-duplicating certificates. 
