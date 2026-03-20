import React, { useState } from 'react';
import { leftoverService } from '../services/leftoverService';
import { notify } from '../utils/notifications';
import { getFoodImage } from '../services/imageService';

const LeftoverForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
    category: '',
    cooked_date: '',
    expiry_date: '',
    storage_location: 'fridge',
    notes: ''
  });
  const [previewImage, setPreviewImage] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    if (name === 'name' && value.length > 2) {
      const imageUrl = getFoodImage(value);
      setPreviewImage(imageUrl);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        cooked_date: new Date(formData.cooked_date).toISOString(),
        expiry_date: new Date(formData.expiry_date).toISOString(),
        image_url: getFoodImage(formData.name)
      };
      await leftoverService.create(submitData);
      setFormData({
        name: '',
        quantity: '',
        category: '',
        cooked_date: '',
        expiry_date: '',
        storage_location: 'fridge',
        notes: ''
      });
      notify.success('Leftover added successfully!');
      setPreviewImage(null);
      onSuccess();
    } catch (error) {
      console.error('Error creating leftover:', error);
      notify.error(error.response?.data?.detail || 'Failed to add leftover');
    }
  };

  return (
    <div className="card">
      <h2 style={{ color: '#4caf50', marginBottom: '24px', fontSize: '1.8rem' }}>
        🍽️ Add Leftover
      </h2>
      
      {previewImage && (
        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
          <img 
            src={previewImage} 
            alt={formData.name}
            style={{ 
              width: '100%', 
              maxWidth: '300px', 
              height: '200px', 
              objectFit: 'cover', 
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
            onError={(e) => e.target.style.display = 'none'}
          />
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Food Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Chicken Curry"
            required
          />
        </div>

        <div className="form-group">
          <label>Quantity *</label>
          <input
            type="text"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            placeholder="e.g., 2 servings, 500g"
            required
          />
        </div>

        <div className="form-group">
          <label>Category *</label>
          <input
            type="text"
            name="category"
            value={formData.category}
            onChange={handleChange}
            placeholder="e.g., Main Course, Dessert"
            required
          />
        </div>

        <div className="form-group">
          <label>Cooked Date *</label>
          <input
            type="datetime-local"
            name="cooked_date"
            value={formData.cooked_date}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Expiry Date *</label>
          <input
            type="datetime-local"
            name="expiry_date"
            value={formData.expiry_date}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Storage Location *</label>
          <select
            name="storage_location"
            value={formData.storage_location}
            onChange={handleChange}
            required
          >
            <option value="fridge">🧊 Fridge</option>
            <option value="freezer">❄️ Freezer</option>
          </select>
        </div>

        <div className="form-group">
          <label>Notes</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Additional notes..."
          />
        </div>

        <button type="submit" className="btn btn-primary">
          ➕ Add Leftover
        </button>
      </form>
    </div>
  );
};

export default LeftoverForm;
