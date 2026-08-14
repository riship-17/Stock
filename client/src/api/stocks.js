import api from './axios';

export const getStockQuote = (ticker) => api.get(`/stocks/${ticker}/quote`).then((r) => r.data);
export const getStockHistory = (ticker, range = '1M') =>
  api.get(`/stocks/${ticker}/history`, { params: { range } }).then((r) => r.data);
export const validateTicker = (ticker) => api.get(`/stocks/${ticker}/validate`).then((r) => r.data);
export const compareStocks = (tickers, range = '1M') =>
  api.get('/stocks/compare', { params: { tickers: tickers.join(','), range } }).then((r) => r.data);
export const searchStocks = (query) => api.get('/stocks/search', { params: { q: query } }).then((r) => r.data);
