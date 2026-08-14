import api from './axios';

export const getBadges = () => api.get('/badges').then((r) => r.data);
export const evaluateBadges = () =>
  api.post('/badges/evaluate').then((r) => r.data);
