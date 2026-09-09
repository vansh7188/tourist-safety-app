import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { AUTH_BASE_URL } from '../config';
import api from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [hydrating, setHydrating] = useState(true);

  useEffect(() => {
    const hydrateSession = async () => {
      try {
        const [storedToken, storedEmail] = await Promise.all([
          AsyncStorage.getItem('token'),
          AsyncStorage.getItem('email'),
        ]);

        if (storedToken && storedEmail) {
          setToken(storedToken);
          setUser({
            name: storedEmail.split('@')[0],
            email: storedEmail,
          });
        }
      } catch (error) {
        console.error('Failed to restore auth session:', error);
      } finally {
        setHydrating(false);
      }
    };

    hydrateSession();
  }, []);

  const login = async ({ email, password }) => {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedPassword = String(password || '');

    const response = await axios.post(`${AUTH_BASE_URL}/login`, {
      email: normalizedEmail,
      password: normalizedPassword,
    });

    const nextToken = response?.data?.token;
    if (!nextToken) {
      throw new Error('Token missing in login response');
    }

    await Promise.all([
      AsyncStorage.setItem('token', nextToken),
      AsyncStorage.setItem('email', normalizedEmail),
    ]);

    setToken(nextToken);
    setUser({
      name: normalizedEmail.split('@')[0],
      email: normalizedEmail,
    });

    return true;
  };

  const signup = async ({ email, password }) => {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedPassword = String(password || '');

    await axios.post(`${AUTH_BASE_URL}/signup`, {
      email: normalizedEmail,
      password: normalizedPassword,
    });
  };

  const logout = async () => {
    await Promise.all([
      AsyncStorage.removeItem('token'),
      AsyncStorage.removeItem('email'),
    ]);

    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response && error.response.status === 401) {
          await logout();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  const value = useMemo(
    () => ({ user, token, hydrating, login, signup, logout }),
    [user, token, hydrating]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}