import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function ProtectedRoute() {
  const { token, loading } = useContext(AuthContext);
  // Context can lag one frame after login; localStorage is updated synchronously in login()
  const authToken = token ?? localStorage.getItem('token');

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!authToken) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
