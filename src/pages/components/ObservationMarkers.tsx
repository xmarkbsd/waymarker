// src/pages/components/ObservationMarkers.tsx

import { Marker, Popup } from 'react-leaflet';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';

export const ObservationMarkers = () => {
  // Live query to get all observations
  const observations = useLiveQuery(() => db.observations.toArray(), []);

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