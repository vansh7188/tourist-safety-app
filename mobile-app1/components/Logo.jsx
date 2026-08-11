import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Logo({ size = 36 }) {
  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size/6 }] }>
      <View style={styles.iconWrap}>
        <View style={styles.shield} />
        <View style={styles.pin} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center'
  },
  iconWrap: { position: 'relative', width: '70%', height: '70%' },
  shield: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: '25%',
    backgroundColor: '#0b69ff',
    borderRadius: 6,
    transform: [{ scaleX: 1 }, { rotate: '0deg' }]
  },
  pin: {
    position: 'absolute',
    left: '30%',
    right: '30%',
    bottom: 0,
    height: '55%',
    backgroundColor: '#fff',
    borderRadius: 6
  }
});
