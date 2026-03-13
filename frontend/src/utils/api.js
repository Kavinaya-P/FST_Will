import axios from 'axios';

// ── User API instance ───────────────────────────────
const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('ev_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ev_token');
      localStorage.removeItem('ev_user');
      // Only redirect if not on auth pages
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

// ── Admin API instance ──────────────────────────────
const adminApi = axios.create({ baseURL: '/api/admin' });

adminApi.interceptors.request.use(cfg => {
  const token = localStorage.getItem('ev_admin_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

adminApi.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ev_admin_token');
      localStorage.removeItem('ev_admin');
      if (!window.location.pathname.startsWith('/admin/login')) {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(err);
  }
);

// ── User Auth API ───────────────────────────────────
export const authAPI = {
  register:               (data)           => api.post('/auth/register', data),
  verifyEmail:            (userId, otp)    => api.post('/auth/verify-email', { userId, otp }),
  resendVerification:     (userId)         => api.post('/auth/resend-verification', { userId }),
  login:                  (data)           => api.post('/auth/login', data),
  verifyLoginOtp:         (userId, otp)    => api.post('/auth/verify-login-otp', { userId, otp }),
  getMe:                  ()               => api.get('/auth/me'),
};

// ── Vault API ───────────────────────────────────────
export const vaultAPI = {
  getVault:   ()         => api.get('/vault'),
  addAsset:   (data)     => api.post('/vault/assets', data),
  deleteAsset:(id)       => api.delete(`/vault/assets/${id}`),
};

// ── Nominees API ────────────────────────────────────
export const nomineesAPI = {
  getNominees:       ()          => api.get('/nominees'),
  addNominee:        (data)      => api.post('/nominees', data),
  removeNominee:     (id)        => api.delete(`/nominees/${id}`),
  acceptInvitation:  (token)     => api.post('/nominees/accept', { token }),
  declineInvitation: (token)     => api.post('/nominees/decline', { token }),
};

// ── Dead Man's Switch API ───────────────────────────
export const deadmanAPI = {
  getStatus:     ()      => api.get('/deadman/status'),
  confirmCheckin:()      => api.post('/deadman/checkin'),
  updateInterval:(days)  => api.put('/deadman/interval', { days }),
};

// ── Death / Nominee Portal API ──────────────────────
export const deathAPI = {
  // Public nominee portal — no auth needed
  submitDeathRequest:     (formData)              => axios.post('/api/death/request', formData),
  getNomineeRequestStatus:(nomineeToken, email)   => axios.get('/api/death/nominee-status', { params: { nomineeToken, vaultOwnerEmail: email } }),
};

// ── Admin API ───────────────────────────────────────
export const adminAuthAPI = {
  login:       (data)           => adminApi.post('/auth/login', data),
  verifyOtp:   (adminId, otp)   => adminApi.post('/auth/verify-otp', { adminId, otp }),
  getMe:       ()               => adminApi.get('/auth/me'),
};

export const adminDeathAPI = {
  getAllRequests:   ()                      => adminApi.get('/death/requests'),
  getRequest:      (id)                    => adminApi.get(`/death/requests/${id}`),
  approveRequest:  (id, adminNotes)        => adminApi.post(`/death/requests/${id}/approve`, { adminNotes }),
  rejectRequest:   (id, adminNotes)        => adminApi.post(`/death/requests/${id}/reject`, { adminNotes }),
};

export default api;
