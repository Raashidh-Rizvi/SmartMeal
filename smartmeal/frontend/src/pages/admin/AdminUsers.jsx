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
  User
} from 'lucide-react';

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  const fetchUsers = useCallback(async () => {
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
    } finally {
      setLoading(false);
    }
  }, [page, roleFilter, search, limit]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

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
      <header className="admin-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Users size={32} color="var(--primary)" />
          <h1>Users Management</h1>
        </div>
        <p className="subtitle">Manage system users, roles, and account status</p>
      </header>

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
        </form>
        
        <select 
          value={roleFilter} 
          onChange={(e) => setRoleFilter(e.target.value)}
          className="admin-input"
          style={{ width: 'auto', minWidth: '150px' }}
        >
          <option value="">All Roles</option>
          <option value="USER">User Role</option>
          <option value="ADMIN">Admin Role</option>
        </select>
      </div>

      {loading ? (
        <div className="admin-loading"><div className="loader"></div><p>Loading users...</p></div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User Identity</th>
                <th>Access Level</th>
                <th>Status</th>
                <th>Joined Date</th>
                <th style={{ textAlign: 'right', minWidth: '120px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id}>
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
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No users found matching your criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          
          <div className="admin-pagination">
            <button 
              disabled={page === 1} 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="btn btn-secondary"
              style={{ width: 'auto' }}
            >
              <ChevronLeft size={18} /> Prev
            </button>
            <span style={{ fontWeight: 700, minWidth: '100px', textAlign: 'center' }}>
              {page} / {totalPages || 1}
            </span>
            <button 
              disabled={page >= totalPages} 
              onClick={() => setPage(p => p + 1)}
              className="btn btn-secondary"
              style={{ width: 'auto' }}
            >
              Next <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminUsers;
