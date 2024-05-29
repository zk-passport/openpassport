'use client';

import styles from './page.module.css';
import MapChart from '@/components/home-map';
import Grid from '@mui/material/Grid';
import { useEffect, useRef, useState } from 'react';
import { CSSTransition } from 'react-transition-group';

export default function Home() {
  const encryptionNames = {
    'sha1WithRSAEncryption':'Sha1 RSA Encryption',
    'sha256WithRSAEncryption':'Sha256 RSA Encryption',
    'sha512WithRSAEncryption':'Sha512 RSA Encryption',
    'rsassaPss        ':'RSASSA PSS Encryption',
    'ecdsa-with-SHA1':'ECDSA with SHA-1',
    'ecdsa-with-SHA256':'ECDSA with SHA-256',
    'ecdsa-with-SHA384':'ECDSA with SHA-384',
    'ecdsa-with-SHA512':'ECDSA with SHA-512',
  };
  const [selectedCountryInfo, setSelectedCountryInfo] = useState({});
  const [allCountriesData, setAllCountriesData] = useState({});
  const [selectedCountryName, setSelectedCountryName] = useState('');
  const infoElRef = useRef(null);

  const handleToolTip = (countryName: string) => {
    setSelectedCountryName(countryName);
    if (countryName) {
      const selectedCountryInfo = allCountriesData[countryName];
      if (selectedCountryInfo) {
        setSelectedCountryInfo(selectedCountryInfo);
      }
    }
    console.log('countryName :>> ', countryName);
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

    console.log('input :>> ', input);
    
    for (const inputData of Object.entries(input)) {
      const encryptionData = input[inputData[0]];
      for (const [dn, count] of Object.entries(encryptionData)) {
        const parsedDN = parseDistinguishedName(dn);
        parsedDN['COUNT'] = count;
        parsedDN['ENCRYPTION'] = encryptionNames[inputData[0]] || inputData[0];
        parsedDN['ENCRYPTION_CODE'] = inputData[0];
        parsedDN['COUNTRY_NAME'] = countryNames[parsedDN['C'].toUpperCase()] || parsedDN['C'];
        signedInfo.push(parsedDN);
      }
    }

    if (signedInfo.length == 0) {
      return [];
    }
    
    // remove duplicated encryption count of a country
    const validatedRecord = {};
    const eliminatingIndexes: number[] = [];
    for(let i = 0; i< signedInfo.length; i++){
      const validateKey = signedInfo[i].C + signedInfo[i].ENCRYPTION_CODE;
      if(validatedRecord[validateKey] === undefined){
        validatedRecord[validateKey] = i;
        continue;
      }

      const currentRecord = signedInfo[i];
      const existRecord = signedInfo[validatedRecord[validateKey]];
      const countSum = (existRecord.COUNT || 0) + (currentRecord.COUNT || 0);
      signedInfo[validatedRecord[validateKey]].COUNT = countSum;
      eliminatingIndexes.push(i);
    }

    if(eliminatingIndexes.length > 0){
      for(const ind of eliminatingIndexes){
        signedInfo.splice(ind, 1);
      }
    }
    
    const countryData = {};
    for (const signedData of signedInfo) {
      //skip the iteration if the contry not having a passport records
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
      <h2 className={styles.homeTitle}>Electronic passports coverage</h2>
      <Grid container spacing={1}>
        <Grid item xs={4}>
          <p className={`${styles.homeDescription}`}>
            In 2021, ICAO (the International Civil Aviation Organization, which
            standardises passports) released an updated standard, introducing
            LDS2 (Logical Data Structure 2). This is a new section of the
            passport chip that allows the storage of further data, including
            travel history, visa records, and additional biometric data. LDS2
            completely changes what a passport is.
          </p>
        </Grid>
        <Grid item xs={4}>
          <p className={`${styles.homeDescription}`}>
            Current passports are read-only, but with LDS2, they become
            writable. Passport stamps and visas become digital. Passports go
            from being an identification document to a detailed record of your
            movements.
          </p>
        </Grid>
      </Grid>
      {/* {toolTipInfo ? toolTipInfo : null} */}
      <div className={styles.mapRow}>
        <div className={styles.mapSection}>
          <MapChart setTooltipContent={handleToolTip} />
        </div>

        <CSSTransition
          in={selectedCountryName != null}
          nodeRef={infoElRef}
          timeout={300}
          classNames="animate"
          unmountOnExit
        >
          <div className={styles.countryInfo} ref={infoElRef}>
            {selectedCountryName ? (
              <p className={styles.countryName}> {selectedCountryName} </p>
            ) : null}
            <p className={styles.countryIsIssues}>
              <span>Issues</span> Electronic Passports
            </p>
            <p className={styles.proofSupported}>
              Proof of passport <span>supported</span>
            </p>
            <div className={styles.algorithmsInfos}>
              <p className={styles.algorithmsInfo}>
                <span>10</span> passports signed with{' '}
                <span>Sha256WithRSAEncryption</span>
              </p>
              <p className={styles.algorithmsInfo}>
                <span>15</span> passports signed with{' '}
                <span>Sha1WithRSAEncryption</span>
              </p>
            </div>
          </div>
        </CSSTransition>
      </div>
    </main>
  );
}
