// src/pages/components/LayerControl.tsx

import { useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { Box, IconButton, Tooltip } from '@mui/material';
import LayersIcon from '@mui/icons-material/Layers';

export const LayerControl = () => {
  const map = useMap();
  const [currentLayer, setCurrentLayer] = useState<'osm' | 'satellite'>('osm');

  const toggleLayer = () => {
    const newLayer = currentLayer === 'osm' ? 'satellite' : 'osm';
    setCurrentLayer(newLayer);

    // Remove all existing tile layers
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    // Add the new tile layer
    if (newLayer === 'osm') {
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        subdomains: ['a', 'b', 'c'],
      }).addTo(map);
    } else {
      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution:
            'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEP, GeoInformation Group, Aerogrid, IGN, IGP, and the GIS User Community',
        }
      ).addTo(map);
    }
  };

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 80,
        right: 10,
        zIndex: 400,
        backgroundColor: 'white',
        borderRadius: 1,
        boxShadow: '0 1px 5px rgba(0,0,0,0.65)',
      }}
    >
      <Tooltip title={`Switch to ${currentLayer === 'osm' ? 'Satellite' : 'Map'}`}>
        <IconButton
          size="small"
          onClick={toggleLayer}
          sx={{
            color: 'rgba(0,0,0,0.6)',
            '&:hover': {
              backgroundColor: 'rgba(0,0,0,0.05)',
            },
          }}
        >
          <LayersIcon />
        </IconButton>
      </Tooltip>
    </Box>
  );
};
