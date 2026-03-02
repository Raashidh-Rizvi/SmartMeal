import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import Login from './pages/authentication/Login';
import Register from './pages/authentication/Register';
import Dashboard from './pages/users/Dashboard';
import Profile from './pages/users/Profile';
import ChangePassword from './pages/users/ChangePassword';
import DeleteAccount from './pages/users/DeleteAccount';

// Main App Components
import Inventory from './pages/Inventory';
import Recommendations from './pages/Recommendations';
import MealPlan from './pages/MealPlan';
import ShoppingList from './pages/ShoppingList';

// Admin Components
import AdminRoute from './components/AdminRoute';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminUserEdit from './pages/admin/AdminUserEdit';
import AdminInventory from './pages/admin/AdminInventory';
import AdminNotifications from './pages/admin/AdminNotifications';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <div className="app-container">
            <Navbar />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Protected Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/change-password" element={<ChangePassword />} />
                  <Route path="/delete-account" element={<DeleteAccount />} />
                  
                  <Route path="/inventory" element={<Inventory />} />
                  <Route path="/recommendations" element={<Recommendations />} />
                  <Route path="/mealplan" element={<MealPlan />} />
                  <Route path="/shoppinglist" element={<ShoppingList />} />
                </Route>

                {/* Admin Routes */}
                <Route path="/admin" element={<AdminRoute />}>
                  <Route element={<AdminLayout />}>
                    <Route index element={<AdminDashboard />} />
                    <Route path="users" element={<AdminUsers />} />
                    <Route path="users/:id" element={<AdminUserEdit />} />
                    <Route path="inventory" element={<AdminInventory />} />
                    <Route path="notifications" element={<AdminNotifications />} />
                  </Route>
                </Route>
    
                {/* Fallback route */}
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
