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
export const STATIC_TOKEN = import.meta.env.VITE_STATIC_TOKEN || 'CooAJKTu9_NLEgtaq3qULrswZGLFfsAw';

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const decodeJwtPayload = (jwt) => {
  try {
    if (!jwt || typeof jwt !== 'string') return null;
    const parts = jwt.split('.');
    if (parts.length !== 3) return null;
    let b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    try {
      return JSON.parse(decodeURIComponent(escape(atob(b64))));
    } catch (e1) {
      return JSON.parse(atob(b64));
    }
  } catch (e) {
    return null;
  }
};

// Request Interceptor
apiClient.interceptors.request.use(
  (config) => {
    let token = STATIC_TOKEN;
    if (!config._retryWithStatic) {
      try {
        const session = localStorage.getItem('mvp_session');
        if (session) {
          const parsed = JSON.parse(session);
          if (parsed?.access_token) {
            const payload = decodeJwtPayload(parsed.access_token);
            // Nếu token còn hạn ít nhất 30 giây -> dùng access_token, ngược lại dùng STATIC_TOKEN
            if (payload?.exp && Date.now() < (payload.exp - 30) * 1000) {
              token = parsed.access_token;
            } else {
              token = STATIC_TOKEN;
            }
          }
        }
      } catch (e) {
        token = STATIC_TOKEN;
      }
    }

    if (token && token.trim() !== '') {
      config.headers['Authorization'] = `Bearer ${token.trim()}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response ? error.response.status : null;
    const originalRequest = error.config;
    if ((status === 401 || status === 403) && originalRequest && !originalRequest._retryWithStatic) {
      originalRequest._retryWithStatic = true;
      console.warn(`API ${status} - Session invalid or expired, retrying with STATIC_TOKEN`);
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
      if (STATIC_TOKEN && STATIC_TOKEN.trim() !== '') {
        originalRequest.headers['Authorization'] = `Bearer ${STATIC_TOKEN.trim()}`;
        return apiClient(originalRequest);
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
