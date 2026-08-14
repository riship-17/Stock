import api from './axios';

export const getNews = (params = {}) =>
  api.get('/news', { params }).then((r) => r.data);
