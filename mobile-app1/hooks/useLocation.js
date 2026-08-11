import * as Location from 'expo-location';
import { useState } from 'react';

export default function useLocation() {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const requestLocation = async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Permission denied');
        setLoading(false);
        return null;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
      setLocation(loc);
      setLoading(false);
      return loc;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return null;
    }
  };

  return { location, error, loading, requestLocation };
}
