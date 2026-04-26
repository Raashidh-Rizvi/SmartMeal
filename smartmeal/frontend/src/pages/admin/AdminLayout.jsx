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

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-logo">
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
    </div>
  );
}

export default AdminLayout;
