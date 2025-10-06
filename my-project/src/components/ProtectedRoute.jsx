// src/components/ProtectedRoute.jsx

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = () => {
  const { auth, loading } = useAuth();

  // 1. While the auth state is being determined, show a loading indicator.
  //    This prevents a flash of the login page for already-logged-in users.
  if (loading) {
    return <div>Loading authentication status...</div>; // Or a spinner component
  }

  // 2. If loading is finished and there's no authenticated user, redirect to login.
  //    The 'replace' prop prevents the user from navigating back to the protected page.
  if (!auth) {
    return <Navigate to="/login" replace />;
  }

  // 3. If loading is finished and the user is authenticated, render the child route.
  //    <Outlet /> is a placeholder for the nested route component (e.g., HomePage, InventoryDashboard).
  return <Outlet />;
};

export default ProtectedRoute;