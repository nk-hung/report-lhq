import axios from 'axios';

function resolveApiBaseUrl() {
  const configuredUrl = import.meta.env.VITE_API_URL?.trim();

  if (configuredUrl) {
    return configuredUrl;
  }
  return '/api';
}

function isLoginRequest(url?: string) {
  if (!url) {
    return false;
  }

  return url.includes('/auth/login');
}

const api = axios.create({
  baseURL: resolveApiBaseUrl(),
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url;
    const hasToken = !!localStorage.getItem('token');

    if (status === 401 && hasToken && !isLoginRequest(requestUrl)) {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('username');

      if (window.location.pathname !== '/login') {
        window.location.replace('/login');
      }
    }

    return Promise.reject(error);
  },
);

export default api;
