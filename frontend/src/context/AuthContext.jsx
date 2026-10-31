import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('studybuddy_token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const profile = await authApi.getMe();
          setUser(profile);
        } catch (err) {
          console.error('Failed to authenticate token:', err);
          localStorage.removeItem('studybuddy_token');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    }
    loadUser();
  }, [token]);

  const login = async (email, password) => {
    const data = await authApi.login({ email, password });
    localStorage.setItem('studybuddy_token', data.access_token);
    setToken(data.access_token);
    const profile = await authApi.getMe();
    setUser(profile);
    return profile;
  };

  const register = async (email, password, full_name) => {
    const data = await authApi.register({ email, password, full_name });
    localStorage.setItem('studybuddy_token', data.access_token);
    setToken(data.access_token);
    const profile = await authApi.getMe();
    setUser(profile);
    return profile;
  };

  const logout = () => {
    localStorage.removeItem('studybuddy_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

