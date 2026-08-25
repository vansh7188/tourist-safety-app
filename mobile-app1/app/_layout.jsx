import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { Tabs } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function Layout() {
  const [isAppReady, setIsAppReady] = useState(false);
  const fadeAnim = React.useRef(new Animated.Value(1)).current; // Fade out splash
  const scaleAnim = React.useRef(new Animated.Value(0.95)).current; // Scale up logo

  useEffect(() => {
    // Start entry animation
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1.1,
        duration: 2000,
        useNativeDriver: true,
      }),
    ]).start();

    // Hold splash screen for 2.5 seconds, then fade out
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        setIsAppReady(true);
      });
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AuthProvider>
      <View style={{ flex: 1 }}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: { backgroundColor: '#fff', borderTopColor: '#e6eef6', height: 72 },
            tabBarShowLabel: true,
          }}
        >
          <Tabs.Screen name="index" options={{ title: 'Safety', tabBarIcon: ({ color, size }) => <Ionicons name="shield-checkmark" size={size} color={color} /> }} />
          <Tabs.Screen name="assistant" options={{ title: 'Assistant', tabBarIcon: ({ color, size }) => <Ionicons name="chatbox-ellipses" size={size} color={color} /> }} />
          <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <Ionicons name="person-circle" size={size} color={color} /> }} />
        </Tabs>

        {!isAppReady && (
          <Animated.View style={[StyleSheet.absoluteFillObject, styles.splashContainer, { opacity: fadeAnim }]}>
            <Animated.Image
              source={require('../assets/logo.png')}
              style={[styles.splashLogo, { transform: [{ scale: scaleAnim }] }]}
              resizeMode="contain"
            />
            <Animated.Text style={styles.splashText}>TravelGuard AI</Animated.Text>
          </Animated.View>
        )}
      </View>
    </AuthProvider>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  splashContainer: {
    backgroundColor: '#001F3F', // theme navy color
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99999, // Ensure it covers everything
  },
  splashLogo: {
    width: width * 0.5,
    height: width * 0.5,
    marginBottom: 24,
  },
  splashText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 2,
  },
});

