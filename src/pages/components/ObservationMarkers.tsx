// src/pages/components/ObservationMarkers.tsx

import { Marker, Popup } from 'react-leaflet';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { useActiveProject } from '../../hooks/useActiveProject'; // 1. IMPORT hook

export const ObservationMarkers = () => {
  // 2. GET active project
  const activeProjectId = useActiveProject();

  // 3. UPDATE query to use activeProjectId
  const observations = useLiveQuery(
    () => {
      if (!activeProjectId) return [];
      return db.observations
        .where('projectId')
        .equals(activeProjectId)
        .toArray();
    },
    [activeProjectId] // 4. ADD dependency
  );

  if (!observations) {
    return null; // Don't render anything while loading
  }

  return (
    <>
      {observations.map((obs) => (
        <Marker
          key={obs.id}
          position={[obs.geometry.latitude, obs.geometry.longitude]}
        >
          <Popup>
            <b>{obs.coreFields.name}</b>
            <br />
            {obs.createdAt.toLocaleString()}
          </Popup>
        </Marker>
      ))}
    </>
  );
};