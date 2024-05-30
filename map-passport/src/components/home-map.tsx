'use client';

import { Tooltip, Zoom } from '@mui/material';
import React from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Graticule,
  Sphere,
  ZoomableGroup,
} from 'react-simple-maps';

const geoUrl = 'countries-110m.json';

export default function MapChart({
  setTooltipContent,
  selectedCountryData,
  selectedCountryName,
}) {
  const highLightInfo = (countryDscs: any = []) => {
    if (countryDscs?.length > 0) {
      return (
        <div>
          <h3>{selectedCountryName}</h3> <br />
          <p>
            <b>Issues</b> Electronic Passports
          </p>
          <p>
            Proof of passport <b>supported</b>{' '}
          </p>

          <div className="issued-dscs">
            {countryDscs.map((dsc) => (
              <p key={dsc.ENCRYPTION_CODE}>
                <span>{dsc.COUNT}</span> certificates signed with{' '}
                <span>{dsc.ENCRYPTION}</span>
              </p>
            ))}
          </div>
        </div>
      );
    }
    return (
      <div>
        <h3>{selectedCountryName}</h3> <br />
        <p>
          <b>Not issues</b> Electronic Passports
        </p>
        <p>
          Proof of passport <b>not supported</b>{' '}
        </p>
      </div>
    );
  };

  return (
    <div data-tip="">
      <ComposableMap>
        <ZoomableGroup center={[0, -14]} zoom={1}>
          <Graticule stroke="#999" strokeWidth={0.1} />
          <Sphere
            stroke="#fff"
            strokeWidth={0.1}
            id={'sphereline'}
            fill={'#ffffff00'}
          />
          <Geographies geography={geoUrl} fill="#000033" stroke="#eeeeee55">
            {({ geographies }) =>
              geographies.map((geo) => (
                <Tooltip
                  classes={{ tooltip: 'country-tooltip' }}
                  title={highLightInfo(selectedCountryData)}
                  placement="right"
                  arrow
                  key={geo.rsmKey}
                  TransitionComponent={Zoom}
                  TransitionProps={{ timeout: 300 }}
                >
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onMouseEnter={() => {
                      setTooltipContent(`${geo.properties.name}`);
                    }}
                    onMouseLeave={() => {
                      // setTooltipContent('');
                    }}
                    style={{
                      hover: {
                        fill: '#000077',
                      },
                      pressed: {
                        fill: '#000099',
                      },
                    }}
                  />
                </Tooltip>
              ))
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
    </div>
  );
}
