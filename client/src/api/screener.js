import api from './axios';

export const screenStocks = (params = {}) =>
  api.get('/screener', { params }).then((r) => r.data);
