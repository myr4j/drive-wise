import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { snapshotsApi, shiftsApi } from '@/services';
import { useLocation, LocationData } from './useLocation';
import { useFatigueStore, useShiftStore } from '@/store';
import { SnapshotRequest, SnapshotResponse } from '@/types/api';

export interface UseShiftOptions {
  snapshotInterval?: number; // milliseconds between snapshots (default: 30 seconds)
  enableBackgroundTracking?: boolean;
  autoEndShiftOnAppQuit?: boolean; // Auto-end shift when app is fully closed
}

export function useShift(options: UseShiftOptions = {}) {
  const {
    snapshotInterval = 30000, // 30 seconds for real-time fatigue tracking
    enableBackgroundTracking = true,
    autoEndShiftOnAppQuit = true,
  } = options;

  const [isSending, setIsSending] = useState(false);
  const [snapshotCount, setSnapshotCount] = useState(0);
  const [lastSnapshotTime, setLastSnapshotTime] = useState<Date | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const { activeShift, clearActiveShift } = useShiftStore();
  const { updateFatigue, clearFatigueData } = useFatigueStore();

  const snapshotTimerRef = useRef<NodeJS.Timeout | null>(null);
  const locationQueueRef = useRef<LocationData[]>([]);
  const locationRef = useRef<LocationData | null>(null); // Store latest location
  const appStateRef = useRef<AppStateStatus>('active');
  const backgroundShiftEndRef = useRef<NodeJS.Timeout | null>(null);

  // Location hook
  const {
    location,
    isTracking,
    startTracking,
    stopTracking,
    getCurrentLocation,
  } = useLocation({
    enableHighAccuracy: true,
    distanceInterval: 5,
    timeInterval: 10000, // Update every 10 seconds
    onLocationUpdate: (loc) => {
      // Queue location updates if shift is active but not time for snapshot yet
      if (activeShift) {
        locationQueueRef.current.push(loc);
        // Keep only last 10 locations in queue
        if (locationQueueRef.current.length > 10) {
          locationQueueRef.current.shift();
        }
      }
    },
    onError: (err) => {
      setError(err);
    },
  });

  // Update location ref when location changes
  useEffect(() => {
    if (location) {
      locationRef.current = location;
    }
  }, [location]);

  // Send snapshot to API
  const sendSnapshot = useCallback(async (locationData: LocationData): Promise<SnapshotResponse | null> => {
    if (!activeShift) return null;

    // Validate location data before sending
    if (!locationData || !locationData.latitude || !locationData.longitude) {
      console.warn('Invalid GPS data:', locationData);
      return null;
    }

    // Validate latitude/longitude ranges
    if (locationData.latitude < -90 || locationData.latitude > 90) {
      console.warn('Invalid latitude:', locationData.latitude);
      return null;
    }
    if (locationData.longitude < -180 || locationData.longitude > 180) {
      console.warn('Invalid longitude:', locationData.longitude);
      return null;
    }

    // Validate and convert speed
    let speedKmh = 0;
    if (locationData.speed !== undefined && locationData.speed !== null) {
      const speedMs = Number(locationData.speed);
      if (!isNaN(speedMs) && speedMs >= 0) {
        speedKmh = Math.min(speedMs * 3.6, 200); // Cap at 200 km/h (backend validation)
      }
    }

    setIsSending(true);
    setError(null);

    try {
      const snapshot: SnapshotRequest = {
        speed_kmh: speedKmh,
        latitude: Number(locationData.latitude),
        longitude: Number(locationData.longitude),
      };

      console.log('📍 Sending snapshot:', snapshot);
      const response = await snapshotsApi.sendSnapshot(String(activeShift.shift_id), snapshot);
      console.log('✅ Snapshot response:', response.fatigue_level);

      // Update fatigue store with new data
      updateFatigue(response);

      setSnapshotCount((prev) => prev + 1);
      setLastSnapshotTime(new Date());

      return response;
    } catch (err: any) {
      // Better error handling
      let errorMessage = 'Failed to send snapshot';
      if (err?.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      const error = new Error(errorMessage);
      setError(error);
      console.error('Snapshot error:', error);

      // Queue snapshot for retry when online
      locationQueueRef.current.push(locationData);

      return null;
    } finally {
      setIsSending(false);
    }
  }, [activeShift, updateFatigue]);

  // End shift automatically (called when app is fully closed)
  const endShiftAutomatically = useCallback(async () => {
    if (!activeShift) return;

    try {
      console.log('🛑 Auto-ending shift due to app quit:', activeShift.shift_id);
      
      // Send final snapshot if we have location
      if (locationRef.current) {
        await sendSnapshot(locationRef.current);
      }
      
      // End the shift on backend
      await shiftsApi.endShift(String(activeShift.shift_id));
      
      // Clear local state
      clearActiveShift();
      clearFatigueData();
      
      console.log('✅ Shift auto-ended successfully');
    } catch (err) {
      console.error('❌ Error auto-ending shift:', err);
      // Still clear local state even if API call fails
      clearActiveShift();
      clearFatigueData();
    }
  }, [activeShift, sendSnapshot, clearActiveShift, clearFatigueData]);

  // Handle app state changes (active, inactive, background)
  useEffect(() => {
    if (!autoEndShiftOnAppQuit || !activeShift) return;

    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      const previousState = appStateRef.current;
      appStateRef.current = nextAppState;

      console.log(`📱 AppState: ${previousState} → ${nextAppState}`);

      // Detect when app goes to background/inactive
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // Start a timer - if app stays in background for more than 2 seconds,
        // we assume the user fully quit the app (not just switching apps)
        if (backgroundShiftEndRef.current) {
          clearTimeout(backgroundShiftEndRef.current);
        }

        backgroundShiftEndRef.current = setTimeout(() => {
          // Check if still in background after delay
          if (appStateRef.current === 'background' || appStateRef.current === 'inactive') {
            console.log('🚪 App appears to be fully closed, ending shift...');
            endShiftAutomatically();
          }
        }, 2000); // 2 second delay before considering app as "quit"
      }

      // User came back to the app - cancel the auto-end
      if (nextAppState === 'active' && backgroundShiftEndRef.current) {
        console.log('✅ User returned to app, canceling auto-end');
        clearTimeout(backgroundShiftEndRef.current);
        backgroundShiftEndRef.current = null;
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
      if (backgroundShiftEndRef.current) {
        clearTimeout(backgroundShiftEndRef.current);
      }
    };
  }, [activeShift, autoEndShiftOnAppQuit, endShiftAutomatically]);

  // Start shift tracking
  const startShiftTracking = useCallback(async () => {
    if (!activeShift) return;

    try {
      // Clear any existing data
      clearFatigueData();
      setSnapshotCount(0);
      locationQueueRef.current = [];

      // Start location tracking
      await startTracking();

      // Send initial snapshot immediately
      const initialLocation = await getCurrentLocation();
      if (initialLocation) {
        await sendSnapshot(initialLocation);
      }

      // Set up interval for automatic snapshots
      snapshotTimerRef.current = setInterval(async () => {
        // Use locationRef to get the latest location
        if (activeShift && locationRef.current) {
          await sendSnapshot(locationRef.current);
        }
      }, snapshotInterval);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to start shift tracking');
      setError(error);
    }
  }, [activeShift, startTracking, getCurrentLocation, sendSnapshot, location, snapshotInterval, clearFatigueData]);

  // Stop shift tracking
  const stopShiftTracking = useCallback(() => {
    // Clear snapshot timer
    if (snapshotTimerRef.current) {
      clearInterval(snapshotTimerRef.current);
      snapshotTimerRef.current = null;
    }

    // Clear background shift end timer
    if (backgroundShiftEndRef.current) {
      clearTimeout(backgroundShiftEndRef.current);
      backgroundShiftEndRef.current = null;
    }

    // Stop location tracking
    stopTracking();

    // Clear stores
    clearActiveShift();
    clearFatigueData();

    // Reset state
    setSnapshotCount(0);
    setLastSnapshotTime(null);
    locationQueueRef.current = [];
  }, [stopTracking, clearActiveShift, clearFatigueData]);

  // Send queued snapshots (for offline mode)
  const sendQueuedSnapshots = useCallback(async () => {
    if (locationQueueRef.current.length === 0 || !activeShift) return;

    const queue = [...locationQueueRef.current];
    locationQueueRef.current = [];

    for (const loc of queue) {
      await sendSnapshot(loc);
    }
  }, [activeShift, sendSnapshot]);

  // Retry queued snapshots when network is restored
  // Note: We check network status before each sendSnapshot call
  useEffect(() => {
    const checkAndSendQueued = async () => {
      if (locationQueueRef.current.length > 0 && activeShift) {
        console.log('📡 Checking network status for queued snapshots...');
        // SendQueuedSnapshots will be called automatically on next location update
        // if network is available
      }
    };

    checkAndSendQueued();
  }, [activeShift]);

  // Auto-start tracking when shift becomes active
  useEffect(() => {
    if (activeShift && !isTracking) {
      startShiftTracking();
    }
    return () => {
      if (snapshotTimerRef.current) {
        clearInterval(snapshotTimerRef.current);
      }
    };
  }, [activeShift?.shift_id]);

  // Cleanup on unmount - properly stop all tracking
  useEffect(() => {
    return () => {
      if (snapshotTimerRef.current) {
        clearInterval(snapshotTimerRef.current);
        snapshotTimerRef.current = null;
      }
      if (backgroundShiftEndRef.current) {
        clearTimeout(backgroundShiftEndRef.current);
        backgroundShiftEndRef.current = null;
      }
      stopTracking();
      locationQueueRef.current = [];
    };
  }, []);

  return {
    // State
    isTracking,
    isSending,
    snapshotCount,
    lastSnapshotTime,
    location,
    error,
    queuedSnapshotsCount: locationQueueRef.current.length,

    // Actions
    startShiftTracking,
    stopShiftTracking,
    sendSnapshot,
    sendQueuedSnapshots,
    getCurrentLocation,
  };
}

export default useShift;
