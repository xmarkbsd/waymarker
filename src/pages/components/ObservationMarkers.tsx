// src/pages/components/ObservationMarkers.tsx

import React, { useState } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, Typography } from '@mui/material';
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
  moveMode?: boolean;
}

export const ObservationMarkers: React.FC<ObservationMarkersProps> = ({
  filters,
  moveMode,
}) => {
  const [draggedObservation, setDraggedObservation] = useState<{
    id: number;
    oldLat: number;
    oldLng: number;
    newLat: number;
    newLng: number;
  } | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

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

  const handleDragEnd = async (obsId: number, oldLat: number, oldLng: number, event: L.DragEndEvent) => {
    const newPos = event.target.getLatLng();
    setDraggedObservation({
      id: obsId,
      oldLat,
      oldLng,
      newLat: newPos.lat,
      newLng: newPos.lng,
    });
    setConfirmDialogOpen(true);
  };

  const handleConfirmMove = async () => {
    if (!draggedObservation) return;

    const obs = await db.observations.get(draggedObservation.id);
    if (!obs) return;

    // Update observation with new coordinates and source
    await db.observations.update(draggedObservation.id, {
      geometry: {
        ...obs.geometry,
        latitude: draggedObservation.newLat,
        longitude: draggedObservation.newLng,
        source: 'user-moved',
      },
      locationHistory: [
        ...(obs.locationHistory || []),
        {
          timestamp: new Date(),
          latitude: draggedObservation.oldLat,
          longitude: draggedObservation.oldLng,
          altitude: obs.geometry.altitude,
          accuracy: obs.geometry.accuracy,
          source: obs.geometry.source || 'gps',
        },
      ],
    });

    setConfirmDialogOpen(false);
    setDraggedObservation(null);
  };

  const handleCancelMove = () => {
    setConfirmDialogOpen(false);
    setDraggedObservation(null);
    // Force re-render to reset marker position
    window.location.reload();
  };

  const markers = filteredObservations.map((obs) => (
    <Marker
      key={obs.id}
      position={[obs.geometry.latitude, obs.geometry.longitude]}
      icon={getMarkerIcon(obs.geometry.source)}
      draggable={moveMode || false}
      eventHandlers={{
        dragend: (e: L.DragEndEvent) => handleDragEnd(obs.id!, obs.geometry.latitude, obs.geometry.longitude, e),
      }}
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
  ));

  return (
    <>
      {/* Disable clustering in move mode to allow dragging */}
      {moveMode ? (
        markers
      ) : (
        <MarkerClusterGroup>
          {markers}
        </MarkerClusterGroup>
      )}
      
      {/* Move confirmation dialog */}
      <Dialog open={confirmDialogOpen} onClose={handleCancelMove}>
        <DialogTitle>Confirm Move</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Move this observation to the new location?
            <br />
            <br />
            <strong>Old location:</strong> {draggedObservation?.oldLat.toFixed(6)}°, {draggedObservation?.oldLng.toFixed(6)}°
            <br />
            <strong>New location:</strong> {draggedObservation?.newLat.toFixed(6)}°, {draggedObservation?.newLng.toFixed(6)}°
            <br />
            <br />
            <Typography variant="caption" color="warning.main">
              The original location will be saved in the observation's location history.
            </Typography>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelMove}>Cancel</Button>
          <Button onClick={handleConfirmMove} variant="contained" autoFocus>
            Confirm Move
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};