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

export default function MapChart({ setTooltipContent }) {
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
                  title={geo.properties.name}
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
                      setTooltipContent('');
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
