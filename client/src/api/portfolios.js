import api from './axios';

export const getPortfolios = () => api.get('/portfolios').then((r) => r.data);
export const createPortfolio = (data) => api.post('/portfolios', data).then((r) => r.data);
export const updatePortfolio = (id, data) => api.put(`/portfolios/${id}`, data).then((r) => r.data);
export const deletePortfolio = (id) => api.delete(`/portfolios/${id}`).then((r) => r.data);
export const getPortfolioHoldings = (id) => api.get(`/portfolios/${id}/holdings`).then((r) => r.data);
