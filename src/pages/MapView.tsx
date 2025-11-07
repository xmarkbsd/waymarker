// src/pages/MapView.tsx

import { Box } from '@mui/material';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css'; // Import Leaflet CSS

// Fix for default Leaflet icon issue with Vite/Webpack
import L from 'leaflet';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

// 1. IMPORT THE NEW COMPONENTS
import { ObservationMarkers } from './components/ObservationMarkers';
import { TracklogPolyline } from './components/TracklogPolyline';
import { UserLocationMarker } from './components/UserLocationMarker';

L.Icon.Default.mergeOptions({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
});

export const MapView = () => {
  return (
    // Set map to fill available space
    <Box sx={{ height: 'calc(100vh - 128px)', width: '100%' }}>
      <MapContainer
        center={[51.505, -0.09]} // Default center
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* 2. RENDER THE DATA LAYERS */}
        <ObservationMarkers />
        <TracklogPolyline />
        <UserLocationMarker />
      </MapContainer>
    </Box>
  );
};