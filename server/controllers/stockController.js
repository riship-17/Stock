const { getQuote, getHistory, validateTicker, searchStocks } = require('../services/yahooFinanceService');
const { calcRangeStats, calcVolatility } = require('../services/analyticsService');

// GET /api/stocks/:ticker/quote
const getStockQuote = async (req, res) => {
  try {
    const { ticker } = req.params;
    const { data, cached, error } = await getQuote(ticker);

    if (!data) {
      return res.status(503).json({ success: false, error: error || 'Data unavailable' });
    }

    res.json({ success: true, data, cached });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/stocks/:ticker/history?range=1M
const getStockHistory = async (req, res) => {
  try {
    const { ticker } = req.params;
    const range = req.query.range || '1M';

    const { data, cached, error } = await getHistory(ticker, range);

    if (!data) {
      return res.status(503).json({ success: false, error: error || 'Historical data unavailable' });
    }

    const stats = calcRangeStats(data);

    res.json({ success: true, data, stats, cached, range });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/stocks/:ticker/validate
const validateStock = async (req, res) => {
  try {
    const result = await validateTicker(req.params.ticker);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/stocks/compare?tickers=RELIANCE.NS,TCS.NS&range=1M
const compareStocks = async (req, res) => {
  try {
    const { tickers, range = '1M' } = req.query;
    if (!tickers) return res.status(400).json({ success: false, error: 'tickers query param required' });

    const tickerList = tickers.split(',').map((t) => t.trim().toUpperCase()).slice(0, 3);

    const results = await Promise.all(
      tickerList.map(async (ticker) => {
        const { data, error } = await getHistory(ticker, range);
        if (!data) return { ticker, error, data: null };

        // Normalize to % change from first point
        const first = data[0]?.close;
        const normalized = data.map((point) => ({
          date: point.date,
          normalizedClose: first > 0 ? ((point.close - first) / first) * 100 : 0,
          close: point.close,
        }));

        const stats = calcRangeStats(data);
        return { ticker, data: normalized, stats, error: null };
      })
    );

    res.json({ success: true, data: results, range });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/stocks/search?q=query
const searchStock = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ success: false, error: 'q query param required' });

    const result = await searchStocks(q);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { getStockQuote, getStockHistory, validateStock, compareStocks, searchStock };
