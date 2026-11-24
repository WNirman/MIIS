import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);
const TOKEN_KEY = 'miis_portal_jwt_v1';
const USER_KEY = 'miis_portal_user_v1';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || '');
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [authLoading, setAuthLoading] = useState(false);

  const isValidator = Boolean(user && (user.role === 'validator' || user.role === 'admin'));
  const isReporter = Boolean(user && user.role === 'reporter');
  const isAuthenticated = Boolean(user && token);

  useEffect(() => {
    if (!token) return;
    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.success && data.user) {
          setUser(data.user);
          localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        } else {
          logout();
        }
      })
      .catch(() => {
        // Offline tolerance: retain cached session metadata
      });
  }, []);

  const login = async (email, password) => {
    setAuthLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Login failed');
      }
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      return data.user;
    } finally {
      setAuthLoading(false);
    }
  };

  const registerReporter = async ({ full_name, email, password, organization, district }) => {
    setAuthLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name, email, password, organization, district }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Registration failed');
      }
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      return data.user;
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        authLoading,
        isAuthenticated,
        isValidator,
        isReporter,
        authHeaders,
        login,
        registerReporter,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
