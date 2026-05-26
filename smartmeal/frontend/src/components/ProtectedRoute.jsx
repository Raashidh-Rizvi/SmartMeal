import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function ProtectedRoute() {
  const { token, loading } = useContext(AuthContext);
<<<<<<< HEAD
=======
  // Context can lag one frame after login; localStorage is updated synchronously in login()
  const authToken = token ?? localStorage.getItem('token');
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1

  if (loading) {
    return <div>Loading...</div>;
  }

<<<<<<< HEAD
  if (!token) {
=======
  if (!authToken) {
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
