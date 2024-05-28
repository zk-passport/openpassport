'use client';

import styles from './page.module.css';
import MapChart from '@/components/home-map';
import Grid from '@mui/material/Grid';
import { useEffect, useState } from 'react';

export default function Home() {
  const [toolTipInfo, setTooltipInfo] = useState({});
  const [isCountrySelected, setIsCountrySelected] = useState(false);

  const handleToolTip = (countryName: string) => {
    if (countryName) {
      setIsCountrySelected(true);
    } else {
      setIsCountrySelected(false);
    }
    console.log('countryName :>> ', countryName);
  };

  // parse details from the json key field
  const parseDistinguishedName = (dn) => {
    const parts = dn.split(', ');
    const obj = {};
    
    parts.forEach(part => {
      const [key, value] = part.split('=');
      obj[key] = value;
    });
    
    return obj;
  }

  const formatJsonData = (input) => {
    delete input.default;
    const signedInfo: any = []

    for(const inputData of Object.entries(input)){
      const encryptionData = input[inputData[0]];
      for (const [dn, count] of Object.entries(encryptionData)) {
        const parsedDN = parseDistinguishedName(dn);
        parsedDN['COUNT'] = count;
        parsedDN['ENCRYPTION'] = inputData[0];
        signedInfo.push(parsedDN);
      }  
    }

    if(signedInfo.length == 0){
      return;
    }
    const countryData = {};
    for(const signedData of signedInfo){
      //skip the iteration if the contry not having a passport records
      if(!signedData?.C){
        continue;
      }
      if(countryData[signedData.C]){
        countryData[signedData.C].push(signedData);
        continue;
      }
      countryData[signedData.C] = [signedData];
    }
    
    return countryData;
  };

  const fetchJsonInfo = async () => {
    console.log('calling');
    const jsonData = await import(
      './../../../registry/outputs/signature_algorithms.json'
    );

    if(!jsonData){
      return;
    }
    console.log('jsonData :>> ', formatJsonData({...jsonData}));
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
        <div className={styles.countryInfo}>
          <p className={styles.countryName}>India</p>
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
      </div>
    </main>
  );
}
