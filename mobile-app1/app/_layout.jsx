import React from 'react';
import { Tabs } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function Layout() {
  return (
    <AuthProvider>
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
    </AuthProvider>
  );
}
