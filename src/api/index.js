import axios from 'axios'
const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'
const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})
// Request interceptor — attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)
// Response interceptor — handle 401, refresh token
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (!refreshToken) throw new Error('No refresh token')
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken })
        const newToken = data.data.accessToken
        localStorage.setItem('accessToken', newToken)
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      } catch {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
        return Promise.reject(error)
      }
    }
    return Promise.reject(error)
  }
)
export default api
// ─── Auth ──────────────────────────────────────────────
export const authAPI = {
  register:       (data) => api.post('/auth/register', data),
  login:          (data) => api.post('/auth/login', data),
  logout:         ()     => api.post('/auth/logout'),
  refresh:        (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword:  (data) => api.post('/auth/reset-password', data),
  verifyId:       (data) => api.post('/auth/verify-id', data),
  me:             ()     => api.get('/auth/me'),
}
// ─── Users ─────────────────────────────────────────────
export const usersAPI = {
  list:         (params) => api.get('/users', { params }),
  me:           ()       => api.get('/users/me'),
  updateMe:     (data)   => api.put('/users/me', data),
  updateSettings:(data)  => api.put('/users/me/settings', data),
  owners:       (params) => api.get('/users/owners', { params }),
  customers:    (params) => api.get('/users/customers', { params }),
  getById:      (id)     => api.get(`/users/${id}`),
  update:       (id,data)=> api.put(`/users/${id}`, data),
  suspend:      (id)     => api.patch(`/users/${id}/suspend`),
  activate:     (id)     => api.patch(`/users/${id}/activate`),
  delete:       (id)     => api.delete(`/users/${id}`),
}
// ─── Equipment ─────────────────────────────────────────
export const equipmentAPI = {
  list:         (params) => api.get('/equipment', { params }),
  featured:     ()       => api.get('/equipment/featured'),
  availability: (params) => api.get('/equipment/availability', { params }),
  getById:      (id)     => api.get(`/equipment/${id}`),
  create:       (data)   => api.post('/equipment', data),
  update:       (id,data)=> api.put(`/equipment/${id}`, data),
  delete:       (id)     => api.delete(`/equipment/${id}`),
  getTimeSlots: (id)     => api.get(`/equipment/${id}/time-slots`),
  createSlot:   (id,data)=> api.post(`/equipment/${id}/time-slots`, data),
  updateSlot:   (id,slotId,data)=> api.put(`/equipment/${id}/time-slots/${slotId}`, data),
  deleteSlot:   (id,slotId)    => api.delete(`/equipment/${id}/time-slots/${slotId}`),
}
// ─── Categories ────────────────────────────────────────
export const categoriesAPI = {
  list:   (params) => api.get('/categories', { params }),
  getById:(id)     => api.get(`/categories/${id}`),
  create: (data)   => api.post('/categories', data),
  update: (id,data)=> api.put(`/categories/${id}`, data),
  delete: (id)     => api.delete(`/categories/${id}`),
}
// ─── Submissions ───────────────────────────────────────
export const submissionsAPI = {
  list:    (params) => api.get('/submissions', { params }),
  mine:    ()       => api.get('/submissions/mine'),
  getById: (id)     => api.get(`/submissions/${id}`),
  create:  (data)   => api.post('/submissions', data),
  update:  (id,data)=> api.put(`/submissions/${id}`, data),
  approve: (id,data)=> api.patch(`/submissions/${id}/approve`, data),
  reject:  (id,data)=> api.patch(`/submissions/${id}/reject`, data),
  delete:  (id)     => api.delete(`/submissions/${id}`),
}
// ─── Bookings ──────────────────────────────────────────
export const bookingsAPI = {
  list:     (params) => api.get('/bookings', { params }),
  myBookings:()      => api.get('/bookings/my'),
  ownerBookings:()   => api.get('/bookings/owner'),
  getById:  (id)     => api.get(`/bookings/${id}`),
  create:   (data)   => api.post('/bookings', data),
  confirm:  (id)     => api.patch(`/bookings/${id}/confirm`),
  cancel:   (id,data)=> api.patch(`/bookings/${id}/cancel`, data),
  complete: (id)     => api.patch(`/bookings/${id}/complete`),
}
// ─── Notifications ─────────────────────────────────────
export const notificationsAPI = {
  list:     ()   => api.get('/notifications'),
  readAll:  ()   => api.patch('/notifications/read-all'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  delete:   (id) => api.delete(`/notifications/${id}`),
}
// ─── Uploads ───────────────────────────────────────────
export const uploadAPI = {
  image:    (file)  => {
    const fd = new FormData(); fd.append('image', file)
    return api.post('/upload/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  document: (file)  => {
    const fd = new FormData(); fd.append('document', file)
    return api.post('/upload/document', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  multiple: (files, type='image') => {
    const fd = new FormData()
    files.forEach(f => fd.append('file', f))
    return api.post(`/upload/multiple?type=${type}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
}
// ─── Reviews ───────────────────────────────────────────
export const reviewsAPI = {
  list:   (params) => api.get('/reviews', { params }),
  mine:   ()       => api.get('/reviews/mine'),
  create: (data)   => api.post('/reviews', data),
  delete: (id)     => api.delete(`/reviews/${id}`),
}
// ─── Reports ───────────────────────────────────────────
export const reportsAPI = {
  overview:   ()       => api.get('/reports/overview'),
  revenue:    (params) => api.get('/reports/revenue', { params }),
  bookings:   (params) => api.get('/reports/bookings', { params }),
  categories: ()       => api.get('/reports/categories'),
}
// ─── Owner Analytics ───────────────────────────────────
export const ownerAnalyticsAPI = {
  overview:  ()       => api.get('/owner/analytics/overview'),
  revenue:   (params) => api.get('/owner/analytics/revenue', { params }),
  equipment: ()       => api.get('/owner/analytics/equipment'),
  calendar:  (params) => api.get('/owner/analytics/calendar', { params }),
}
// ─── Settings ──────────────────────────────────────────
export const settingsAPI = {
  public: ()       => api.get('/settings/public'),
  all:    ()       => api.get('/settings'),
  update: (data)   => api.put('/settings', data),
}
// ─── Admin ─────────────────────────────────────────────
export const adminAPI = {
  contact:       (data) => api.post('/admin/contact', data),
  listAdmins:    ()     => api.get('/admin/admins'),
  createAdmin:   (data) => api.post('/admin/admins', data),
  deleteAdmin:   (id)   => api.delete(`/admin/admins/${id}`),
}