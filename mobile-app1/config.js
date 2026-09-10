const backendUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://10.11.17.230:5000';

export const API_BASE_URL = `${backendUrl}/api`;
export const AUTH_BASE_URL = backendUrl;

// NOTE: When running the app on a physical device, replace `localhost` with
// your machine IP address (e.g. http://192.168.1.10:5000/api) so the phone can reach the backend.
