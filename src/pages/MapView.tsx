// src/pages/MapView.tsx

import { useState } from 'react';
import { Box } from '@mui/material';
import { MapContainer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './styles/mapView.css';

// Fix for default Leaflet icon issue
import L from 'leaflet';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

import { ObservationMarkers } from './components/ObservationMarkers';
import { TracklogPolyline } from './components/TracklogPolyline';
import { UserLocationMarker } from './components/UserLocationMarker';
import { CustomOfflineTileLayer } from './components/OfflineTileLayer';
import { LayerControl } from './components/LayerControl';
import type { MapFilters } from '../types/mapFilters';
import { MapToolsBar } from './components/MapToolsBar';

L.Icon.Default.mergeOptions({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
});

interface MapViewProps {
  onPlaceObservation?: (lat: number, lng: number) => void;
  moveMode?: boolean;
  onMoveModeChange?: (enabled: boolean) => void;
}

export const MapView: React.FC<MapViewProps> = ({ onPlaceObservation, moveMode, onMoveModeChange }) => {
  const [filters, setFilters] = useState<MapFilters>({
    enabled: false,
    dateRange: 'all',
    customFieldId: null,
    customFieldValue: null,
  });
  const [showTrackLog, setShowTrackLog] = useState(true);

  return (
    <Box sx={{ height: 'calc(100vh - 128px)', width: '100%', position: 'relative' }}>
      <MapContainer
        center={[51.505, -0.09]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <CustomOfflineTileLayer />
        <LayerControl />

        <ObservationMarkers filters={filters} moveMode={moveMode} />
        <TracklogPolyline visible={showTrackLog} />
        <UserLocationMarker />
        <MapToolsBar 
          filters={filters} 
          onFiltersChange={setFilters} 
          onPlaceObservation={onPlaceObservation}
          moveMode={moveMode}
          onMoveModeChange={onMoveModeChange}
          showTrackLog={showTrackLog}
          onToggleTrackLog={setShowTrackLog}
        />
      </MapContainer>
      {/* Removed top-right filter & measurement panels in favor of consolidated bottom toolbar */}
    </Box>
  );
};