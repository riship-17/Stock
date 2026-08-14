import api from './axios';

export const placeBuy = (data) =>
  api.post('/trade/buy', data).then((r) => r.data);
export const placeSell = (data) =>
  api.post('/trade/sell', data).then((r) => r.data);
export const resetAccount = () =>
  api.post('/trade/reset').then((r) => r.data);
