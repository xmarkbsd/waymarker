// src/services/screenWakeLock.ts

/**
 * Service to manage screen wake lock during tracklog recording.
 * Prevents device from sleeping while user is actively tracking.
 */

let wakeLock: WakeLockSentinel | null = null;

/**
 * Request screen wake lock to keep the device awake.
 * Shows warning about increased battery usage.
 */
export const requestScreenWakeLock = async (): Promise<boolean> => {
  // Check if the Screen Wake Lock API is supported
  if (!('wakeLock' in navigator)) {
    console.warn('Screen Wake Lock API not supported on this device');
    return false;
  }

  try {
    wakeLock = await navigator.wakeLock.request('screen');
    console.log('Screen wake lock acquired');

    // Listen for release events (e.g., tab becomes hidden)
    wakeLock.addEventListener('release', () => {
      console.log('Screen wake lock was released');
      wakeLock = null;
    });

    return true;
  } catch (error) {
    console.error('Failed to acquire screen wake lock:', error);
    return false;
  }
};

/**
 * Release the screen wake lock, allowing device to sleep.
 */
export const releaseScreenWakeLock = async (): Promise<void> => {
  if (wakeLock) {
    try {
      await wakeLock.release();
      wakeLock = null;
      console.log('Screen wake lock released');
    } catch (error) {
      console.error('Failed to release screen wake lock:', error);
    }
  }
};

/**
 * Check if screen wake lock is currently active.
 */
export const isScreenWakeLockActive = (): boolean => {
  return wakeLock !== null;
};

/**
 * Re-acquire wake lock if it was released due to page visibility change.
 * Call this when the page becomes visible again.
 */
export const reacquireScreenWakeLockIfNeeded = async (): Promise<void> => {
  // If we previously had a wake lock but it's been released, try to re-acquire
  if (wakeLock === null && 'wakeLock' in navigator) {
    try {
      wakeLock = await navigator.wakeLock.request('screen');
      console.log('Screen wake lock re-acquired');

      wakeLock.addEventListener('release', () => {
        console.log('Screen wake lock was released');
        wakeLock = null;
      });
    } catch (error) {
      console.warn('Could not re-acquire screen wake lock:', error);
    }
  }
};
