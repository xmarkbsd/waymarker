// src/hooks/useTracklog.ts

import { useEffect, useRef } from 'react';
import { db } from '../db';
import {
  requestScreenWakeLock,
  releaseScreenWakeLock,
  reacquireScreenWakeLockIfNeeded,
} from '../services/screenWakeLock';
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
        // Request screen wake lock to keep device awake during tracking
        requestScreenWakeLock().catch((error) => {
          console.error('Failed to request screen wake lock:', error);
        });

        watchId.current = navigator.geolocation.watchPosition(
          handleSuccess,
          handleError,
          geolocationOptions
        );
      }
    } else {
      if (watchId.current !== null) {
        // Release screen wake lock when tracking stops
        releaseScreenWakeLock().catch((error) => {
          console.error('Failed to release screen wake lock:', error);
        });

        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
    }

    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
        releaseScreenWakeLock().catch((error) => {
          console.error('Failed to release screen wake lock:', error);
        });
      }
    };
  }, [isRecording, activeProjectId]); // 4. ADD activeProjectId to dependencies

  // Handle page visibility changes to re-acquire wake lock if needed
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isRecording) {
        // Page became visible again while recording
        reacquireScreenWakeLockIfNeeded().catch((error) => {
          console.error('Failed to re-acquire screen wake lock:', error);
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isRecording]);
};