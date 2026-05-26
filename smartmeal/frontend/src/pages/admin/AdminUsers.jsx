<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
=======
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { 
  Users, 
  Search, 
  Pencil, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  Shield,
  User,
  ShieldCheck,
  Settings,
  Lock,
  UserCog
} from 'lucide-react';
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

<<<<<<< HEAD
  const fetchUsers = async () => {
=======
  const fetchUsers = useCallback(async () => {
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
    try {
      setLoading(true);
      let url = `/api/admin/users?page=${page}&limit=${limit}`;
      if (search) url += `&search=${search}`;
      if (roleFilter) url += `&role=${roleFilter}`;
      
      const res = await api.get(url);
      setUsers(res.data.items);
      setTotalPages(Math.ceil(res.data.total / limit));
    } catch (err) {
      console.error(err);
<<<<<<< HEAD
      alert('Error fetching users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter]); // Trigger when page or role changes. search is manual on submit
=======
    } finally {
      setLoading(false);
    }
  }, [page, roleFilter, search, limit]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleDelete = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await api.delete(`/api/admin/users/${userId}`);
        fetchUsers();
      } catch (err) {
        alert(err.response?.data?.detail || "Failed to delete");
      }
    }
  };

  return (
    <div className="admin-page">
<<<<<<< HEAD
      <header className="admin-header">
        <h1>Users Management</h1>
      </header>

      <div className="admin-filters">
        <form onSubmit={handleSearch} className="search-form">
          <input 
            type="text" 
            placeholder="Search name/email..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="admin-input"
          />
          <button type="submit" className="btn btn-primary">Search</button>
=======
      <div className="page-hero page-hero--sub">
        {/* Premium Decorative Background Icons */}
        <Users size={80} className="hero-sway" style={{ position: 'absolute', opacity: 0.07, color: '#10b981', pointerEvents: 'none', top: '10%', left: '6%', '--rotation': '-15deg', animationDelay: '0s' }} />
        <Shield size={70} className="hero-sway" style={{ position: 'absolute', opacity: 0.05, color: '#10b981', pointerEvents: 'none', top: '45%', left: '3%', '--rotation': '10deg', animationDelay: '1.2s' }} />
        <Lock size={58} className="hero-sway" style={{ position: 'absolute', opacity: 0.07, color: '#10b981', pointerEvents: 'none', bottom: '15%', left: '14%', '--rotation': '25deg', animationDelay: '2.5s' }} />
        <ShieldCheck size={76} className="hero-sway" style={{ position: 'absolute', opacity: 0.06, color: '#10b981', pointerEvents: 'none', top: '12%', right: '10%', '--rotation': '-20deg', animationDelay: '0.8s' }} />
        <Settings size={64} className="hero-sway" style={{ position: 'absolute', opacity: 0.07, color: '#10b981', pointerEvents: 'none', top: '55%', right: '5%', '--rotation': '18deg', animationDelay: '3.1s' }} />
        <User size={68} className="hero-sway" style={{ position: 'absolute', opacity: 0.05, color: '#10b981', pointerEvents: 'none', bottom: '12%', right: '16%', '--rotation': '-12deg', animationDelay: '1.5s' }} />
        <UserCog size={74} className="hero-sway" style={{ position: 'absolute', opacity: 0.07, color: '#10b981', pointerEvents: 'none', top: '32%', right: '26%', '--rotation': '30deg', animationDelay: '4.2s' }} />
        <Shield size={52} className="hero-sway" style={{ position: 'absolute', opacity: 0.06, color: '#10b981', pointerEvents: 'none', bottom: '38%', left: '28%', '--rotation': '-25deg', animationDelay: '0.4s' }} />

        <Users size={46} color="#10b981" style={{ position: 'relative', zIndex: 1 }} />
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <h1 style={{ margin: '0.25rem 0 0.1rem' }}>Users Management</h1>
          <p style={{ margin: 0, opacity: 0.75, fontSize: '1rem' }}>Manage system users, roles, and account status</p>
        </div>
      </div>

      <div className="admin-filters">
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', flex: 1 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search name or email..." 
              value={search}
              onChange={(e) => setSearch(e.target.value.toLowerCase())}
              className="admin-input"
              style={{ paddingLeft: '3rem', width: '100%' }}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: 'auto' }}>
            Search
          </button>
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
        </form>
        
        <select 
          value={roleFilter} 
          onChange={(e) => setRoleFilter(e.target.value)}
          className="admin-input"
<<<<<<< HEAD
        >
          <option value="">All Roles</option>
          <option value="USER">USER</option>
          <option value="ADMIN">ADMIN</option>
=======
          style={{ width: 'auto', minWidth: '150px' }}
        >
          <option value="">All Roles</option>
          <option value="USER">User Role</option>
          <option value="ADMIN">Admin Role</option>
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
        </select>
      </div>

      {loading ? (
<<<<<<< HEAD
        <p>Loading users...</p>
=======
        <div className="admin-loading"><div className="loader"></div><p>Loading users...</p></div>
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
<<<<<<< HEAD
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Created At</th>
                <th>Actions</th>
=======
                <th>User Identity</th>
                <th>Access Level</th>
                <th>Status</th>
                <th>Joined Date</th>
                <th style={{ textAlign: 'right', minWidth: '120px' }}>Actions</th>
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id}>
<<<<<<< HEAD
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`badge ${u.role === 'ADMIN' ? 'badge-admin' : 'badge-user'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="action-buttons">
                      <Link to={`/admin/users/${u._id}`} className="btn-icon text-primary">Edit</Link>
                      <button onClick={() => handleDelete(u._id)} className="btn-icon text-danger">Delete</button>
=======
                  <td>
                    <div className="user-identity">
                      <div className="user-avatar">
                        {u.name.charAt(0)}
                      </div>
                      <div className="user-info-stack">
                        <div className="user-name">{u.name}</div>
                        <div className="user-email">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${u.role === 'ADMIN' ? 'badge-admin' : 'badge-user'}`}>
                      {u.role === 'ADMIN' ? <Shield size={12} /> : <User size={12} />} {u.role}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${u.is_active !== false ? 'badge-active' : 'badge-inactive'}`}>
                      <span className="status-dot" style={{ 
                        width: '6px', 
                        height: '6px', 
                        borderRadius: '50%', 
                        background: u.is_active !== false ? '#10b981' : '#ef4444',
                        display: 'inline-block',
                        marginRight: '0.2rem'
                      }}></span>
                      {u.is_active !== false ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      {u.createdAt ? (
                        new Date(u.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })
                      ) : (
                        <span>N/A</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <Link to={`/admin/users/${u._id}`} className="btn-icon text-primary" title="Edit Profile">
                        <Pencil size={16} />
                      </Link>
                      <button onClick={() => handleDelete(u._id)} className="btn-icon text-danger" title="Revoke Access">
                        <Trash2 size={16} />
                      </button>
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
<<<<<<< HEAD
                  <td colSpan="5" className="text-center">No users found</td>
=======
                  <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No users found matching your criteria
                  </td>
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
                </tr>
              )}
            </tbody>
          </table>
          
          <div className="admin-pagination">
            <button 
              disabled={page === 1} 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="btn btn-secondary"
<<<<<<< HEAD
            >
              Previous
            </button>
            <span>Page {page} of {totalPages || 1}</span>
=======
              style={{ width: 'auto' }}
            >
              <ChevronLeft size={18} /> Prev
            </button>
            <span style={{ fontWeight: 700, minWidth: '100px', textAlign: 'center' }}>
              {page} / {totalPages || 1}
            </span>
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
            <button 
              disabled={page >= totalPages} 
              onClick={() => setPage(p => p + 1)}
              className="btn btn-secondary"
<<<<<<< HEAD
            >
              Next
=======
              style={{ width: 'auto' }}
            >
              Next <ChevronRight size={18} />
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminUsers;
