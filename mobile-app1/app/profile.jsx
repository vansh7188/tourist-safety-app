import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from './context/AuthContext';
import Logo from '../components/Logo';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  if (!user) return null;
  return (
    <View style={styles.container}>
      <View style={styles.header}><Logo size={48} /><Text style={styles.title}>TravelGuard AI</Text></View>
      <View style={styles.card}>
        <Text style={styles.label}>Signed in as</Text>
        <Text style={styles.value}>{user.email}</Text>
      </View>
      <TouchableOpacity style={styles.logout} onPress={logout}><Text style={styles.logoutText}>Log out</Text></TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F4F6F6' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 20, fontWeight: '800', marginLeft: 12 },
  card: { padding: 16, backgroundColor: '#fff', borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.05, elevation: 4 },
  label: { color: '#666', fontWeight: '700' },
  value: { marginTop: 8, fontSize: 16, fontWeight: '800' },
  logout: { marginTop: 24, backgroundColor: '#fff', padding: 12, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#001F3F' },
  logoutText: { fontWeight: '800', color: '#001F3F' }
});
