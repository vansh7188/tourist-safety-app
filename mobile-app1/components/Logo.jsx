import React from 'react';
import { Image, StyleSheet } from 'react-native';

export default function Logo({ size = 36, style }) {
  return (
    <Image
      source={require('../assets/logo.png')}
      style={[{ width: size, height: size }, style]}
      resizeMode="contain"
    />
  );
}

