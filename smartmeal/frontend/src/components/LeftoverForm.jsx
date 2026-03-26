import React, { useState } from 'react';
import { leftoverService } from '../services/leftoverService';
import { notify } from '../utils/notifications';
import { getFoodImage } from '../services/imageService';

const LeftoverForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '', quantity: '', category: '',
    cooked_date: '', expiry_date: '',
    storage_location: 'fridge', notes: ''
  });
  const [previewImage, setPreviewImage] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (name === 'name' && value.length > 2) setPreviewImage(getFoodImage(value));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await leftoverService.create({
        ...formData,
        cooked_date: new Date(formData.cooked_date).toISOString(),
        expiry_date: new Date(formData.expiry_date).toISOString(),
        image_url: getFoodImage(formData.name)
      });
      setFormData({ name: '', quantity: '', category: '', cooked_date: '', expiry_date: '', storage_location: 'fridge', notes: '' });
      setPreviewImage(null);
      notify.success('Leftover added successfully!');
      onSuccess();
    } catch (error) {
      notify.error(error.response?.data?.detail || 'Failed to add leftover');
    }
  };

  return (
    <div className="card">
      <h2 style={{ color: '#4caf50', marginBottom: '24px', fontSize: '1.8rem' }}>🍽️ Add Leftover</h2>
      {previewImage && (
        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
          <img src={previewImage} alt={formData.name}
            style={{ width: '100%', maxWidth: '300px', height: '200px', objectFit: 'cover', borderRadius: '12px' }}
            onError={(e) => e.target.style.display = 'none'} />
        </div>
      )}
      <form onSubmit={handleSubmit}>
        {[
          { label: 'Food Name *', name: 'name', type: 'text', placeholder: 'e.g., Chicken Curry' },
          { label: 'Quantity *', name: 'quantity', type: 'text', placeholder: 'e.g., 2 servings' },
          { label: 'Category *', name: 'category', type: 'text', placeholder: 'e.g., Main Course' },
          { label: 'Cooked Date *', name: 'cooked_date', type: 'datetime-local' },
          { label: 'Expiry Date *', name: 'expiry_date', type: 'datetime-local' },
        ].map(({ label, name, type, placeholder }) => (
          <div className="form-group" key={name}>
            <label>{label}</label>
            <input type={type} name={name} value={formData[name]} onChange={handleChange} placeholder={placeholder} required />
          </div>
        ))}
        <div className="form-group">
          <label>Storage Location *</label>
          <select name="storage_location" value={formData.storage_location} onChange={handleChange} required>
            <option value="fridge">🧊 Fridge</option>
            <option value="freezer">❄️ Freezer</option>
            <option value="room">🏠 Room</option>
          </select>
        </div>
        <div className="form-group">
          <label>Notes</label>
          <textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="Additional notes..." />
        </div>
        <button type="submit" className="btn btn-primary">➕ Add Leftover</button>
      </form>
    </div>
  );
};

export default LeftoverForm;
