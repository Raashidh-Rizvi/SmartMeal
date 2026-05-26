import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function AdminRoute() {
  const { user, token, loading } = useContext(AuthContext);
<<<<<<< HEAD
=======
  const authToken = token ?? localStorage.getItem('token');
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1

  if (loading) {
    return <div>Loading Admin...</div>;
  }

<<<<<<< HEAD
  if (!token) {
=======
  if (!authToken) {
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
    return <Navigate to="/login" replace />;
  }

  if (user && user.role !== 'ADMIN') {
    return <Navigate to="/profile" replace />;
  }

  return <Outlet />;
}

export default AdminRoute;
