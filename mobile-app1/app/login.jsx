import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';

const COLORS = { navy: '#001F3F', teal: '#39CCCC', bg: '#F4F6F6' };

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Validation', 'Please enter email and password');
      return;
    }
    try {
      await login({ email, password });
      router.replace('/');
    } catch (err) {
      Alert.alert('Login failed', err?.message || 'Unable to login');
    }
  };

  const handleCreate = () => {
    // stub for account creation flow
    Alert.alert('Create Account', 'Account creation placeholder');
  };

  return (
    <View style={[styles.container, { backgroundColor: COLORS.bg }]}> 
      <View style={styles.top}><Logo size={72} /><Text style={styles.appName}>TravelGuard AI</Text></View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TouchableOpacity style={[styles.loginButton, { backgroundColor: COLORS.navy }]} onPress={handleLogin}>
          <Text style={styles.loginText}>Log In</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.createButton, { borderColor: COLORS.navy }]} onPress={handleCreate}>
          <Text style={[styles.createText, { color: COLORS.navy }]}>Create Account</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => Alert.alert('Forgot Password', 'Password reset placeholder')}>
          <Text style={styles.forgot}>Forgot Password?</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  top: { alignItems: 'center', marginBottom: 12 },
  appName: { fontSize: 22, fontWeight: '900', marginTop: 12, marginBottom: 12, color: '#001F3F' },
  form: { width: '100%', maxWidth: 420, alignItems: 'center' },
  input: { width: '100%', padding: 12, borderRadius: 8, backgroundColor: '#fff', marginBottom: 12, borderWidth: 1, borderColor: '#e9eef3' },
  loginButton: { width: '100%', padding: 14, borderRadius: 10, alignItems: 'center', marginBottom: 10 },
  loginText: { color: '#fff', fontWeight: '700' },
  createButton: { width: '100%', padding: 12, borderRadius: 10, backgroundColor: '#fff', alignItems: 'center', borderWidth: 1, marginBottom: 10 },
  createText: { fontWeight: '700' },
  forgot: { color: '#666', marginTop: 6 },
});
