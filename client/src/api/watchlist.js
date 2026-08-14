import api from './axios';

export const getWatchlist = () => api.get('/watchlist').then((r) => r.data);
export const addToWatchlist = (data) => api.post('/watchlist', data).then((r) => r.data);
export const removeFromWatchlist = (id) => api.delete(`/watchlist/${id}`).then((r) => r.data);
export const convertWatchlistToBuy = (id, data) => api.post(`/watchlist/${id}/buy`, data).then((r) => r.data);
