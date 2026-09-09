import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';

export default function useLocation() {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isWatching, setIsWatching] = useState(false);
  const watcherRef = useRef(null);

  const requestPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Location permission denied. Enable location access in device settings.');
    }
  };

  const getCurrentLocation = async () => {
    const servicesEnabled = await Location.hasServicesEnabledAsync();
    if (!servicesEnabled) {
      throw new Error('Device location services are off. Turn on GPS and try again.');
    }

    const positionRequest = Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    const timeout = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('GPS is taking too long. Move outdoors or select a location manually.')), 12000);
    });

    try {
      return await Promise.race([positionRequest, timeout]);
    } catch {
      return Location.getLastKnownPositionAsync();
    }
  };

  const requestLocation = async () => {
    try {
      setLoading(true);
      setError(null);
      await requestPermission();
      const loc = await getCurrentLocation();
      if (!loc) throw new Error('No device location is available yet. Try again or select a location manually.');
      setLocation(loc);
      return loc;
    } catch (err) {
      setError(err.message || 'Unable to read the device location.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const stopWatching = () => {
    watcherRef.current?.remove();
    watcherRef.current = null;
    setIsWatching(false);
  };

  const startWatching = async () => {
    try {
      setLoading(true);
      setError(null);
      await requestPermission();
      stopWatching();

      const current = await getCurrentLocation();
      if (!current) throw new Error('No device location is available yet. Try again or select a location manually.');
      setLocation(current);

      watcherRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        setLocation
      );
      setIsWatching(true);
      return current;
    } catch (err) {
      setError(err.message || 'Unable to read the device location.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const setManualLocation = ({ latitude, longitude }) => {
    stopWatching();
    setError(null);
    setLocation({
      coords: { latitude, longitude, accuracy: null },
      timestamp: Date.now(),
      source: 'manual',
    });
  };

  useEffect(() => stopWatching, []);

  return {
    location,
    error,
    loading,
    isWatching,
    requestLocation,
    startWatching,
    stopWatching,
    setManualLocation,
  };
}
