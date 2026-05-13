import api from './api';
export const categoryService = {
  getAll: (params) => api.get('/categories', { params }),
  getById: (id) => api.get(`/categories/${id}`),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};
export const submissionService = {
  getAll: (params) => api.get('/submissions', { params }),
  getMine: () => api.get('/submissions/mine'),
  getById: (id) => api.get(`/submissions/${id}`),
  create: (data) => api.post('/submissions', data),
  update: (id, data) => api.put(`/submissions/${id}`, data),
  approve: (id, note) => api.patch(`/submissions/${id}/approve`, { note }),
  reject: (id, reason) => api.patch(`/submissions/${id}/reject`, { reason }),
  delete: (id) => api.delete(`/submissions/${id}`),
};
export const bookingService = {
  getAll: (params) => api.get('/bookings', { params }),
  getMy: () => api.get('/bookings/my'),
  getOwner: () => api.get('/bookings/owner'),
  getById: (id) => api.get(`/bookings/${id}`),
  create: (data) => api.post('/bookings', data),
  confirm: (id) => api.patch(`/bookings/${id}/confirm`),
  cancel: (id, reason) => api.patch(`/bookings/${id}/cancel`, { cancellation_reason: reason }),
  complete: (id) => api.patch(`/bookings/${id}/complete`),
};
export const notificationService = {
  getAll: () => api.get('/notifications'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
};
// ✅ UPDATED uploadService with correct field names
export const uploadService = {
  // Single image upload
  image: (file) => {
    const fd = new FormData();
    fd.append('image', file); // Backend expects 'image'
    return api.post('/upload/image', fd, { 
      headers: { 'Content-Type': 'multipart/form-data' } 
    });
  },
  // Single document upload
  document: (file) => {
    const fd = new FormData();
    fd.append('document', file); // Backend expects 'document'
    return api.post('/upload/document', fd, { 
      headers: { 'Content-Type': 'multipart/form-data' } 
    });
  },
  // Multiple files upload (CRITICAL FIX: use 'files' not 'file')
  multiple: (files, type = 'image') => {
    const fd = new FormData();
    // ✅ IMPORTANT: Use 'files' (plural) - this matches your backend's multer configuration
    files.forEach((f) => fd.append('files', f)); // Changed from 'file' to 'files'
    return api.post(`/upload/multiple?type=${type}`, fd, { 
      headers: { 'Content-Type': 'multipart/form-data' } 
    });
  },
};
export const reviewService = {
  getAll: (params) => api.get('/reviews', { params }),
  getMine: () => api.get('/reviews/mine'),
  create: (data) => api.post('/reviews', data),
  delete: (id) => api.delete(`/reviews/${id}`),
};
export const reportService = {
  overview: () => api.get('/reports/overview'),
  revenue: (months = 6) => api.get('/reports/revenue', { params: { months } }),
  bookings: (months = 6) => api.get('/reports/bookings', { params: { months } }),
  categories: () => api.get('/reports/categories'),
};
export const ownerAnalyticsService = {
  overview: () => api.get('/owner/analytics/overview'),
  revenue: (months = 6) => api.get('/owner/analytics/revenue', { params: { months } }),
  equipment: () => api.get('/owner/analytics/equipment'),
  calendar: (month, year) => api.get('/owner/analytics/calendar', { params: { month, year } }),
};
export const settingsService = {
  getPublic: () => api.get('/settings/public'),
  getAll: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
};
export const userService = {
  getAll: (params) => api.get('/users', { params }),
  getMe: () => api.get('/users/me'),
  updateMe: (data) => api.put('/users/me', data),
  getSettings: () => api.get('/users/me/settings'),  // 🆕 Get user settings
  updateSettings: (data) => api.put('/users/me/settings', data),  // ✅ Update user settings
  getOwners: () => api.get('/users/owners'),
  getCustomers: () => api.get('/users/customers'),
  getById: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  suspend: (id) => api.patch(`/users/${id}/suspend`),
  activate: (id) => api.patch(`/users/${id}/activate`),
  delete: (id) => api.delete(`/users/${id}`),
};
export const adminService = {
  contact: (data) => api.post('/admin/contact', data),
  getAdmins: () => api.get('/admin/admins'),
  createAdmin: (data) => api.post('/admin/admins', data),
  deleteAdmin: (id) => api.delete(`/admin/admins/${id}`),
};
export const ownerEquipmentService = {
  create:   (data)       => api.post('/owner-equipment', data).then(r => r.data),
  getMine:  (p)          => api.get('/owner-equipment/mine', { params: p }).then(r => r.data),
  getById:  (id)         => api.get(`/owner-equipment/${id}`).then(r => r.data),
  update:   (id, data)   => api.put(`/owner-equipment/${id}`, data).then(r => r.data),
  delete:   (id)         => api.delete(`/owner-equipment/${id}`).then(r => r.data),
  getAll:   (p)          => api.get('/owner-equipment', { params: p }).then(r => r.data),
  approve:  (id, data)   => api.patch(`/owner-equipment/${id}/approve`, data).then(r => r.data),
  reject:   (id, rejection_reason, review_note) => 
    api.patch(`/owner-equipment/${id}/reject`, { rejection_reason, review_note }).then(r => r.data),
};
export const timeSlotService = {
  // Equipment specific - NOTE: Must end with /time-slots
  getByEquipment: (equipmentId, includeInactive = false) => 
    api.get(`/admin/time-slots/equipment/${equipmentId}/time-slots`, {
      params: { include_inactive: includeInactive } 
    }).then(r => r.data),
  create: (equipmentId, data) => 
    api.post(`/admin/time-slots/equipment/${equipmentId}/time-slots`, data).then(r => r.data),
  update: (equipmentId, slotId, data) => 
    api.put(`/admin/time-slots/equipment/${equipmentId}/time-slots/${slotId}`, data).then(r => r.data),
  delete: (equipmentId, slotId) => 
    api.delete(`/admin/time-slots/equipment/${equipmentId}/time-slots/${slotId}`).then(r => r.data),
  toggleStatus: (equipmentId, slotId) => 
    api.patch(`/admin/time-slots/equipment/${equipmentId}/time-slots/${slotId}/toggle`).then(r => r.data),
  // Global slots
  getGlobal: (includeInactive = false) => 
    api.get('/admin/time-slots/global-time-slots', { 
      params: { include_inactive: includeInactive } 
    }).then(r => r.data),
  createGlobal: (data) => 
    api.post('/admin/time-slots/global-time-slots', data).then(r => r.data),
  updateGlobal: (slotId, data) => 
    api.put(`/admin/time-slots/global-time-slots/${slotId}`, data).then(r => r.data),
  deleteGlobal: (slotId) => 
    api.delete(`/admin/time-slots/global-time-slots/${slotId}`).then(r => r.data),
};