import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { mockData } from '../services/api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('uniassist_token');
    const savedUser = localStorage.getItem('uniassist_user');

    if (savedToken && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Failed to parse cached user', e);
      }
    } else {
      // Default to guest or mock student for immediate showcase preview
      const defaultUser = {
        id: mockData.student.id,
        fullName: mockData.student.name,
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
      console.warn('Backend offline or login failed, switching to role demo profile', err);
      // Fallback Demo Login
      let demoUser = null;
      if (fallbackRole === 'faculty') {
        demoUser = {
          id: mockData.faculty.id,
          fullName: mockData.faculty.name,
          email: mockData.faculty.email,
          role: 'faculty',
          profile: mockData.faculty
        };
      } else {
        demoUser = {
          id: mockData.student.id,
          fullName: mockData.student.name,
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
      console.warn('Backend offline or register error, creating client session', err);
      const demoUser = {
        id: 'DEMO-' + Date.now().toString().slice(-4),
        fullName: `${formData.firstName} ${formData.lastName}`,
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
    if (newRole === 'faculty') {
      const demoFaculty = {
        id: mockData.faculty.id,
        fullName: mockData.faculty.name,
        email: mockData.faculty.email,
        role: 'faculty',
        profile: mockData.faculty
      };
      setUser(demoFaculty);
      localStorage.setItem('uniassist_user', JSON.stringify(demoFaculty));
    } else {
      const demoStudent = {
        id: mockData.student.id,
        fullName: mockData.student.name,
        email: mockData.student.email,
        role: 'student',
        profile: mockData.student
      };
      setUser(demoStudent);
      localStorage.setItem('uniassist_user', JSON.stringify(demoStudent));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user ? user.role : 'guest',
        isAuthenticated: !!user,
        loading,
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
