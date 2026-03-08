/**
 * ShoppingTable Component
 * Displays the shopping list in a table with inline editing,
 * mark-as-bought, and delete functionality
 */

function ShoppingTable({ items, loading, onMarkBought, onUpdateItem, onDeleteItem }) {
  const { useState } = React;

  // Helper to get item ID (supports both 'id' and '_id' field names)
  const getItemId = (item) => item.id || item._id || null;

  const startEdit = (item) => {
    const itemId = getItemId(item);
    if (!itemId) return;
    // Call parent's onUpdateItem to navigate to edit view
    onUpdateItem(itemId, {});
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <section className="card table-card">
      <div className="card-header">
        <h2>📝 Your Shopping List</h2>
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
                      <td><strong>{item.item_name}</strong></td>
                      <td>{item.quantity}</td>
                      <td>{item.unit}</td>
                      <td><span className="source-badge">{item.source}</span></td>
                      <td>
                        <span className={`status-badge ${item.status === 'Pending' ? 'status-pending' : 'status-bought'}`}>
                          {item.status}
                        </span>
                      </td>
                      <td>{formatDate(item.created_at)}</td>
                      <td>
                        <div className="action-buttons-cell">
                          <button 
                            className="btn-small btn-edit" 
                            onClick={() => startEdit(item)} 
                            title="Edit"
                          >
                            ✏️
                          </button>
                          {item.status === 'Pending' && (
                            <button 
                              className="btn-small btn-mark-bought" 
                              onClick={() => onMarkBought(getItemId(item))} 
                              title="Mark as Bought"
                            >
                              ✓
                            </button>
                          )}
                          <button 
                            className="btn-small btn-delete" 
                            onClick={() => onDeleteItem(getItemId(item))} 
                            title="Delete"
                          >
                            🗑
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
