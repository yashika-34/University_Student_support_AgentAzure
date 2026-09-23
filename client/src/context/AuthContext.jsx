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

  // Demo accounts for static deployment fallback (GitHub Pages)
  const DEMO_ACCOUNTS = {
    'dr.alan@university.edu': {
      password: 'Faculty@1234',
      user: {
        _id: 'demo-faculty-001',
        id: 'demo-faculty-001',
        fullName: 'Dr. Alan Turing',
        firstName: 'Alan',
        lastName: 'Turing',
        email: 'dr.alan@university.edu',
        role: 'faculty',
        profile: { department: 'Computer Science', designation: 'Professor' }
      }
    },
    'alex.student@university.edu': {
      password: 'Student@1234',
      user: {
        _id: 'demo-student-001',
        id: 'demo-student-001',
        fullName: 'Alex Mercer',
        firstName: 'Alex',
        lastName: 'Mercer',
        email: 'alex.student@university.edu',
        role: 'student',
        profile: {
          studentId: 'STU-2024-001',
          degreeProgram: 'B.Tech Computer Science',
          currentSemester: 5,
          cgpa: 8.65,
          completedCredits: 74
        }
      }
    },
    'emma.student@university.edu': {
      password: 'Student@1234',
      user: {
        _id: 'demo-student-002',
        id: 'demo-student-002',
        fullName: 'Emma Wilson',
        firstName: 'Emma',
        lastName: 'Wilson',
        email: 'emma.student@university.edu',
        role: 'student',
        profile: {
          studentId: 'STU-2024-002',
          degreeProgram: 'B.Tech Computer Science',
          currentSemester: 5,
          cgpa: 7.92,
          completedCredits: 70
        }
      }
    },
    'admin@university.edu': {
      password: 'Password123!',
      user: {
        _id: 'demo-admin-001',
        id: 'demo-admin-001',
        fullName: 'Admin User',
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@university.edu',
        role: 'admin',
        profile: {}
      }
    }
  };

  const login = async (email, password) => {
    // Intercept demo logins before making API call to prevent 405 errors on static hosts
    const demoAccount = DEMO_ACCOUNTS[email?.trim().toLowerCase()];
    if (demoAccount && demoAccount.password === password) {
      const demoToken = 'demo-token-' + Date.now();
      localStorage.setItem('uniassist_token', demoToken);
      localStorage.setItem('uniassist_user', JSON.stringify(demoAccount.user));
      setUser(demoAccount.user);
      console.info('[UniAssist] Demo mode: Logged in with mock credentials (no backend).');
      return { success: true, user: demoAccount.user };
    }

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
