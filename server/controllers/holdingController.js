const Holding = require('../models/Holding');
const Transaction = require('../models/Transaction');
const { validateTicker, getBulkQuotes } = require('../services/yahooFinanceService');
const { calcHoldingPnL } = require('../services/analyticsService');

// GET /api/portfolios/:id/holdings
const getHoldings = async (req, res) => {
  try {
    const holdings = await Holding.find({ portfolioId: req.params.id, userId: req.user.id }).sort({ createdAt: -1 });

    if (holdings.length === 0) {
      return res.json({ success: true, data: [], summary: null });
    }

    const tickers = [...new Set(holdings.map((h) => h.ticker))];
    const quotesMap = await getBulkQuotes(tickers);

    const enriched = holdings.map((h) => {
      const quote = quotesMap[h.ticker];
      const pnl = calcHoldingPnL(h, quote);
      return { ...h.toObject(), ...pnl, quote };
    });

    const totalInvested = enriched.reduce((s, h) => s + (h.investedAmount || 0), 0);
    const totalCurrentValue = enriched.reduce((s, h) => s + (h.currentValue || h.investedAmount || 0), 0);

    res.json({
      success: true,
      data: enriched,
      summary: {
        totalInvested,
        totalCurrentValue,
        totalPnL: totalCurrentValue - totalInvested,
        totalPnLPercent: totalInvested > 0 ? ((totalCurrentValue - totalInvested) / totalInvested) * 100 : 0,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/holdings
const addHolding = async (req, res) => {
  try {
    const { portfolioId, ticker, quantity, buyPrice, buyDate, sector, notes } = req.body;

    if (!portfolioId || !ticker || !quantity || !buyPrice || !buyDate) {
      return res.status(400).json({ success: false, error: 'portfolioId, ticker, quantity, buyPrice, buyDate are required' });
    }

    // Validate ticker before saving
    const validation = await validateTicker(ticker);
    if (!validation.valid) {
      return res.status(400).json({ success: false, error: validation.error });
    }

    const holding = await Holding.create({
      userId: req.user.id,
      portfolioId,
      ticker: ticker.toUpperCase(),
      companyName: validation.shortName || ticker.toUpperCase(),
      quantity: parseFloat(quantity),
      buyPrice: parseFloat(buyPrice),
      buyDate: new Date(buyDate),
      sector: sector || 'Unknown',
      notes: notes || '',
    });

    // Log transaction
    await Transaction.create({
      userId: req.user.id,
      portfolioId,
      ticker: ticker.toUpperCase(),
      companyName: validation.shortName || ticker.toUpperCase(),
      type: 'buy',
      quantity: parseFloat(quantity),
      price: parseFloat(buyPrice),
      date: new Date(buyDate),
      notes: notes || '',
    });

    res.status(201).json({ success: true, data: holding });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// PUT /api/holdings/:id
const updateHolding = async (req, res) => {
  try {
    const holding = await Holding.findOneAndUpdate({ _id: req.params.id, userId: req.user.id }, req.body, {
      new: true,
      runValidators: true,
    });
    if (!holding) return res.status(404).json({ success: false, error: 'Holding not found' });
    res.json({ success: true, data: holding });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// DELETE /api/holdings/:id
const deleteHolding = async (req, res) => {
  try {
    const holding = await Holding.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!holding) return res.status(404).json({ success: false, error: 'Holding not found' });
    res.json({ success: true, message: 'Holding removed' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { getHoldings, addHolding, updateHolding, deleteHolding };
