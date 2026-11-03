// lib/api.js
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function getToken() {
  if (typeof window !== 'undefined') return localStorage.getItem('seo_token');
  return null;
}

async function apiFetch(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}/api${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({ success: false, message: 'Invalid JSON response' }));

  if (!res.ok) {
    const err = new Error(data.message || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const api = {
  // Auth
  login: (email, password) => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (data) => apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  logout: () => apiFetch('/auth/logout', { method: 'POST' }),
  me: () => apiFetch('/auth/me'),
  forgotPassword: (email) => apiFetch('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (token, newPassword) => apiFetch('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, newPassword }) }),

  // Admin Stats
  adminStats: () => apiFetch('/admin/stats'),

  // Clients
  getClients: (params = {}) => apiFetch(`/clients?${new URLSearchParams(params)}`),
  createClient: (data) => apiFetch('/clients', { method: 'POST', body: JSON.stringify(data) }),
  getClient: (id) => apiFetch(`/clients/${id}`),
  updateClient: (id, data) => apiFetch(`/clients/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteClient: (id) => apiFetch(`/clients/${id}`, { method: 'DELETE' }),

  // Websites
  getWebsites: (params = {}) => apiFetch(`/websites?${new URLSearchParams(params)}`),
  createWebsite: (data) => apiFetch('/websites', { method: 'POST', body: JSON.stringify(data) }),
  getWebsite: (id) => apiFetch(`/websites/${id}`),
  updateWebsite: (id, data) => apiFetch(`/websites/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteWebsite: (id) => apiFetch(`/websites/${id}`, { method: 'DELETE' }),

  // Audits
  getAudits: (params = {}) => apiFetch(`/audits?${new URLSearchParams(params)}`),
  createAudit: (websiteId) => apiFetch('/audits', { method: 'POST', body: JSON.stringify({ websiteId }) }),
  getAudit: (id) => apiFetch(`/audits/${id}`),
  getAuditStatus: (id) => apiFetch(`/audits/${id}/status`),
  retryAudit: (id) => apiFetch(`/audits/${id}/retry`, { method: 'POST' }),

  // Reports
  getReports: () => apiFetch('/reports'),
  getReport: (id) => apiFetch(`/reports/${id}`),
  downloadReport: (id) => `${API_BASE}/api/reports/${id}/download`,

  // Notifications
  getNotifications: (params = {}) => apiFetch(`/notifications?${new URLSearchParams(params)}`),
  markNotificationRead: (id) => apiFetch(`/notifications/${id}/read`, { method: 'PATCH' }),
};
