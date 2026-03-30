import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform, Alert, Linking } from 'react-native';
import * as Location from 'expo-location';

export interface LocationData {
  latitude: number;
  longitude: number;
  speed: number | null;
  timestamp: string;
}

export interface UseLocationOptions {
  enableHighAccuracy?: boolean;
  distanceInterval?: number; // meters
  timeInterval?: number; // milliseconds
  onLocationUpdate?: (location: LocationData) => void;
  onError?: (error: Error) => void;
}

export function useLocation(options: UseLocationOptions = {}) {
  const {
    enableHighAccuracy = true,
    distanceInterval = 10,
    timeInterval = 5000,
    onLocationUpdate,
    onError,
  } = options;

  const [location, setLocation] = useState<LocationData | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [permission, setPermission] = useState<Location.PermissionStatus | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const permissionRetryCountRef = useRef<number>(0);
  const MAX_PERMISSION_RETRIES = 3;

  // Request location permission with retry mechanism
  const requestPermission = useCallback(async (retryCount = 0): Promise<boolean> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermission(status);

      if (status !== 'granted') {
        const errorMsg = 'La permission de localisation est requise pour suivre vos trajets';
        setError(new Error(errorMsg));
        onError?.(new Error(errorMsg));

        // Retry with exponential backoff if we haven't exceeded max retries
        if (retryCount < MAX_PERMISSION_RETRIES) {
          const delay = Math.pow(2, retryCount) * 1000; // 2s, 4s, 8s
          await new Promise(resolve => setTimeout(resolve, delay));
          return requestPermission(retryCount + 1);
        }

        // Show alert to open settings after max retries
        Alert.alert(
          'Permission requise',
          errorMsg,
          [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Ouvrir paramètres', onPress: () => Linking.openSettings() },
          ]
        );
        return false;
      }

      // Reset retry count on success
      permissionRetryCountRef.current = 0;

      // Request background permission for Android
      if (Platform.OS === 'android') {
        const backgroundStatus = await Location.requestBackgroundPermissionsAsync();
        if (backgroundStatus.status !== 'granted') {
          console.warn('Background location permission not granted');
        }
      }

      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      onError?.(error);
      
      // Retry on error if we haven't exceeded max retries
      if (retryCount < MAX_PERMISSION_RETRIES) {
        const delay = Math.pow(2, retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return requestPermission(retryCount + 1);
      }
      
      return false;
    }
  }, [onError]);

  // Start location tracking
  const startTracking = useCallback(async () => {
    // Check permission first
    if (!permission) {
      const hasPermission = await requestPermission();
      if (!hasPermission) return;
    } else if (permission !== 'granted') {
      await requestPermission();
      return;
    }

    try {
      setIsTracking(true);
      setError(null);

      // Get initial location
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: enableHighAccuracy ? Location.Accuracy.High : Location.Accuracy.Balanced,
      });

      const locationData: LocationData = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        speed: currentLocation.coords.speed,
        timestamp: new Date(currentLocation.timestamp).toISOString(),
      };

      setLocation(locationData);
      onLocationUpdate?.(locationData);

      // Start watching position
      subscriptionRef.current = await Location.watchPositionAsync(
        {
          accuracy: enableHighAccuracy ? Location.Accuracy.High : Location.Accuracy.Balanced,
          distanceInterval,
          timeInterval,
        },
        (loc) => {
          const newLocation: LocationData = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            speed: loc.coords.speed,
            timestamp: new Date(loc.timestamp).toISOString(),
          };

          setLocation(newLocation);
          onLocationUpdate?.(newLocation);
        }
      );
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to start tracking');
      setError(error);
      onError?.(error);
      setIsTracking(false);
    }
  }, [permission, requestPermission, enableHighAccuracy, distanceInterval, timeInterval, onLocationUpdate, onError]);

  // Stop location tracking
  const stopTracking = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
      subscriptionRef.current = null;
    }
    setIsTracking(false);
  }, []);

  // Get current location once
  const getCurrentLocation = useCallback(async (): Promise<LocationData | null> => {
    try {
      if (!permission) {
        const hasPermission = await requestPermission();
        if (!hasPermission) return null;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: enableHighAccuracy ? Location.Accuracy.High : Location.Accuracy.Balanced,
      });

      const locationData: LocationData = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        speed: currentLocation.coords.speed,
        timestamp: new Date(currentLocation.timestamp).toISOString(),
      };

      setLocation(locationData);
      return locationData;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to get location');
      setError(error);
      onError?.(error);
      return null;
    }
  }, [permission, requestPermission, enableHighAccuracy, onError]);

  // Reset permission retry count when permission is granted
  useEffect(() => {
    if (permission === 'granted') {
      permissionRetryCountRef.current = 0;
    }
  }, [permission]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
      }
    };
  }, []);

  return {
    location,
    isTracking,
    permission,
    error,
    startTracking,
    stopTracking,
    getCurrentLocation,
    requestPermission,
  };
}

export default useLocation;
