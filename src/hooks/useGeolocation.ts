// src/hooks/useGeolocation.ts

import { useState, useEffect } from 'react';

// Define the shape of our Geolocation state
export interface GeolocationState {
  status: 'Acquiring' | 'Locked' | 'Error';
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
  accuracy: number | null;
  error: string | null;
}

// Define the Geolocation options required by the PPB
const geolocationOptions: PositionOptions = {
  enableHighAccuracy: true, // Required for "High-Accuracy GPS"
  timeout: 10000,
  maximumAge: 0,
};

/**
 * Custom hook to manage Geolocation API
 * @param {boolean} watch - Whether to continuously watch the position
 */
export const useGeolocation = (watch = false) => {
  const [state, setState] = useState<GeolocationState>({
    status: 'Acquiring',
    latitude: null,
    longitude: null,
    altitude: null,
    accuracy: null,
    error: null,
  });

  useEffect(() => {
    let watchId: number | null = null;

    const onSuccess = (position: GeolocationPosition) => {
      setState({
        status: 'Locked',
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        altitude: position.coords.altitude,
        accuracy: position.coords.accuracy,
        error: null,
      });
    };

    const onError = (error: GeolocationPositionError) => {
      setState((prevState) => ({
        ...prevState,
        status: 'Error',
        error: error.message,
      }));
    };

    if (!navigator.geolocation) {
      setState((prevState) => ({
        ...prevState,
        status: 'Error',
        error: 'Geolocation is not supported by your browser.',
      }));
      return;
    }

    if (watch) {
      // Continuously watch position
      watchId = navigator.geolocation.watchPosition(
        onSuccess,
        onError,
        geolocationOptions
      );
    } else {
      // Get position once
      navigator.geolocation.getCurrentPosition(
        onSuccess,
        onError,
        geolocationOptions
      );
    }

    // Cleanup function
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watch]); // Re-run if 'watch' prop changes

  return state;
};