import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Bell 
} from 'lucide-react';

function AdminLayout() {
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <h2>Admin Panel</h2>
        </div>
        <nav className="admin-nav">
          <NavLink to="/admin" end className={({isActive}) => isActive ? "active" : ""} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <LayoutDashboard size={18} /> Dashboard
          </NavLink>
          <NavLink to="/admin/users" className={({isActive}) => isActive ? "active" : ""} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Users size={18} /> Users
          </NavLink>

          <NavLink to="/admin/notifications" className={({isActive}) => isActive ? "active" : ""} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Bell size={18} /> Notifications
          </NavLink>
        </nav>
      </aside>
      <div className="admin-content">
        <Outlet />
      </div>
    </div>
  );
}

export default AdminLayout;
