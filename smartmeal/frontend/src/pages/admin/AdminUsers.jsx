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
  UserPlus,
  Shield,
  User,
  Calendar
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
      alert('Error fetching users');
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
      <header className="admin-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Users size={32} color="var(--primary)" />
        <h1 style={{ margin: 0 }}>Users Management</h1>
      </header>

      <div className="admin-filters">
        <form onSubmit={handleSearch} className="search-form">
          <input 
            type="text" 
            placeholder="Search name/email..." 
            value={search}
            onChange={(e) => setSearch(e.target.value.toLowerCase())}
            className="admin-input"
          />
          <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Search size={16} /> Search
          </button>
        </form>
        
        <select 
          value={roleFilter} 
          onChange={(e) => setRoleFilter(e.target.value)}
          className="admin-input"
        >
          <option value="">All Roles</option>
          <option value="USER">USER</option>
          <option value="ADMIN">ADMIN</option>
        </select>
      </div>

      {loading ? (
        <p>Loading users...</p>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`badge ${u.role === 'ADMIN' ? 'badge-admin' : 'badge-user'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                      {u.role === 'ADMIN' ? <Shield size={12} /> : <User size={12} />} {u.role}
                    </span>
                  </td>
                  <td>
                    {u.createdAt ? (
                      new Date(u.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })
                    ) : (
                      <span className="text-muted">N/A</span>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <Link to={`/admin/users/${u._id}`} className="btn-icon text-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Pencil size={14} /> Edit
                      </Link>
                      <button onClick={() => handleDelete(u._id)} className="btn-icon text-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center">No users found</td>
                </tr>
              )}
            </tbody>
          </table>
          
          <div className="admin-pagination" style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'center' }}>
            <button 
              disabled={page === 1} 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <ChevronLeft size={16} /> Previous
            </button>
            <span style={{ fontWeight: 500 }}>Page {page} of {totalPages || 1}</span>
            <button 
              disabled={page >= totalPages} 
              onClick={() => setPage(p => p + 1)}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminUsers;
