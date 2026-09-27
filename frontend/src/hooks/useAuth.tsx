import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { api, authStore } from '../lib/api';
import type { User } from '../lib/types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<User>;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  login: async () => {
    throw new Error('AuthProvider missing');
  },
  logout: () => {},
  isAdmin: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authStore.access) {
      setLoading(false);
      return;
    }
    api
      .get<User>('/auth/me/')
      .then((res) => setUser(res.data))
      .catch(() => authStore.clear())
      .finally(() => setLoading(false));
  }, []);

  const login = async (username: string, password: string) => {
    const { data } = await api.post('/auth/login/', { username, password });
    authStore.setTokens(data.access, data.refresh);
    const me = await api.get<User>('/auth/me/');
    setUser(me.data);
    return me.data;
  };

  const logout = () => {
    authStore.clear();
    setUser(null);
  };

  const value: AuthContextValue = {
    user,
    loading,
    login,
    logout,
    isAdmin: user?.role === 'admin',
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
