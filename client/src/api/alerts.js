import api from './axios';

export const getAlerts = () => api.get('/alerts').then((r) => r.data);
export const createAlert = (data) =>
  api.post('/alerts', data).then((r) => r.data);
export const deleteAlert = (id) =>
  api.delete(`/alerts/${id}`).then((r) => r.data);
export const toggleAlert = (id) =>
  api.put(`/alerts/${id}/toggle`).then((r) => r.data);
export const evaluateAlerts = () =>
  api.post('/alerts/evaluate').then((r) => r.data);
