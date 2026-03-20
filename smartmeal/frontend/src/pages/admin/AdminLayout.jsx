import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

function AdminLayout() {
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-logo">
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
    </div>
  );
}

export default AdminLayout;
