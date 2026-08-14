import api from './axios';

export const addHolding = (data) => api.post('/holdings', data).then((r) => r.data);
export const updateHolding = (id, data) => api.put(`/holdings/${id}`, data).then((r) => r.data);
export const deleteHolding = (id) => api.delete(`/holdings/${id}`).then((r) => r.data);
