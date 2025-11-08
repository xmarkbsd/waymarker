// src/pages/components/TracklogPolyline.tsx

import { Polyline } from 'react-leaflet';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import type { LatLngExpression } from 'leaflet';
import type { ITracklogPoint } from '../../db';
import { useActiveProject } from '../../hooks/useActiveProject';
import Dexie from 'dexie'; // 1. Import Dexie

export const TracklogPolyline = () => {
  const activeProjectId = useActiveProject();

  // FIX: This is the correct way to query a compound index
  const tracklogPoints = useLiveQuery(
    () => {
      if (!activeProjectId) return [];
      
      // We query the [projectId+timestamp] index directly.
      // This finds all points for the project and returns them
      // *already sorted by timestamp*.
      return db.tracklog
        .where('[projectId+timestamp]')
        .between(
          [activeProjectId, Dexie.minKey], // Start of range
          [activeProjectId, Dexie.maxKey]  // End of range
        )
        .toArray();
    },
    [activeProjectId]
  );

  if (!tracklogPoints || tracklogPoints.length === 0) {
    return null;
  }

  const positions: LatLngExpression[] = tracklogPoints.map(
    (p: ITracklogPoint) => [p.latitude, p.longitude]
  );

  return <Polyline positions={positions} color="red" weight={3} />;
};