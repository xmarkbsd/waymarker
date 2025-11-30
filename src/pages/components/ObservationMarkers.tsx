// src/pages/components/ObservationMarkers.tsx

import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
// The react-leaflet-markercluster package references a packaged stylesheet
// that isn't available under some installs. Use the upstream markercluster
// stylesheet files from the leaflet.markercluster package instead.
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { useActiveProject } from '../../hooks/useActiveProject';
import type { MapFilters } from '../../types/mapFilters';

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

  // Custom marker icons for different location sources
  const orangeIcon = L.divIcon({
    className: 'orange-marker',
    html: `<div style="background-color: #ff9800; width: 25px; height: 25px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
    iconSize: [25, 25],
    iconAnchor: [12, 24],
  });

  const yellowIcon = L.divIcon({
    className: 'yellow-marker',
    html: `<div style="background-color: #ffc107; width: 25px; height: 25px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
    iconSize: [25, 25],
    iconAnchor: [12, 24],
  });

  const getMarkerIcon = (source?: string) => {
    if (source === 'map-placed') return orangeIcon;
    if (source === 'user-moved') return yellowIcon;
    return undefined; // Use default blue
  };

  return (
    <MarkerClusterGroup>
      {filteredObservations.map((obs) => (
        <Marker
          key={obs.id}
          position={[obs.geometry.latitude, obs.geometry.longitude]}
          icon={getMarkerIcon(obs.geometry.source)}
        >
          <Popup>
            <b>{obs.coreFields.name}</b>
            <br />
            {obs.createdAt.toLocaleString()}
            {obs.geometry.source && obs.geometry.source !== 'gps' && (
              <>
                <br />
                <span style={{ color: '#ff9800', fontSize: '0.85em' }}>
                  ({obs.geometry.source === 'map-placed' ? 'Map-placed' : 'User-moved'})
                </span>
              </>
            )}
          </Popup>
        </Marker>
      ))}
    </MarkerClusterGroup>
  );
};