import React from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';

export default function App() {
  const handlePanic = () => {
    Alert.alert('Panic', 'Panic alert sent (stub)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>AmonBile Safety</Text>
      <TouchableOpacity style={styles.panicButton} onPress={handlePanic}>
        <Text style={styles.panicText}>PANIC</Text>
      </TouchableOpacity>
      <View style={styles.footer}>
        <Text style={styles.note}>This is a scaffolded Expo app — integrate APIs next.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: '600', marginBottom: 24 },
  panicButton: { backgroundColor: '#d32f2f', paddingVertical: 24, paddingHorizontal: 48, borderRadius: 12 },
  panicText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  footer: { position: 'absolute', bottom: 24 },
  note: { color: '#666' }
});
