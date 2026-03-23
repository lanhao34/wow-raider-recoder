import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// Auth
export const authApi = {
  login: (data: { username: string; password: string }) =>
    api.post('/auth/login', data).then((r) => r.data),
  register: (data: { username: string; password: string; displayName?: string }) =>
    api.post('/auth/register', data).then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
  getUsers: () => api.get('/auth/users').then((r) => r.data),
};

export const membersApi = {
  list: () => api.get('/members').then((r) => r.data),
  my: () => api.get('/members/my').then((r) => r.data),
  publicList: () => api.get('/members/public').then((r) => r.data),
  stats: () => api.get(`/members/stats?t=${Date.now()}`).then((r) => r.data),
  create: (data: object) => api.post('/members', data).then((r) => r.data),
  update: (id: number, data: object) => api.put(`/members/${id}`, data).then((r) => r.data),
  delete: (id: number) => api.delete(`/members/${id}`),
  tierProgress: () => api.get('/requirements/tier-progress').then((r) => r.data),
};

// Claims
export const claimsApi = {
  available: () => api.get('/claims/available').then((r) => r.data),
  request: (memberId: number) => api.post('/claims/request', { memberId }).then((r) => r.data),
  returnRole: (memberId: number) => api.post('/claims/return', { memberId }).then((r) => r.data),
};

// Schedules
export const schedulesApi = {
  list: (params?: { week?: string; month?: string }) =>
    api.get('/schedules', { params }).then((r) => r.data),
  create: (data: { date: string; note?: string }) =>
    api.post('/schedules', data).then((r) => r.data),
  get: (id: number) => api.get(`/schedules/${id}`).then((r) => r.data),
  updateParticipants: (scheduleId: number, memberIds: number[]) =>
    api.put(`/schedules/${scheduleId}/participants`, { memberIds }).then((r) => r.data),
  addRaid: (scheduleId: number, data: { raidId: string; raidName: string; difficulty: string }) =>
    api.post(`/schedules/${scheduleId}/raids`, data).then((r) => r.data),
  removeRaid: (scheduleId: number, raidRecordId: number) =>
    api.delete(`/schedules/${scheduleId}/raids/${raidRecordId}`),
  delete: (id: number) => api.delete(`/schedules/${id}`).then((r) => r.data),
};

// Raid kills
export const raidKillsApi = {
  create: (data: {
    scheduleId: number;
    raidId: string;
    bossId: string;
    bossName: string;
    difficulty: string;
  }) => api.post('/raid-kills', data).then((r) => r.data),
  get: (id: number) => api.get(`/raid-kills/${id}`).then((r) => r.data),
  delete: (id: number) => api.delete(`/raid-kills/${id}`).then((r) => r.data),
};

// Drops
export const dropsApi = {
  createBatch: (data: {
    raidKillId: number;
    items: Array<{ itemId: string; itemName: string; slot: string; isTier?: boolean; bonusDrop?: boolean; baseItemLevel?: number; quality?: string; armorType?: string }>;
  }) => api.post('/drops', data).then((r) => r.data),
  list: (params: { raidKillId?: number; memberId?: number }) =>
    api.get('/drops', { params }).then((r) => r.data),
  delete: (id: number) => api.delete(`/drops/${id}`),
};

// Distributions
export const distributionsApi = {
  create: (data: { dropId: number; memberId: number; method?: 'need' | 'greed' | 'force' }) =>
    api.post('/distributions', data).then((r) => r.data),
  list: (params?: { memberId?: number; week?: string }) =>
    api.get('/distributions', { params }).then((r) => r.data),
  updateStatus: (id: number, status?: string, method?: 'need' | 'greed' | 'force') =>
    api.put(`/distributions/${id}`, { status, method }).then((r) => r.data),
  delete: (id: number) => api.delete(`/distributions/${id}`),
};

// Requirements
export const requirementsApi = {
  list: (memberId?: number) =>
    api.get('/requirements', { params: memberId ? { memberId } : undefined }).then((r) => r.data),
  create: (data: { memberId?: number; itemId: string; itemName: string; priority: string; note?: string }) =>
    api.post('/requirements', data).then((r) => r.data),
  delete: (id: number) => api.delete(`/requirements/${id}`),
};

// Game Data
export const gameDataApi = {
  getRaids: () => api.get('/game-data/raids').then((r) => r.data),
};
