import api from './axios';

export const getTransactions = (params = {}) =>
  api.get('/transactions', { params }).then((r) => r.data);
export const createTransaction = (data) => api.post('/transactions', data).then((r) => r.data);
