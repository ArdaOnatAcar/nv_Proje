import api from './api';

export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
  },
  getCurrentUser: () => {
    const user = sessionStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
  isAuthenticated: () => {
    return !!sessionStorage.getItem('token');
  }
};

export const businessService = {
  getAll: (params) => api.get('/businesses', { params }),
  getById: (id) => api.get(`/businesses/${id}`),
  create: (data) => api.post('/businesses', data),
  update: (id, data) => api.put(`/businesses/${id}`, data),
  delete: (id) => api.delete(`/businesses/${id}`),
  getMyBusinesses: () => api.get('/businesses/owner/my-businesses'),
  // Unified availability endpoint (service-aware, staff-aware)
  getAvailability: (businessId, params) => api.get(`/businesses/${businessId}/availability`, { params }),
  getSettings: (businessId) => api.get(`/businesses/${businessId}/settings`),
  updateSettings: (businessId, data) => api.put(`/businesses/${businessId}/settings`, data),
};

export const serviceService = {
  getByBusiness: (businessId) => api.get(`/services/business/${businessId}`),
  create: (data) => api.post('/services', data),
  update: (id, data) => api.put(`/services/${id}`, data),
  delete: (id) => api.delete(`/services/${id}`)
};

export const appointmentService = {
  getMyAppointments: () => api.get('/appointments/my-appointments'),
  create: (data) => api.post('/appointments', data),
  // Owner manual booking
  createOwner: (data) => api.post('/appointments', { ...data, source: 'owner_manual' }),
  updateStatus: (id, status) => api.put(`/appointments/${id}/status`, { status })
};

export const reviewService = {
  getByBusiness: (businessId) => api.get(`/reviews/business/${businessId}`),
  create: (data) => api.post('/reviews', data),
  update: (id, data) => api.put(`/reviews/${id}`, data),
  delete: (id) => api.delete(`/reviews/${id}`)
};

// Staff management endpoints
export const staffService = {
  listByBusiness: (businessId) => api.get(`/businesses/${businessId}/staff`),
  create: (businessId, data) => api.post(`/businesses/${businessId}/staff`, data),
  update: (staffId, data) => api.put(`/staff/${staffId}`, data),
  getServices: (staffId) => api.get(`/staff/${staffId}/services`),
  setServices: (staffId, service_ids) => api.post(`/staff/${staffId}/services`, { service_ids }),
};

export const locationService = {
  getAll: () => api.get('/locations')
};

// Favorites (bookmarks) service
export const favoritesService = {
  list: () => api.get('/favorites'), // detailed businesses
  listIds: () => api.get('/favorites/ids'),
  add: (businessId) => api.post(`/favorites/${businessId}`),
  remove: (businessId) => api.delete(`/favorites/${businessId}`)
};