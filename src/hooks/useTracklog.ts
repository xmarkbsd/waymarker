// src/hooks/useTracklog.ts

import { useEffect, useRef } from 'react';
import { db } from '../db';
import type { ITracklogPoint } from '../db';

const geolocationOptions: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
};

export const useTracklog = (isRecording: boolean) => {
  // Use useRef to hold the watchId
  const watchId = useRef<number | null>(null);

  useEffect(() => {
    // This is the success callback for watchPosition
    const handleSuccess = (position: GeolocationPosition) => {
      const { latitude, longitude, accuracy } = position.coords;
      const timestamp = position.timestamp;

      // Construct the tracklog point
      const newPoint: ITracklogPoint = {
        timestamp,
        latitude,
        longitude,
        accuracy,
      };

      // Add it to the database
      db.tracklog.add(newPoint).catch((error) => {
        console.error('Failed to save tracklog point:', error);
      });
    };

    // This is the error callback
    const handleError = (error: GeolocationPositionError) => {
      console.error('Geolocation error:', error.message);
    };

    // --- Start or Stop Recording ---
    if (isRecording) {
      // Start recording
      if (watchId.current === null) {
        watchId.current = navigator.geolocation.watchPosition(
          handleSuccess,
          handleError,
          geolocationOptions
        );
      }
    } else {
      // Stop recording
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
    }

    // Cleanup function: stop recording when the component unmounts
    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, [isRecording]); // This effect re-runs when isRecording changes
};