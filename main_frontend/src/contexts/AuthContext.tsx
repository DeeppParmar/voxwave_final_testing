import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '@/config/runtime';

axios.defaults.baseURL = API_BASE_URL;

type AuthUser = {
  id: number;
  username: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_STORAGE_KEY = 'voxwave_token';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      try {
        if (!token) {
          if (!cancelled) setUser(null);
          return;
        }
        const resp = await axios.get('/me');
        if (!cancelled) setUser(resp.data);
      } catch {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        if (!cancelled) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    hydrate();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const login = async (username: string, password: string) => {
    const resp = await axios.post('/auth/login', { username, password });
    const newToken = resp.data?.token;
    const newUsername = resp.data?.username;
    if (!newToken || !newUsername) throw new Error('Invalid login response');

    localStorage.setItem(TOKEN_STORAGE_KEY, newToken);
    setToken(newToken);

    const me = await axios.get('/me', {
      headers: { Authorization: `Bearer ${newToken}` },
    });
    setUser(me.data);
  };

  const register = async (username: string, password: string) => {
    const resp = await axios.post('/auth/register', { username, password });
    const newToken = resp.data?.token;
    const newUsername = resp.data?.username;
    if (!newToken || !newUsername) throw new Error('Invalid register response');

    localStorage.setItem(TOKEN_STORAGE_KEY, newToken);
    setToken(newToken);

    const me = await axios.get('/me', {
      headers: { Authorization: `Bearer ${newToken}` },
    });
    setUser(me.data);
  };

  const logout = async () => {
    try {
      await axios.post('/auth/logout');
    } catch {
    } finally {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      setToken(null);
      setUser(null);
    }
  };

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, loading, login, register, logout }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
