// src/hooks/useTracklog.ts

import { useEffect, useRef } from 'react';
import { db } from '../db';
import type { ITracklogPoint } from '../db';

const geolocationOptions: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
};

export const useTracklog = (
  isRecording: boolean,
  activeProjectId: number | null // 1. ACCEPT activeProjectId
) => {
  const watchId = useRef<number | null>(null);

  useEffect(() => {
    // 2. DO NOTHING if recording is on but no project is active
    if (isRecording && !activeProjectId) {
      console.warn('Tracklog: Recording is on, but no active project.');
      return;
    }

    const handleSuccess = (position: GeolocationPosition) => {
      const { latitude, longitude, accuracy } = position.coords;
      const timestamp = position.timestamp;

      const newPoint: ITracklogPoint = {
        projectId: activeProjectId!, // 3. SAVE projectId
        timestamp,
        latitude,
        longitude,
        accuracy,
      };

      db.tracklog.add(newPoint).catch((error) => {
        console.error('Failed to save tracklog point:', error);
      });
    };

    const handleError = (error: GeolocationPositionError) => {
      console.error('Geolocation error:', error.message);
    };

    if (isRecording) {
      if (watchId.current === null) {
        watchId.current = navigator.geolocation.watchPosition(
          handleSuccess,
          handleError,
          geolocationOptions
        );
      }
    } else {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
    }

    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, [isRecording, activeProjectId]); // 4. ADD activeProjectId to dependencies
};