// src/pages/components/TracklogPolyline.tsx

import { Polyline, CircleMarker, Tooltip } from 'react-leaflet';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import type { LatLngExpression } from 'leaflet';
import type { ITracklogPoint } from '../../db';
import { useActiveProject } from '../../hooks/useActiveProject';
import Dexie from 'dexie';
import * as turf from '@turf/turf';
import { Box, Card, CardContent, Typography } from '@mui/material';

interface TracklogPolylineProps {
  visible?: boolean;
}

export const TracklogPolyline: React.FC<TracklogPolylineProps> = ({ visible = true }) => {
  const activeProjectId = useActiveProject();

  const tracklogPoints = useLiveQuery(
    () => {
      if (!activeProjectId) return [];
      
      return db.tracklog
        .where('[projectId+timestamp]')
        .between(
          [activeProjectId, Dexie.minKey],
          [activeProjectId, Dexie.maxKey]
        )
        .toArray();
    },
    [activeProjectId]
  );

  if (!visible || !tracklogPoints || tracklogPoints.length === 0) {
    return null;
  }

  // Calculate statistics
  let totalDistance = 0;
  if (tracklogPoints.length >= 2) {
    const lineCoords = tracklogPoints.map(p => [p.longitude, p.latitude]);
    const line = turf.lineString(lineCoords);
    totalDistance = turf.length(line, { units: 'kilometers' });
  }

  const startTime = tracklogPoints[0]?.timestamp;
  const endTime = tracklogPoints[tracklogPoints.length - 1]?.timestamp;
  const durationMs = endTime - startTime;
  const durationMinutes = durationMs / (1000 * 60);
  const durationHours = durationMinutes / 60;
  const avgSpeedKmh = durationHours > 0 ? totalDistance / durationHours : 0;

  // Create time markers at intervals (every 5 minutes or at least 5 markers)
  const timeMarkers: ITracklogPoint[] = [];
  const intervalMinutes = 5;
  const intervalMs = intervalMinutes * 60 * 1000;
  
  if (tracklogPoints.length > 0) {
    let nextMarkerTime = startTime;
    for (const point of tracklogPoints) {
      if (point.timestamp >= nextMarkerTime) {
        timeMarkers.push(point);
        nextMarkerTime += intervalMs;
      }
    }
    // Always include the last point
    if (timeMarkers[timeMarkers.length - 1]?.timestamp !== endTime) {
      timeMarkers.push(tracklogPoints[tracklogPoints.length - 1]);
    }
  }

  // Color gradient from blue (start) to green (end)
  const getColorForIndex = (index: number, total: number) => {
    if (total <= 1) return '#3388ff';
    const ratio = index / (total - 1);
    // Blue to green gradient
    const r = Math.round(51 + (40 - 51) * ratio);
    const g = Math.round(136 + (167 - 136) * ratio);
    const b = Math.round(255 + (69 - 255) * ratio);
    return `rgb(${r},${g},${b})`;
  };

  // Create polyline segments with gradient colors
  const polylineSegments = [];
  for (let i = 0; i < tracklogPoints.length - 1; i++) {
    const segment = [
      [tracklogPoints[i].latitude, tracklogPoints[i].longitude],
      [tracklogPoints[i + 1].latitude, tracklogPoints[i + 1].longitude],
    ];
    polylineSegments.push(
      <Polyline
        key={`segment-${i}`}
        positions={segment as LatLngExpression[]}
        color={getColorForIndex(i, tracklogPoints.length)}
        weight={3}
        opacity={0.8}
        pathOptions={{ pane: 'shadowPane' }}
      />
    );
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${Math.round(minutes)}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  return (
    <>
      {/* Colored polyline segments */}
      {polylineSegments}

      {/* Time markers */}
      {timeMarkers.map((point, idx) => (
        <CircleMarker
          key={`marker-${point.timestamp}`}
          center={[point.latitude, point.longitude]}
          radius={5}
          fillColor={idx === 0 ? '#2196f3' : idx === timeMarkers.length - 1 ? '#4caf50' : '#ff9800'}
          fillOpacity={0.8}
          color="white"
          weight={2}
        >
          <Tooltip permanent direction="top" offset={[0, -5]}>
            <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
              {formatTime(point.timestamp)}
            </Typography>
          </Tooltip>
        </CircleMarker>
      ))}

      {/* Statistics card */}
      {tracklogPoints.length >= 2 && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 80,
            left: 10,
            zIndex: 400,
            pointerEvents: 'auto',
          }}
        >
          <Card sx={{ minWidth: 180, boxShadow: 3 }}>
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Track Log
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                Distance: <strong>{totalDistance.toFixed(2)} km</strong>
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                Duration: <strong>{formatDuration(durationMinutes)}</strong>
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                Avg Speed: <strong>{avgSpeedKmh.toFixed(1)} km/h</strong>
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', mt: 0.5, display: 'block' }}>
                {tracklogPoints.length} points recorded
              </Typography>
            </CardContent>
          </Card>
        </Box>
      )}
    </>
  );
};