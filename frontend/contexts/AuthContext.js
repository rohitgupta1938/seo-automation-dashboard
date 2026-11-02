'use client';
// contexts/AuthContext.js
import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('seo_token');
    if (token) {
      api.me()
        .then(data => setUser(data.user))
        .catch(() => { localStorage.removeItem('seo_token'); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  async function login(email, password) {
    const data = await api.login(email, password);
    localStorage.setItem('seo_token', data.token);
    setUser(data.user);
    return data;
  }

  async function logout() {
    localStorage.removeItem('seo_token');
    setUser(null);
    api.logout().catch(() => {});
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
