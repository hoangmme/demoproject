import axios from 'axios';

const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:8055';
    }
  }
  return 'https://demodirectus.mme.vn';
};

export const API_URL = getBaseUrl();
export const STATIC_TOKEN = import.meta.env.VITE_STATIC_TOKEN || 'mvp-static-token-999';

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor
apiClient.interceptors.request.use(
  (config) => {
    let token = STATIC_TOKEN;
    try {
      const session = localStorage.getItem('mvp_session');
      if (session) {
        const parsed = JSON.parse(session);
        if (parsed?.access_token) {
          token = parsed.access_token;
        }
      }
    } catch (e) {}

    if (token && !config.headers['Authorization']) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response ? error.response.status : null;
    if (status === 401) {
      console.warn('API Unauthorized 401 - Clearing session');
      // optional: localStorage.removeItem('mvp_session');
    }
    return Promise.reject(error);
  }
);

export default apiClient;
