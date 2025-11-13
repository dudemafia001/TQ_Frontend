"use client";
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export { AuthContext };

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [fullName, setFullName] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Check if user is logged in on mount
    if (isClient) {
      const storedUser = localStorage.getItem('username');
      const storedFullName = localStorage.getItem('userFullName');
      if (storedUser) {
        setUser(storedUser);
        setFullName(storedFullName);
      }
    }
    setLoading(false);
  }, [isClient]);

  const login = (username, userFullName) => {
    localStorage.setItem('username', username);
    if (userFullName) {
      localStorage.setItem('userFullName', userFullName);
    }
    setUser(username);
    setFullName(userFullName);
  };

  const logout = () => {
    localStorage.removeItem('username');
    localStorage.removeItem('userFullName');
    setUser(null);
    setFullName(null);
  };

  const value = {
    user,
    fullName,
    login,
    logout,
    loading,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
