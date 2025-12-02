// src/pages/components/MapDownloader.tsx

import { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  LinearProgress,
  Alert,
} from '@mui/material';
import {
  MapContainer,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { LatLngBounds } from 'leaflet'; // Import type directly
import { UserLocationMarker } from './UserLocationMarker';
import { LayerControl } from './LayerControl';
import { downloadTiles, clearOfflineTiles } from '../../services/tileService';

// This component captures the map's current bounds
const MapBoundsCapture = ({
  setBounds,
}: {
  setBounds: (bounds: LatLngBounds) => void;
}) => {
  const map = useMap();
  useMapEvents({
    moveend: () => {
      setBounds(map.getBounds());
    },
    load: () => {
      setBounds(map.getBounds());
    },
  });
  return null;
};

export const MapDownloader = () => {
  const [bounds, setBounds] = useState<LatLngBounds | null>(null);
  const [progress, setProgress] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async () => {
    if (!bounds) return;

    setIsLoading(true);
    setProgress('Calculating tiles...');

    // Download zoom levels 13 to 16 for the current view
    await downloadTiles(bounds, 13, 16, (progressMessage) => {
      setProgress(progressMessage);
    });

    setIsLoading(false);
  };

  const handleClear = async () => {
    setIsLoading(true);
    setProgress('Clearing all saved tiles...');
    await clearOfflineTiles();
    setProgress('Offline tiles cleared.');
    setIsLoading(false);
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
        Pan and zoom the map to the area you want to save. The downloader
        will save tiles for zoom levels 13-16.
      </Typography>

      {/* 1. The Map UI */}
      <Box sx={{ 
        position: 'relative',
        width: '100%',
        paddingBottom: '56.25%',
        mb: 2,
        maxHeight: { xs: '250px', sm: '350px', md: '450px' },
        overflow: 'hidden'
      }}>
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1
        }}>
          <MapContainer
            center={[51.505, -0.09]}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            attributionControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LayerControl />
            <UserLocationMarker positionOverride={{ bottom: '10px', left: '10px', top: 'auto' }} />
            <MapBoundsCapture setBounds={setBounds} />
          </MapContainer>
        </Box>
      </Box>

      {/* 2. Download Controls */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Button
          variant="contained"
          onClick={handleDownload}
          disabled={!bounds || isLoading}
        >
          {isLoading ? <CircularProgress size={24} /> : 'Download Area'}
        </Button>
        <Button
          variant="outlined"
          color="error"
          onClick={handleClear}
          disabled={isLoading}
        >
          Clear Offline Cache
        </Button>
      </Box>

      {/* 3. Progress Display */}
      {isLoading && (
        <Box sx={{ width: '100%' }}>
          <LinearProgress />
          <Typography variant="body2" sx={{ mt: 1 }}>
            {progress}
          </Typography>
        </Box>
      )}
      {!isLoading && progress.startsWith('Download complete') && (
        <Alert severity="success">{progress}</Alert>
      )}
    </Box>
  );
};