import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi, meApi } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await authApi.getMe();
          setUser(res.data);
          if (!res.data.onboarding_completed) {
            setShowOnboarding(true);
          }
        } catch (err) {
          console.error('Session expired or invalid token');
          localStorage.removeItem('token');
          setUser(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await authApi.login(email, password);
    const { access_token, user: userData } = res.data;
    localStorage.setItem('token', access_token);
    setUser(userData);
    setShowAuthModal(false);
    if (!userData.onboarding_completed) {
      setShowOnboarding(true);
    }
    return userData;
  };

  const register = async (email, password, name, preferred_categories = []) => {
    const res = await authApi.register(email, password, name, preferred_categories);
    const { access_token, user: userData } = res.data;
    localStorage.setItem('token', access_token);
    setUser(userData);
    setShowAuthModal(false);
    if (preferred_categories.length === 0) {
      setShowOnboarding(true);
    }
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const updatePreferences = async (categories) => {
    try {
      const res = await meApi.updatePreferences(categories, true);
      setUser(res.data);
      setShowOnboarding(false);
      return res.data;
    } catch (err) {
      console.error('Failed to update preferences', err);
      throw err;
    }
  };

  const openLogin = () => {
    setAuthMode('login');
    setShowAuthModal(true);
  };

  const openRegister = () => {
    setAuthMode('register');
    setShowAuthModal(true);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updatePreferences,
        showAuthModal,
        setShowAuthModal,
        authMode,
        setAuthMode,
        openLogin,
        openRegister,
        showOnboarding,
        setShowOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
