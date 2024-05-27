'use client';

import React from "react"
import { ComposableMap, Geographies, Geography } from "react-simple-maps"

const geoUrl =
  "https://unpkg.com/world-atlas@2.0.2/countries-110m.json"

export default function MapChart() {
  return (
    <ComposableMap>
      <Geographies geography={geoUrl}
      fill="#FF5533"
      stroke="#ccc"
      >
        {({ geographies }) =>
          geographies.map((geo) => (
            <Geography key={geo.rsmKey} geography={geo} />
          ))
        }
      </Geographies>
    </ComposableMap>
  )
}
