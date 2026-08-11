import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

export default function SOSButton({ onPress }) {
  return (
    <TouchableOpacity
      style={styles.button}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityLabel="Emergency SOS Button"
    >
      <Text style={styles.text}>EMERGENCY</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#d32f2f',
    width: 300,
    height: 300,
    borderRadius: 150,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  text: { color: '#fff', fontSize: 36, fontWeight: '900', letterSpacing: 2 },
});
