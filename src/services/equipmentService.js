import api from './api';
export const equipmentService = {
  getAll: (params) => api.get('/equipment', { params }),
  getFeatured: () => api.get('/equipment/featured'),
  getById: (id) => api.get(`/equipment/${id}`),
  getAvailability: (params) => api.get('/equipment/availability', { params }),
  create: (data) => api.post('/equipment', data),
  update: (id, data) => api.put(`/equipment/${id}`, data),
  delete: (id) => api.delete(`/equipment/${id}`),
  getTimeSlots: (id) => api.get(`/equipment/${id}/time-slots`),
  createTimeSlot: (id, data) => api.post(`/equipment/${id}/time-slots`, data),
  updateTimeSlot: (id, slotId, data) => api.put(`/equipment/${id}/time-slots/${slotId}`, data),
  deleteTimeSlot: (id, slotId) => api.delete(`/equipment/${id}/time-slots/${slotId}`),
};