import axios from 'axios';
import { getClientFingerprint } from './fingerprint';

const axiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 60000,
});

// ── Request interceptor — attach token automatically ──────
axiosInstance.interceptors.request.use(
    (config) => {
        // runs in browser only
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            config.headers['X-Device-Fingerprint'] = getClientFingerprint();
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ── Response interceptor — handle 401 globally ────────────
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Do not globally intercept 401s from the login route (let the component handle it)
            if (error.config?.url?.includes('/login')) {
                return Promise.reject(error);
            }
            
            // Clear stale auth data and redirect to login
            if (typeof window !== 'undefined') {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;