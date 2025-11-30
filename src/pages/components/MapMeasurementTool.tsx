// src/pages/components/MapMeasurementTool.tsx

import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, IconButton, Tooltip } from '@mui/material';
import TimelineIcon from '@mui/icons-material/Timeline';
import LayersIcon from '@mui/icons-material/Layers';
import DeleteIcon from '@mui/icons-material/Delete';
import { Polyline, Polygon, useMapEvents, Popup } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  // Returns distance in meters
  const R = 6371000; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function polygonArea(coords: [number, number][]) {
  // Returns area in square meters using Shoelace formula
  let area = 0;
  const n = coords.length;
  for (let i = 0; i < n; i++) {
    const [x1, y1] = coords[i];
    const [x2, y2] = coords[(i + 1) % n];
    area += x1 * y2 - x2 * y1;
  }
  return Math.abs(area / 2) * 111139 * 111139; // crude conversion for lat/lon to meters
}

export const MapMeasurementTool: React.FC = () => {
  const [active, setActive] = useState(false);
  const [mode, setMode] = useState<'line' | 'polygon'>('line');
  const [points, setPoints] = useState<LatLngExpression[]>([]);
  const [finished, setFinished] = useState(false);

  useMapEvents({
    click(e) {
      if (!active || finished) return;
      setPoints((pts) => [...pts, [e.latlng.lat, e.latlng.lng]]);
    },
    dblclick() {
      if (!active || finished) return;
      setFinished(true);
    },
  });

  const handleStart = (type: 'line' | 'polygon') => {
    setActive(true);
    setMode(type);
    setPoints([]);
    setFinished(false);
  };

  const handleClear = () => {
    setActive(false);
    setPoints([]);
    setFinished(false);
  };

  let result = null;
  if (finished && points.length > 1) {
    if (mode === 'line') {
      let dist = 0;
      for (let i = 1; i < points.length; i++) {
        const [lat1, lon1] = points[i - 1] as [number, number];
        const [lat2, lon2] = points[i] as [number, number];
        dist += haversineDistance(lat1, lon1, lat2, lon2);
      }
      result = `Distance: ${dist < 1000 ? dist.toFixed(1) + ' m' : (dist / 1000).toFixed(2) + ' km'}`;
    } else if (mode === 'polygon' && points.length > 2) {
      const area = polygonArea(points as [number, number][]);
      result = `Area: ${area < 10000 ? area.toFixed(1) + ' m²' : (area / 10000).toFixed(2) + ' ha'}`;
    }
  }

  return (
    <Box sx={{ position: 'absolute', top: 60, right: 10, zIndex: 402 }}>
      <Card sx={{ boxShadow: 3, minWidth: 180 }}>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
            <Tooltip title="Measure distance">
              <IconButton
                color={active && mode === 'line' ? 'primary' : 'default'}
                onClick={() => handleStart('line')}
                size="small"
              >
                <TimelineIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Measure area">
              <IconButton
                color={active && mode === 'polygon' ? 'primary' : 'default'}
                onClick={() => handleStart('polygon')}
                size="small"
              >
                <LayersIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Clear measurement">
              <IconButton onClick={handleClear} size="small">
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </Box>
          {active && !finished && (
            <Typography variant="body2" color="textSecondary">
              Tap to add points. Double-tap to finish.
            </Typography>
          )}
          {finished && result && (
            <Typography variant="body1" color="primary" sx={{ fontWeight: 600 }}>
              {result}
            </Typography>
          )}
        </CardContent>
      </Card>
      {active && points.length > 0 && (
        mode === 'line' ? (
          <Polyline positions={points} color="blue" weight={4} />
        ) : (
          <Polygon positions={points} color="green" weight={3} fillOpacity={0.2} />
        )
      )}
      {active && points.length > 0 && (
        <Popup position={points[points.length - 1] as LatLngExpression}>
          {finished && result ? result : `${points.length} point${points.length > 1 ? 's' : ''}`}
        </Popup>
      )}
    </Box>
  );
};
