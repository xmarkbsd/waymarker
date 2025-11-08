// src/pages/MapView.tsx

import { Box } from '@mui/material';
import { MapContainer } from 'react-leaflet'; // 1. REMOVE TileLayer
import 'leaflet/dist/leaflet.css';

// Fix for default Leaflet icon issue
import L from 'leaflet';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

import { ObservationMarkers } from './components/ObservationMarkers';
import { TracklogPolyline } from './components/TracklogPolyline';
import { UserLocationMarker } from './components/UserLocationMarker';
import { CustomOfflineTileLayer } from './components/OfflineTileLayer'; // 2. IMPORT our new layer

L.Icon.Default.mergeOptions({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
});

export const MapView = () => {
  return (
    <Box sx={{ height: 'calc(100vh - 128px)', width: '100%' }}>
      <MapContainer
        center={[51.505, -0.09]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        {/* 3. USE our custom offline-first tile layer */}
        <CustomOfflineTileLayer />

        <ObservationMarkers />
        <TracklogPolyline />
        <UserLocationMarker />
      </MapContainer>
    </Box>
  );
};