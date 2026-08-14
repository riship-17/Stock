import api from './axios';

export const getAccount = () => api.get('/account').then((r) => r.data);
