import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import LoadingSpinner from '../components/LoadingSpinner';
import useLocation from '../hooks/useLocation';

const DEFAULT_REGION = {
  latitude: 20.5937,
  longitude: 78.9629,
  latitudeDelta: 25,
  longitudeDelta: 25,
};

export default function MapScreen() {
  const { user, hydrating } = useAuth();
  const { location, error, loading, requestLocation } = useLocation();
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (user) requestLocation();
  }, [user]);

  if (hydrating) return <LoadingSpinner />;
  if (!user) return <Redirect href="/login" />;

  const coordinates = location?.coords;
  const region = coordinates
    ? {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }
    : DEFAULT_REGION;

  const recenter = async () => {
    const nextLocation = await requestLocation();
    if (!nextLocation) Alert.alert('Location', error || 'Unable to get your location.');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Logo size={36} />
        <Text style={styles.title}>Nearby Safe Zones</Text>
      </View>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={region}
        showsUserLocation={Boolean(coordinates)}
        showsMyLocationButton={false}
        onMapReady={() => setMapReady(true)}
      >
        {coordinates && (
          <Marker
            coordinate={{ latitude: coordinates.latitude, longitude: coordinates.longitude }}
            title="You are here"
          />
        )}
      </MapView>
      <View style={styles.status}>
        {!mapReady && <Text style={styles.note}>Loading Google Maps...</Text>}
        {mapReady && loading && <Text style={styles.note}>Finding your location...</Text>}
        {mapReady && !loading && !coordinates && (
          <Text style={styles.note}>Location is unavailable. The map is still usable.</Text>
        )}
        {error && <Text style={styles.error}>{error}</Text>}
      </View>
      <TouchableOpacity style={styles.recenter} onPress={recenter} disabled={loading}>
        <Text style={styles.recenterText}>{loading ? 'Locating...' : 'Use my location'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F6' },
  header: { position: 'absolute', top: 48, left: 16, right: 16, zIndex: 1, flexDirection: 'row', alignItems: 'center' },
  title: { marginLeft: 10, color: '#001F3F', fontSize: 20, fontWeight: '700' },
  map: { flex: 1 },
  status: { position: 'absolute', left: 16, right: 16, bottom: 86, padding: 10, backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 8 },
  note: { color: '#52616b' },
  error: { color: '#B3261E', marginTop: 4 },
  recenter: { position: 'absolute', right: 16, bottom: 28, paddingHorizontal: 14, paddingVertical: 11, backgroundColor: '#001F3F', borderRadius: 8 },
  recenterText: { color: '#fff', fontWeight: '700' },
});
