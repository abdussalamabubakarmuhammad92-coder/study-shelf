import axios from 'axios';

/** Base axios client. In dev, Vite proxies /api → Django:8000. */
export const api = axios.create({
  baseURL: '/api',
});

const ACCESS_KEY = 'access_token';
const REFRESH_KEY = 'refresh_token';

export const authStore = {
  get access() {
    return localStorage.getItem(ACCESS_KEY);
  },
  get refresh() {
    return localStorage.getItem(REFRESH_KEY);
  },
  setTokens(access: string, refresh: string) {
    localStorage.setItem(ACCESS_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
    api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    delete api.defaults.headers.common['Authorization'];
  },
};

// Attach the token to every request if we have one
if (authStore.access) {
  api.defaults.headers.common['Authorization'] = `Bearer ${authStore.access}`;
}

// On 401, try one silent refresh, then fail through
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && authStore.refresh && !original._retried) {
      original._retried = true;
      try {
        const { data } = await axios.post('/api/auth/refresh/', {
          refresh: authStore.refresh,
        });
        authStore.setTokens(data.access, authStore.refresh!);
        // The request config still carries the expired header — overwrite it
        // explicitly, otherwise the retry re-sends the stale token.
        original.headers = { ...original.headers, Authorization: `Bearer ${data.access}` };
        return api(original);
      } catch {
        authStore.clear();
      }
    }
    return Promise.reject(error);
  },
);
