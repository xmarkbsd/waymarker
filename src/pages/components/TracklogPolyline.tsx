// src/pages/components/TracklogPolyline.tsx

import { Polyline } from 'react-leaflet';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import type { LatLngExpression } from 'leaflet';

export const TracklogPolyline = () => {
  // Live query to get all tracklog points
  const tracklogPoints = useLiveQuery(
    () => db.tracklog.orderBy('timestamp').toArray(),
    []
  );

  if (!tracklogPoints || tracklogPoints.length === 0) {
    return null; // Don't render anything if no track
  }

  // Convert our points to Leaflet's [lat, lng] format
  const positions: LatLngExpression[] = tracklogPoints.map((p) => [
    p.latitude,
    p.longitude,
  ]);

  return <Polyline positions={positions} color="red" weight={3} />;
};