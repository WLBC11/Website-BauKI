import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// Auto-detect backend URL based on current hostname
const getBackendUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // If on preview domain, use preview backend
    if (hostname.includes('preview.emergentagent.com')) {
      return 'https://app-connector-17.preview.emergentagent.com';
    }
    // If on localhost, use preview backend
    if (hostname === 'localhost') {
      return 'https://app-connector-17.preview.emergentagent.com';
    }
    // For production domain bauki.eu, use https://bauki.eu
    return `https://${hostname}`;
  }
  return process.env.REACT_APP_BACKEND_URL || 'https://bauki.eu';
};

const BACKEND_URL = getBackendUrl();
const API = `${BACKEND_URL}/api`;

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  // Set up axios interceptor for auth header
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const response = await axios.get(`${API}/auth/me`);
          setUser(response.data);
        } catch (error) {
          // Token invalid, clear it
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };
    checkAuth();
  }, [token]);

  const login = useCallback(async (email, password) => {
    const response = await axios.post(`${API}/auth/login`, { email, password });
    const { access_token, user: userData } = response.data;
    localStorage.setItem('token', access_token);
    setToken(access_token);
    setUser(userData);
    return userData;
  }, []);

  const register = useCallback(async (email, password, name) => {
    const response = await axios.post(`${API}/auth/register`, { email, password, name });
    const { access_token, user: userData } = response.data;
    localStorage.setItem('token', access_token);
    setToken(access_token);
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }, []);

  const updateBundesland = useCallback(async (bundesland) => {
    if (!token) return;
    try {
      await axios.patch(`${API}/auth/bundesland`, { bundesland });
      setUser(prev => ({ ...prev, bundesland }));
    } catch (error) {
      console.error('Failed to update bundesland:', error);
    }
  }, [token]);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    await axios.post(`${API}/auth/change-password`, { 
      current_password: currentPassword, 
      new_password: newPassword 
    });
  }, []);

  const deleteAccount = useCallback(async () => {
    await axios.delete(`${API}/auth/me`);
    logout();
  }, [logout]);

  const value = {
    user,
    token,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    updateBundesland,
    changePassword,
    deleteAccount
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
