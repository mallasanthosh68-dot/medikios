import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  api,
  getToken,
  setToken,
  removeToken,
  getUser,
  setUser,
  removeUser,
  getStoredProfile,
  setStoredProfile,
  removeStoredProfile,
} from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUserState] = useState(getUser());
  const [profile, setProfileState] = useState(getStoredProfile());
  const [language, setLanguageState] = useState(() => {
    return (typeof window !== 'undefined' && localStorage.getItem('medikiosk_language')) || 'en';
  });
  const [loading, setLoading] = useState(false);
  const [authModal, setAuthModal] = useState({ open: false, mode: 'login', role: 'patient' });

  const setLanguage = (newLang) => {
    setLanguageState(newLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('medikiosk_language', newLang);
    }
  };

  // Sync language with LanguageContext events
  useEffect(() => {
    const handleLangChange = (e) => {
      if (e.detail) {
        setLanguageState(e.detail);
      }
    };
    const handleStorage = (e) => {
      if (e.key === 'medikiosk_language' && e.newValue) {
        setLanguageState(e.newValue);
      }
    };
    window.addEventListener('medikiosk_language_change', handleLangChange);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('medikiosk_language_change', handleLangChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Sync profile on mount if token exists
  useEffect(() => {
    const token = getToken();
    if (token) {
      api.get('/auth/me')
        .then((res) => {
          if (res.success) {
            setUserState(res.user);
            setUser(res.user);
            setProfileState(res.profile);
            setStoredProfile(res.profile);
            if (res.profile?.preferredLanguage) {
              setLanguage(res.profile.preferredLanguage);
            }
          }
        })
        .catch(() => {
          // Token invalid or expired
          logout();
        });
    }
  }, []);

  const login = async ({ phoneNumber, password, role }) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { phoneNumber, password, role });
      if (res.success) {
        const userRole = res.user?.role || role;
        setToken(res.token, userRole);
        setUserState(res.user);
        setUser(res.user);
        setProfileState(res.profile);
        setStoredProfile(res.profile);
        setAuthModal({ open: false, mode: 'login', role: userRole });
        return { success: true, user: res.user };
      }
    } finally {
      setLoading(false);
    }
  };

  const registerPatient = async (data) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/register/patient', {
        ...data,
        preferredLanguage: language,
      });
      if (res.success) {
        setToken(res.token, 'patient');
        setUserState(res.user);
        setUser(res.user);
        setProfileState(res.profile);
        setStoredProfile(res.profile);
        setAuthModal({ open: false, mode: 'login', role: 'patient' });
        return { success: true, user: res.user };
      }
    } finally {
      setLoading(false);
    }
  };

  const registerDoctor = async (data) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/register/doctor', data);
      if (res.success) {
        setToken(res.token, 'doctor');
        setUserState(res.user);
        setUser(res.user);
        setProfileState(res.profile);
        setStoredProfile(res.profile);
        setAuthModal({ open: false, mode: 'login', role: 'doctor' });
        return { success: true, user: res.user };
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    removeToken();
    removeUser();
    removeStoredProfile();
    setUserState(null);
    setProfileState(null);
  };

  const refreshProfile = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.success) {
        setProfileState(res.profile);
        setStoredProfile(res.profile);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role: user?.role || null,
        isAuthenticated: Boolean(user && getToken()),
        language,
        setLanguage,
        loading,
        login,
        registerPatient,
        registerDoctor,
        logout,
        refreshProfile,
        authModal,
        setAuthModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
