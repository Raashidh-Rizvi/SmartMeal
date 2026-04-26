import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function AdminRoute() {
  const { user, token, loading } = useContext(AuthContext);
  const authToken = token ?? localStorage.getItem('token');

  if (loading) {
    return <div>Loading Admin...</div>;
  }

  if (!authToken) {
    return <Navigate to="/login" replace />;
  }

  if (user && user.role !== 'ADMIN') {
    return <Navigate to="/profile" replace />;
  }

  return <Outlet />;
}

export default AdminRoute;
