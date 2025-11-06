"use client";
import { createContext, useContext, useState, useEffect } from 'react';
import { buildApiUrl } from '../../config';

const AdminContext = createContext();

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

export const AdminProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Check if admin is logged in on mount
    if (isClient) {
      const storedAdmin = localStorage.getItem('adminData');
      if (storedAdmin) {
        try {
          const adminData = JSON.parse(storedAdmin);
          setAdmin(adminData);
        } catch {
          localStorage.removeItem('adminData');
        }
      }
    }
    setLoading(false);
  }, [isClient]);

  const login = async (username, password) => {
    try {
      const response = await fetch(buildApiUrl('/api/admin/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setAdmin(data);
        if (isClient) {
          localStorage.setItem('adminData', JSON.stringify(data));
        }
        return { success: true, data };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Network error occurred' };
    }
  };

  const logout = () => {
    setAdmin(null);
    if (isClient) {
      localStorage.removeItem('adminData');
    }
  };

  const value = {
    admin,
    login,
    logout,
    loading,
    isAuthenticated: !!admin,
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};