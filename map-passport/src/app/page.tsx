'use client';

import styles from './page.module.css';
import MapChart from '@/components/home-map';
import Grid from '@mui/material/Grid';
import { useEffect, useRef, useState } from 'react';
import { CSSTransition } from 'react-transition-group';

export default function Home() {
  const encryptionNames = {
    sha1WithRSAEncryption: 'Sha1 RSA Encryption',
    sha256WithRSAEncryption: 'Sha256 RSA Encryption',
    sha512WithRSAEncryption: 'Sha512 RSA Encryption',
    'rsassaPss        ': 'RSASSA PSS Encryption',
    'ecdsa-with-SHA1': 'ECDSA with SHA-1',
    'ecdsa-with-SHA256': 'ECDSA with SHA-256',
    'ecdsa-with-SHA384': 'ECDSA with SHA-384',
    'ecdsa-with-SHA512': 'ECDSA with SHA-512',
  };
  const [selectedCountryInfo, setSelectedCountryInfo] = useState([]);
  const [allCountriesData, setAllCountriesData] = useState({});
  const [selectedCountryName, setSelectedCountryName] = useState('');

  const handleToolTip = (countryName: string) => {
    setSelectedCountryName(countryName);
    if (countryName) {
      const selectedCountryInfo = allCountriesData[countryName];
      setSelectedCountryInfo([]);
      if (selectedCountryInfo) {
        setSelectedCountryInfo(selectedCountryInfo);
      }
    }
  };

  // parse details from the json key field
  const parseDistinguishedName = (dn) => {
    const parts = dn.split(', ');
    const obj = {};

    parts.forEach((part) => {
      const [key, value] = part.split('=');
      obj[key] = value;
    });

    return obj;
  };

  const formatJsonData = (input: any = {}, countryNames: any = {}): any => {
    delete input?.default;
    const signedInfo: any = [];

    for (const inputData of Object.entries(input)) {
      const encryptionData = input[inputData[0]];
      for (const [dn, count] of Object.entries(encryptionData)) {
        const parsedDN = parseDistinguishedName(dn);
        parsedDN['COUNT'] = count;
        parsedDN['ENCRYPTION'] = encryptionNames[inputData[0]] || inputData[0];
        parsedDN['ENCRYPTION_CODE'] = inputData[0];
        parsedDN['COUNTRY_NAME'] =
          countryNames[parsedDN['C'].toUpperCase()] || parsedDN['C'];
        signedInfo.push(parsedDN);
      }
    }

    if (signedInfo.length == 0) {
      return {};
    }

    // remove duplicated encryption count of a country
    const validatedRecord = {};
    const eliminatingIndexes: number[] = [];
    for (let i = 0; i < signedInfo.length; i++) {
      const validateKey = signedInfo[i].C + signedInfo[i].ENCRYPTION_CODE;
      if (validatedRecord[validateKey] === undefined) {
        validatedRecord[validateKey] = i;
        continue;
      }

      const currentRecord = signedInfo[i];
      const existRecord = signedInfo[validatedRecord[validateKey]];
      const countSum = (existRecord.COUNT || 0) + (currentRecord.COUNT || 0);
      signedInfo[validatedRecord[validateKey]].COUNT = countSum;
      eliminatingIndexes.push(i);
    }
    if (eliminatingIndexes.length > 0) {
      for (const ind of eliminatingIndexes) {
        delete signedInfo[ind];
      }
    }

    const countryData = {};
    for (const signedData of signedInfo) {
      //skip the iteration if the passport records not having a valid details/country
      if (!signedData?.C) {
        continue;
      }
      let countryKey = countryNames[signedData.C.toUpperCase()] || signedData.C;
      if (countryData[countryKey]) {
        countryData[countryKey].push(signedData);
        continue;
      }
      countryData[countryKey] = [signedData];
    }

    return countryData;
  };

  const fetchJsonInfo = async () => {
    const jsonData = await import(
      './../../../registry/outputs/signature_algorithms.json'
    );
    const countryNames = await import('./../../public/all-countries.json');

    if (!jsonData) {
      return;
    }

    const allCountriesData = formatJsonData({ ...jsonData }, countryNames);
    setAllCountriesData(allCountriesData);
    console.log('jsonData :>> ', allCountriesData);
  };

  useEffect(() => {
    fetchJsonInfo();
  }, []);

  return (
    <main className={styles.main}>
      <h2 className={styles.homeTitle}>Proof of Passport country coverage</h2>
      <div className={styles.mapRow}>
        <div className={styles.mapSection}>
          <MapChart
            setTooltipContent={handleToolTip}
            selectedCountryData={selectedCountryInfo}
            selectedCountryName={selectedCountryName}
          />
        </div>
      </div>
    </main>
  );
}
