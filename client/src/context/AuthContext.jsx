import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { mockData } from '../services/api.js';

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

  useEffect(() => {
    // Restore theme
    const savedTheme = localStorage.getItem('uniassist_theme') || 'dark';
    setTheme(savedTheme);

    // Restore user session
    const savedToken = localStorage.getItem('uniassist_token');
    const savedUser = localStorage.getItem('uniassist_user');

    if (savedToken && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Failed to parse cached user', e);
      }
    } else {
      // Default to guest/mock student for instant preview
      const defaultUser = {
        id: mockData.student.id,
        fullName: mockData.student.name,
        firstName: mockData.student.name.split(' ')[0],
        lastName: mockData.student.name.split(' ')[1] || '',
        email: mockData.student.email,
        role: 'student',
        profile: mockData.student
      };
      setUser(defaultUser);
      localStorage.setItem('uniassist_user', JSON.stringify(defaultUser));
      localStorage.setItem('uniassist_token', 'mock-jwt-token-demo');
    }
    setLoading(false);
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const login = async (email, password, fallbackRole = 'student') => {
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data && res.data.token) {
        localStorage.setItem('uniassist_token', res.data.token);
        localStorage.setItem('uniassist_user', JSON.stringify(res.data.user));
        setUser(res.data.user);
        return { success: true };
      }
    } catch (err) {
      console.warn('Backend offline or login failed, switching to demo profile', err);
      // Demo fallback
      let demoUser = null;
      if (fallbackRole === 'faculty') {
        demoUser = {
          id: mockData.faculty.id,
          fullName: mockData.faculty.name,
          firstName: mockData.faculty.name.split(' ')[0],
          lastName: mockData.faculty.name.split(' ').slice(1).join(' '),
          email: mockData.faculty.email,
          role: 'faculty',
          profile: mockData.faculty
        };
      } else {
        demoUser = {
          id: mockData.student.id,
          fullName: mockData.student.name,
          firstName: mockData.student.name.split(' ')[0],
          lastName: mockData.student.name.split(' ')[1] || '',
          email: mockData.student.email,
          role: 'student',
          profile: mockData.student
        };
      }
      setUser(demoUser);
      localStorage.setItem('uniassist_user', JSON.stringify(demoUser));
      localStorage.setItem('uniassist_token', 'mock-token-demo');
      return { success: true, isDemo: true };
    }
  };

  const register = async (formData) => {
    try {
      const res = await api.post('/auth/register', formData);
      if (res.data && res.data.token) {
        localStorage.setItem('uniassist_token', res.data.token);
        localStorage.setItem('uniassist_user', JSON.stringify(res.data.user));
        setUser(res.data.user);
        return { success: true };
      }
    } catch (err) {
      console.warn('Backend offline or register error, creating demo session', err);
      const demoUser = {
        id: 'DEMO-' + Date.now().toString().slice(-4),
        fullName: `${formData.firstName} ${formData.lastName}`,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        role: formData.role || 'student',
        profile: {
          department: formData.department || 'General Studies',
          currentSemester: formData.currentSemester || 1
        }
      };
      setUser(demoUser);
      localStorage.setItem('uniassist_user', JSON.stringify(demoUser));
      localStorage.setItem('uniassist_token', 'mock-token-demo');
      return { success: true };
    }
  };

  const logout = () => {
    localStorage.removeItem('uniassist_token');
    localStorage.removeItem('uniassist_user');
    setUser(null);
  };

  const switchRole = (newRole) => {
    const demoUser = newRole === 'faculty'
      ? {
          id: mockData.faculty.id,
          fullName: mockData.faculty.name,
          firstName: mockData.faculty.name.split(' ')[0],
          lastName: mockData.faculty.name.split(' ').slice(1).join(' '),
          email: mockData.faculty.email,
          role: 'faculty',
          profile: mockData.faculty
        }
      : {
          id: mockData.student.id,
          fullName: mockData.student.name,
          firstName: mockData.student.name.split(' ')[0],
          lastName: mockData.student.name.split(' ')[1] || '',
          email: mockData.student.email,
          role: 'student',
          profile: mockData.student
        };
    setUser(demoUser);
    localStorage.setItem('uniassist_user', JSON.stringify(demoUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user ? user.role : 'guest',
        isAuthenticated: !!user,
        loading,
        theme,
        toggleTheme,
        login,
        register,
        logout,
        switchRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
