// src/pages/components/ObservationMarkers.tsx

import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import { MarkerClusterGroup } from 'react-leaflet-markercluster';
// The react-leaflet-markercluster package references a packaged stylesheet
// that isn't available under some installs. Use the upstream markercluster
// stylesheet files from the leaflet.markercluster package instead.
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { useActiveProject } from '../../hooks/useActiveProject';
import type { MapFilters } from './MapFilterPanel';

interface ObservationMarkersProps {
  filters?: MapFilters;
}

export const ObservationMarkers: React.FC<ObservationMarkersProps> = ({
  filters,
}) => {
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

  // Apply filters if enabled
  let filteredObservations = observations;

  if (filters && filters.enabled) {
    const now = new Date();
    const filterDate = new Date();

    if (filters.dateRange === 'week') {
      filterDate.setDate(now.getDate() - 7);
    } else if (filters.dateRange === 'month') {
      filterDate.setDate(now.getDate() - 30);
    }

    filteredObservations = observations.filter((obs) => {
      // Date filter
      if (filters.dateRange !== 'all' && obs.createdAt < filterDate) {
        return false;
      }

      // Custom field filter
      if (
        filters.customFieldId &&
        filters.customFieldValue
      ) {
        const fieldValue = obs.customFieldValues[filters.customFieldId];
        if (fieldValue !== filters.customFieldValue) {
          return false;
        }
      }

      return true;
    });
  }

  return (
    <MarkerClusterGroup>
      {filteredObservations.map((obs) => (
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
    </MarkerClusterGroup>
  );
};