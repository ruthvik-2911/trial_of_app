import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ✅ Use this for React Native — REACT_APP_ prefix only works in web (Create React App)
// For Expo, use EXPO_PUBLIC_ prefix in your .env file: EXPO_PUBLIC_API_URL=https://...
const BASE_URL =
    process.env.EXPO_PUBLIC_API_URL || 'https://sellsathi-refactored.onrender.com';

const RETRY_COUNT = 3;          // retry up to 3 times on 502/503/504
const RETRY_DELAY_MS = 3000;    // wait 3s between retries (Render cold start needs time)

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

// Create axios instance with default config
const apiClient = axios.create({
    baseURL: BASE_URL,
    timeout: 60000, 
    headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Expires': '0',
    },
});

// Request interceptor - auto-refresh Firebase token before each request
apiClient.interceptors.request.use(
    async (config) => {
        try {
            let token = null;
            try {
                const { getAuth } = require('firebase/auth');
                const auth = getAuth();
                const currentUser = auth.currentUser;
                if (currentUser) {
                    token = await currentUser.getIdToken(false);
                    await AsyncStorage.setItem('@auth_token', token);
                } else {
                    token = await AsyncStorage.getItem('@auth_token');
                }
            } catch (firebaseErr) {
                token = await AsyncStorage.getItem('@auth_token');
            }

            if (token && !token.startsWith('test_')) {
                config.headers.Authorization = `Bearer ${token}`;
            } else if (token && token.startsWith('test_')) {
                config.headers['X-Test-UID'] = token;
                console.log('📡 [apiClient] Using X-Test-UID for test user:', token);
            } else {
                console.warn('📡 [apiClient] No token available for request to:', config.url);
            }
        } catch (e) {
            console.error('📡 [apiClient] Failed to get auth token:', e);
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor - retry on 502/503/504 (Render cold-start gateway errors)
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const config = error.config;
        const status = error.response?.status;

        // Retry on gateway/server-unavailable errors (Render cold start)
        const isRetryable = [502, 503, 504].includes(status) || !error.response;
        config._retryCount = config._retryCount || 0;

        if (isRetryable && config._retryCount < RETRY_COUNT) {
            config._retryCount += 1;
            console.warn(
                `📡 [apiClient] ${status || 'Network error'} on ${config.url} — retrying (${config._retryCount}/${RETRY_COUNT}) in ${RETRY_DELAY_MS}ms...`
            );
            await sleep(RETRY_DELAY_MS);
            return apiClient(config);
        }

        // Non-retryable errors
        if (error.response) {
            switch (status) {
                case 401:
                    console.error('📡 [apiClient] 401 Unauthorized — token may be expired.');
                    break;
                case 403:
                    console.error('📡 [apiClient] 403 Forbidden.');
                    break;
                case 404:
                    console.error('📡 [apiClient] 404 Not found:', config.url);
                    break;
                case 500:
                    console.error('📡 [apiClient] 500 Server error.');
                    break;
                default:
                    console.error('📡 [apiClient] Error:', error.response.data);
            }
        } else if (error.request) {
            console.error('📡 [apiClient] No response received — check network/URL.');
        } else {
            console.error('📡 [apiClient] Request setup error:', error.message);
        }

        return Promise.reject(error);
    }
);

export default apiClient;