import React from 'react';
import { ClipboardList, Pencil, Check, Trash2 } from 'lucide-react';

function ShoppingTable({ items, loading, onMarkBought, onUpdateItem, onDeleteItem }) {
  const getItemId = (item) => item.id || item._id || null;

  const startEdit = (item) => {
    const itemId = getItemId(item);
    if (!itemId) return;
    onUpdateItem(itemId, {});
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  };

  return (
    <section className="card table-card">
      <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <ClipboardList size={22} color="var(--primary)" />
        <h2 style={{ margin: 0 }}>Your Shopping List</h2>
      </div>
      <div className="card-body">
        {loading ? (
          <div className="loading-container">
            <div className="loading"></div>
            <p>Loading items...</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Quantity</th>
                  <th>Unit</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="empty-message">
                      No items in your shopping list. Add some items above!
                    </td>
                  </tr>
                ) : (
                  items.map(item => (
                    <tr key={getItemId(item)}>
                      <td><strong>{item.name || item.item_name}</strong></td>
                      <td>{item.quantity}</td>
                      <td>{item.unit || '-'}</td>
                      <td><span className="source-badge">{item.source || item.category || 'manual'}</span></td>
                      <td>
                        <span className={`status-badge ${(item.status || '').toLowerCase() === 'pending' ? 'status-pending' : 'status-bought'}`}>
                          {item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : 'Pending'}
                        </span>
                      </td>
                      <td>{formatDate(item.created_at)}</td>
                      <td>
                        <div className="action-buttons-cell">
                          <button className="btn-small btn-edit" onClick={() => startEdit(item)} title="Edit">
                            <Pencil size={14} />
                          </button>
                          {(item.status || '').toLowerCase() === 'pending' && (
                            <button className="btn-small btn-mark-bought" onClick={() => onMarkBought(getItemId(item))} title="Mark as Bought">
                              <Check size={14} />
                            </button>
                          )}
                          <button className="btn-small btn-delete" onClick={() => onDeleteItem(getItemId(item))} title="Delete">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

export default ShoppingTable;
