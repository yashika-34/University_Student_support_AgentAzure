import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState('dark');

  // Apply theme class to <html>
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'light');
    root.classList.add(theme);
    localStorage.setItem('uniassist_theme', theme);
  }, [theme]);

  // Restore session from JWT
  useEffect(() => {
    const initAuth = async () => {
      const savedTheme = localStorage.getItem('uniassist_theme') || 'dark';
      setTheme(savedTheme);

      const token = localStorage.getItem('uniassist_token');
      if (token) {
        try {
          const res = await authAPI.getMe();
          if (res.data?.user) {
            setUser(res.data.user);
            localStorage.setItem('uniassist_user', JSON.stringify(res.data.user));
          } else {
            localStorage.removeItem('uniassist_token');
            localStorage.removeItem('uniassist_user');
            setUser(null);
          }
        } catch (err) {
          console.warn('Session verification failed or token expired:', err.message);
          localStorage.removeItem('uniassist_token');
          localStorage.removeItem('uniassist_user');
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const login = async (email, password) => {
    try {
      const res = await authAPI.login({ email, password });
      if (res.data && res.data.token) {
        localStorage.setItem('uniassist_token', res.data.token);
        localStorage.setItem('uniassist_user', JSON.stringify(res.data.user));
        setUser(res.data.user);
        return { success: true, user: res.data.user };
      }
      return { success: false, message: 'Invalid response from server.' };
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Login failed. Please check credentials.';
      return { success: false, message };
    }
  };

  const register = async (formData) => {
    try {
      const res = await authAPI.register(formData);
      if (res.data && res.data.token) {
        localStorage.setItem('uniassist_token', res.data.token);
        localStorage.setItem('uniassist_user', JSON.stringify(res.data.user));
        setUser(res.data.user);
        return { success: true, user: res.data.user };
      }
      return { success: false, message: 'Registration failed.' };
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Registration failed.';
      return { success: false, message };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (err) {
      console.warn('Logout request error:', err.message);
    } finally {
      localStorage.removeItem('uniassist_token');
      localStorage.removeItem('uniassist_user');
      setUser(null);
    }
  };

  const updateUser = (updatedUser) => {
    setUser((prev) => {
      const merged = { ...prev, ...updatedUser };
      localStorage.setItem('uniassist_user', JSON.stringify(merged));
      return merged;
    });
  };

  const switchRole = async (targetRole) => {
    // In production: users must log in with their own credentials.
    // This is a no-op — the UI demo switcher buttons are only shown for development convenience.
    console.info(`[UniAssist] Role switch to "${targetRole}" requested — user must log in with appropriate credentials.`);
    return { success: false, message: 'Please log in with the appropriate account credentials to switch roles.' };
  };

  const role = user?.role || null;
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated,
        loading,
        theme,
        toggleTheme,
        login,
        register,
        logout,
        updateUser,
        switchRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
