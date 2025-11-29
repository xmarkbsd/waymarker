// src/pages/components/UserLocationMarker.tsx

import { Circle, Marker, useMap } from 'react-leaflet';
import { useGeolocation } from '../../hooks/useGeolocation';
import { Box, IconButton } from '@mui/material';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import { useEffect } from 'react';
import L from 'leaflet';

interface UserLocationMarkerProps {
  positionOverride?: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
  };
}

// Create a custom 'blue dot' icon
const blueDotIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
      <circle cx="12" cy="12" r="8" fill="#039BE5" fill-opacity="0.7"/>
      <circle cx="12" cy="12" r="10" stroke="#FFFFFF" stroke-width="2" fill="none"/>
      <circle cx="12" cy="12" r="12" fill="#039BE5" fill-opacity="0.1"/>
    </svg>
  `),
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

export const UserLocationMarker = ({ positionOverride }: UserLocationMarkerProps) => {
  const map = useMap();
  const geoState = useGeolocation(true); // Watch position

  const defaultPosition = {
    top: '90px',
    left: '10px',
    bottom: undefined,
    right: undefined,
  };

  const position = positionOverride ? { ...defaultPosition, ...positionOverride } : defaultPosition;

  const handleFlyTo = () => {
    if (geoState.status === 'Locked') {
      map.flyTo([geoState.latitude!, geoState.longitude!], 16); // Zoom in
    }
  };

  // Center map on user's location on first lock
  useEffect(() => {
    if (geoState.status === 'Locked') {
      handleFlyTo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geoState.status === 'Locked']); // Run only when status changes to 'Locked'

  return (
    <>
      {/* "My Location" Button */}
      <Box
        sx={{
          position: 'absolute',
          ...position,
          zIndex: 1001,
          backgroundColor: 'white',
          borderRadius: '4px',
          boxShadow: '0 1px 5px rgba(0,0,0,0.65)',
        }}
      >
        <IconButton
          size="small"
          onClick={handleFlyTo}
          disabled={geoState.status !== 'Locked'}
          sx={{
            color: 'rgba(0,0,0,0.6)',
            '&:hover': {
              backgroundColor: 'rgba(0,0,0,0.05)',
            },
            '&.Mui-disabled': {
              color: 'rgba(0,0,0,0.26)',
            },
          }}
        >
          <MyLocationIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Blue Dot and Accuracy Circle */}
      {geoState.status === 'Locked' && (
        <>
          <Marker
            position={[geoState.latitude!, geoState.longitude!]}
            icon={blueDotIcon}
          />
          <Circle
            center={[geoState.latitude!, geoState.longitude!]}
            radius={geoState.accuracy!}
            weight={1}
            color="#039BE5"
            fillColor="#039BE5"
            fillOpacity={0.1}
          />
        </>
      )}
    </>
  );
};