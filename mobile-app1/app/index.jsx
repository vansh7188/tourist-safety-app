import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, Dimensions, TouchableOpacity } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useRouter } from 'expo-router';
import { useAuth } from './context/AuthContext';
import Logo from '../components/Logo';
import useLocation from '../hooks/useLocation';
import api from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';

const COLORS = {
  navy: '#001F3F',
  teal: '#39CCCC',
  bg: '#F4F6F6',
  danger: '#D32F2F'
};

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const { location, requestLocation, loading: locLoading } = useLocation();
  const [markers, setMarkers] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [highCrime, setHighCrime] = useState(false);

  useEffect(() => {
    if (!user) router.push('/login');
  }, [user]);

  useEffect(() => {
    // placeholder: fetch safety data from backend
    const fetchData = async () => {
      try {
        // const res = await api.get('/safety/nearby');
        // setMarkers(res.data.markers);
        // setAlerts(res.data.alerts);
        // stub data
        setMarkers([
          { id: 'p1', latitude: 37.78825, longitude: -122.4324, title: 'Police Station' },
        ]);
        setAlerts([
          { id: 'a1', severity: 'High', text: 'Robbery reported', distance: 0.02, rating: 4.2 },
        ]);
        setHighCrime(true);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const handleRecenter = async () => {
    const loc = await requestLocation();
    if (!loc) Alert.alert('Location', 'Unable to get location.');
  };

  const handleSOS = async () => {
    try {
      const loc = await requestLocation();
      if (!loc) return Alert.alert('Location', 'Permission required');
      const { latitude, longitude } = loc.coords;
      await api.post('/panic', { latitude, longitude, timestamp: new Date().toISOString() });
      Alert.alert('Emergency', 'Alert sent. Help is on the way.');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to send emergency');
    }
  };

  if (!user) return null;

  const { width } = Dimensions.get('window');
  const mapHeight = Math.round(width * 0.5);

  return (
    <View style={[styles.container, { backgroundColor: COLORS.bg }]}> 
      <View style={[styles.header, { backgroundColor: COLORS.navy }]}> 
        <View style={styles.headerLeft}>
          <Logo size={36} />
          <Text style={styles.title}>TravelGuard AI</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.badge, { backgroundColor: COLORS.teal }]}> 
            <Text style={styles.badgeText}>Live Monitoring</Text>
          </View>
          {highCrime && (
            <View style={[styles.alertPill, { backgroundColor: COLORS.danger }]}> 
              <Text style={styles.alertText}>High Crime Area</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Live Safety Map</Text>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={{ width: '100%', height: mapHeight, borderRadius: 12 }}
          initialRegion={{
            latitude: location?.coords?.latitude || 37.78825,
            longitude: location?.coords?.longitude || -122.4324,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}
        >
          {markers.map((m) => (
            <Marker key={m.id} coordinate={{ latitude: m.latitude, longitude: m.longitude }} title={m.title} />
          ))}
        </MapView>
        <TouchableOpacity style={styles.recenter} onPress={handleRecenter}><Text style={styles.recenterText}>Re-center</Text></TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Smart Area Alerts</Text>
        {alerts.map((a) => (
          <View key={a.id} style={styles.alertRow}>
            <View style={[styles.severity, { backgroundColor: a.severity === 'High' ? COLORS.danger : COLORS.teal }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.alertTitle}>{a.text}</Text>
              <Text style={styles.alertMeta}>{`${a.distance} km • Area Rating ${a.rating}/5`}</Text>
            </View>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.sosContainer} onPress={handleSOS} activeOpacity={0.9}>
        <View style={styles.sosPulse} />
        <View style={styles.sosButton}>
          <Text style={styles.sosText}>SOS</Text>
        </View>
      </TouchableOpacity>

      {(locLoading) && <LoadingSpinner />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 44, paddingHorizontal: 16, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  title: { color: '#fff', fontWeight: '800', fontSize: 18, marginLeft: 12 },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, marginRight: 8 },
  badgeText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  alertPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 },
  alertText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  card: { margin: 12, backgroundColor: '#fff', borderRadius: 12, padding: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 4 },
  cardTitle: { fontWeight: '800', fontSize: 16, marginBottom: 8 },
  recenter: { position: 'absolute', right: 16, bottom: 16, backgroundColor: '#fff', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#eee' },
  recenterText: { fontWeight: '700' },
  alertRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f2f4' },
  severity: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  alertTitle: { fontWeight: '700' },
  alertMeta: { color: '#666', marginTop: 4 },
  sosContainer: { position: 'absolute', alignSelf: 'center', bottom: 28, alignItems: 'center', justifyContent: 'center' },
  sosPulse: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(211,47,47,0.15)' },
  sosButton: { width: 140, height: 140, borderRadius: 70, backgroundColor: '#D32F2F', alignItems: 'center', justifyContent: 'center', elevation: 10 },
  sosText: { color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: 2 }
});
