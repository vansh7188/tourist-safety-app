import Constants from 'expo-constants';
import { Platform } from 'react-native';

const configuredBackendUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
const expoHost = Constants.expoConfig?.hostUri?.split(':')[0];
const defaultHost = Platform.OS === 'web' ? 'localhost' : expoHost || '10.0.2.2';
const backendUrl = configuredBackendUrl || `http://${defaultHost}:5000`;

export const API_BASE_URL = `${backendUrl}/api`;
export const AUTH_BASE_URL = backendUrl;

// NOTE: When running the app on a physical device, replace `localhost` with
// your machine IP address (e.g. http://192.168.1.10:5000/api) so the phone can reach the backend.
