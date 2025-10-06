// src/context/AuthContext.jsx

import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(null);
  const [loading, setLoading] = useState(true); // <-- This is crucial

  useEffect(() => {
    // This effect runs only once on app load
    try {
      const storedToken = localStorage.getItem('accessToken');
      const storedName = localStorage.getItem('userName');
      const storedRole = localStorage.getItem('userRole');
      const storedUserid = localStorage.getItem('userId');

      if (storedToken && storedName && storedRole) {
        setAuth({
          token: storedToken,
          userName: storedName,
          role: storedRole,
          userId: storedUserid,
        });
      }
    } catch (error) {
      console.error("Failed to parse auth from localStorage", error);
      setAuth(null);
    } finally {
      // We are done checking, so set loading to false
      setLoading(false);
    }
  }, []);

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    setAuth(null);
    // Note: The redirection to '/login' will be handled by the ProtectedRoute
  };

  // Provide the auth state, the setter, the logout function, and the loading state
  const value = { auth, setAuth, logout, loading };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);