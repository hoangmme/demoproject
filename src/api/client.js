import axios from 'axios';

export const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'hscb.online' || hostname.endsWith('.hscb.online')) {
      return `${window.location.protocol}//api.${hostname}`;
    }
    // For localhost, 127.0.0.1, or local IP (offline)
    return `${window.location.protocol}//${hostname}:8055`;
  }
  return 'http://localhost:8055';
};

export const API_URL = getBaseUrl();
export const STATIC_TOKEN = import.meta.env.VITE_STATIC_TOKEN || '';

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

    if (token && token.trim() !== '' && !config.headers['Authorization']) {
      config.headers['Authorization'] = `Bearer ${token.trim()}`;
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
      console.warn('API Unauthorized 401 - Session expired or unauthenticated');
      // If token in session was rejected, clean access_token so future requests don't loop 401
      try {
        const session = localStorage.getItem('mvp_session');
        if (session) {
          const parsed = JSON.parse(session);
          if (parsed?.access_token) {
            delete parsed.access_token;
            localStorage.setItem('mvp_session', JSON.stringify(parsed));
          }
        }
      } catch (e) {}
    }
    return Promise.reject(error);
  }
);

export default apiClient;
