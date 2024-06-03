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
  const [mapParams, setMapParams] = useState({zoom: 1, center: [0, 0]});

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

  const handleMapSizing = (action: string) => {
    const {zoom } = mapParams;
    if(action==='zoomin'){
      setMapParams({...mapParams, zoom: zoom+0.1});
      return;
    }
    if(action==='zoomout'){
      setMapParams({...mapParams, zoom: zoom-0.1});
      return;
    }
    if(action==='reset'){
      setMapParams({...mapParams, zoom: 1, center: [0, 0]});
      return;
    }
  } 

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
      <div className={styles.mapRow}>
        <div className={styles.mapSection}>
          <MapChart
            mapParams={mapParams}
            setTooltipContent={handleToolTip}
            selectedCountryData={selectedCountryInfo}
            selectedCountryName={selectedCountryName}
          />
        </div>
        <div className={styles.mapActions}>
          <button className={styles.resetBtn} onClick={() => handleMapSizing('zoomin')}>
            <img src="add.png" alt="Reset" title="Zoom In" />
          </button>
          <button className={styles.resetBtn} onClick={() => handleMapSizing('zoomout')}>
            <img src="minus.png" alt="Reset" title="Zoom Out" />
          </button>
          <button className={styles.resetBtn} onClick={() => handleMapSizing('reset')}>
            <img src="circular-icon.png" alt="Reset" title="Reset Map" />
          </button>
        </div>
      </div>
    </main>
  );
}
