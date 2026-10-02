const API_BASE = 'http://localhost:8000';

export const api = {
  // Users
  createProfile: (data) => fetch(`${API_BASE}/users/profile`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),
  getProfile: (id) => fetch(`${API_BASE}/users/profile/${id}`).then(r => r.json()),

  // Hazards
  getHazards: () => fetch(`${API_BASE}/hazards`).then(r => r.json()),
  createHazard: (data) => fetch(`${API_BASE}/hazards`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),
  reportHazard: (data) => fetch(`${API_BASE}/hazards/report`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),
  resolveHazard: (id) => fetch(`${API_BASE}/hazards/${id}/resolve`, { method: 'PATCH' }).then(r => r.json()),
  deleteHazard: (id) => fetch(`${API_BASE}/hazards/${id}`, { method: 'DELETE' }).then(r => r.json()),

  // Shelters
  getShelters: () => fetch(`${API_BASE}/shelters`).then(r => r.json()),

  // Routes
  getRoutes: () => fetch(`${API_BASE}/routes`).then(r => r.json()),

  // Evacuation
  calculateEvacuation: (data) => fetch(`${API_BASE}/evacuation/calculate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),
  recalculateEvacuation: (data) => fetch(`${API_BASE}/evacuation/recalculate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),

  // Dashboard
  getDashboardStats: () => fetch(`${API_BASE}/dashboard/statistics`).then(r => r.json()),
};
