const Watchlist = require('../models/Watchlist');
const Holding = require('../models/Holding');
const Transaction = require('../models/Transaction');
const { validateTicker, getBulkQuotes } = require('../services/yahooFinanceService');

// GET /api/watchlist
const getWatchlist = async (req, res) => {
  try {
    const items = await Watchlist.find({ userId: req.user.id }).sort({ addedDate: -1 });

    if (items.length === 0) return res.json({ success: true, data: [] });

    const tickers = items.map((i) => i.ticker);
    const quotesMap = await getBulkQuotes(tickers);

    const enriched = items.map((item) => ({
      ...item.toObject(),
      quote: quotesMap[item.ticker] || null,
    }));

    res.json({ success: true, data: enriched });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/watchlist
const addToWatchlist = async (req, res) => {
  try {
    const { ticker, notes, targetPrice } = req.body;
    if (!ticker) return res.status(400).json({ success: false, error: 'Ticker is required' });

    // Validate ticker
    const validation = await validateTicker(ticker);
    if (!validation.valid) {
      return res.status(400).json({ success: false, error: validation.error });
    }

    const item = await Watchlist.create({
      userId: req.user.id,
      ticker: ticker.toUpperCase(),
      companyName: validation.shortName || ticker.toUpperCase(),
      notes: notes || '',
      targetPrice: targetPrice ? parseFloat(targetPrice) : null,
    });

    res.status(201).json({ success: true, data: item });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, error: 'Ticker already in watchlist' });
    }
    res.status(500).json({ success: false, error: err.message });
  }
};

// DELETE /api/watchlist/:id
const removeFromWatchlist = async (req, res) => {
  try {
    const item = await Watchlist.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!item) return res.status(404).json({ success: false, error: 'Watchlist item not found' });
    res.json({ success: true, message: 'Removed from watchlist' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/watchlist/:id/buy  — Convert watchlist item to holding
const convertToBuy = async (req, res) => {
  try {
    const watchlistItem = await Watchlist.findOne({ _id: req.params.id, userId: req.user.id });
    if (!watchlistItem) return res.status(404).json({ success: false, error: 'Watchlist item not found' });

    const { portfolioId, quantity, buyPrice, buyDate, sector, notes } = req.body;
    if (!portfolioId || !quantity || !buyPrice || !buyDate) {
      return res.status(400).json({ success: false, error: 'portfolioId, quantity, buyPrice, buyDate are required' });
    }

    const holding = await Holding.create({
      userId: req.user.id,
      portfolioId,
      ticker: watchlistItem.ticker,
      companyName: watchlistItem.companyName,
      quantity: parseFloat(quantity),
      buyPrice: parseFloat(buyPrice),
      buyDate: new Date(buyDate),
      sector: sector || watchlistItem.sector || 'Unknown',
      notes: notes || '',
    });

    await Transaction.create({
      userId: req.user.id,
      portfolioId,
      ticker: watchlistItem.ticker,
      companyName: watchlistItem.companyName,
      type: 'buy',
      quantity: parseFloat(quantity),
      price: parseFloat(buyPrice),
      date: new Date(buyDate),
      notes: `Converted from watchlist. ${notes || ''}`,
    });

    // Remove from watchlist
    await Watchlist.findByIdAndDelete(req.params.id);

    res.status(201).json({ success: true, data: holding, message: 'Added to portfolio' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { getWatchlist, addToWatchlist, removeFromWatchlist, convertToBuy };
