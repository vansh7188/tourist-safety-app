import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';

export default function MapScreen() {
  const { user } = useAuth();
  if (!user) return <Redirect href="/login" />;
  return (
    <View style={styles.container}>
      <View style={{ position: 'absolute', top: 12, left: 12 }}><Logo size={36} /></View>
      <Text style={styles.title}>Nearby Safe Zones</Text>
      <Text style={styles.note}>Map integration scaffold will go here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  note: { color: '#666' },
});
