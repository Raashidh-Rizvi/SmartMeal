<<<<<<< HEAD
import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

function AdminLayout() {
=======
import React, { useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Bell,
  ClipboardList
} from 'lucide-react';
import './AdminLayout.css';

function AdminLayout() {
  useEffect(() => {
    // Add class to adjust layout when in admin area
    document.body.classList.add('admin-mode');
    return () => {
      document.body.classList.remove('admin-mode');
    };
  }, []);

>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-logo">
<<<<<<< HEAD
          <h2>Admin Panel</h2>
        </div>
        <nav className="admin-nav">
          <NavLink to="/admin" end className={({isActive}) => isActive ? "active" : ""}>Dashboard</NavLink>
          <NavLink to="/admin/users" className={({isActive}) => isActive ? "active" : ""}>Users</NavLink>
          <NavLink to="/admin/inventory" className={({isActive}) => isActive ? "active" : ""}>Inventory</NavLink>
          <NavLink to="/admin/ingredients" className={({isActive}) => isActive ? "active" : ""}>Ingredients</NavLink>
          <NavLink to="/admin/notifications" className={({isActive}) => isActive ? "active" : ""}>Notifications</NavLink>
        </nav>
      </aside>
      <div className="admin-content">
        <Outlet />
      </div>
=======
          <h2>SmartAdmin</h2>
        </div>
        <nav className="admin-nav">
          <NavLink to="/admin" end className={({isActive}) => isActive ? "active" : ""}>
            <LayoutDashboard size={22} /> <span>Dashboard</span>
          </NavLink>
          <NavLink to="/admin/users" className={({isActive}) => isActive ? "active" : ""}>
            <Users size={22} /> <span>Users</span>
          </NavLink>
          <NavLink to="/admin/inventory" className={({isActive}) => isActive ? "active" : ""}>
            <ClipboardList size={22} /> <span>Inventory</span>
          </NavLink>
          <NavLink to="/admin/notifications" className={({isActive}) => isActive ? "active" : ""}>
            <Bell size={22} /> <span>Notifications</span>
          </NavLink>
        </nav>
      </aside>
      <main className="admin-content">
        <Outlet />
      </main>
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
    </div>
  );
}

export default AdminLayout;
