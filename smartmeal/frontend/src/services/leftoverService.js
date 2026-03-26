import api from '../api/axios';

export const leftoverService = {
  getAll: (includeUsed = false) =>
    api.get(`/api/leftovers?include_used=${includeUsed}`),
  getExpiringSoon: (days = 3) =>
    api.get(`/api/leftovers/expiring-soon?days=${days}`),
  getById: (id) =>
    api.get(`/api/leftovers/${id}`),
  create: (data) =>
    api.post('/api/leftovers/', data),
  update: (id, data) =>
    api.put(`/api/leftovers/${id}`, data),
  markUsed: (id) =>
    api.patch(`/api/leftovers/${id}/mark-used`),
  delete: (id) =>
    api.delete(`/api/leftovers/${id}`),
};
