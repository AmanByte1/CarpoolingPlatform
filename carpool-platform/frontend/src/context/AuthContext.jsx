import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import { getSocket, disconnectSocket } from '../services/socket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('carpool_user');
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('carpool_token');
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get('/auth/me')
      .then(({ data }) => {
        setUser(data.user);
        localStorage.setItem('carpool_user', JSON.stringify(data.user));
        const socket = getSocket();
        if (!socket.connected) socket.connect();
      })
      .catch(() => {
        localStorage.removeItem('carpool_token');
        localStorage.removeItem('carpool_user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('carpool_token', data.token);
    localStorage.setItem('carpool_user', JSON.stringify(data.user));
    setUser(data.user);
    const socket = getSocket();
    if (!socket.connected) socket.connect();
    return data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    localStorage.setItem('carpool_token', data.token);
    localStorage.setItem('carpool_user', JSON.stringify(data.user));
    setUser(data.user);
    const socket = getSocket();
    if (!socket.connected) socket.connect();
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('carpool_token');
    localStorage.removeItem('carpool_user');
    setUser(null);
    disconnectSocket();
  }, []);

  const refreshUser = useCallback(async () => {
    const { data } = await api.get('/auth/me');
    setUser(data.user);
    localStorage.setItem('carpool_user', JSON.stringify(data.user));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
