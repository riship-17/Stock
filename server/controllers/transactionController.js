const Transaction = require('../models/Transaction');
const Holding = require('../models/Holding');

// GET /api/transactions?portfolioId=&type=&ticker=
const getTransactions = async (req, res) => {
  try {
    const filter = { userId: req.user.id };
    if (req.query.portfolioId) filter.portfolioId = req.query.portfolioId;
    if (req.query.type) filter.type = req.query.type;
    if (req.query.ticker) filter.ticker = req.query.ticker.toUpperCase();

    const transactions = await Transaction.find(filter)
      .sort({ date: -1 })
      .populate('portfolioId', 'name');

    // Calculate realized gains for sell transactions
    const enriched = await Promise.all(
      transactions.map(async (t) => {
        let realizedGain = null;
        if (t.type === 'sell') {
          // Find average buy price for this ticker in this portfolio
          const buyTxns = await Transaction.find({
            portfolioId: t.portfolioId,
            userId: req.user.id,
            ticker: t.ticker,
            type: 'buy',
            date: { $lte: t.date },
          });
          if (buyTxns.length > 0) {
            const totalBuyQty = buyTxns.reduce((s, b) => s + b.quantity, 0);
            const totalBuyCost = buyTxns.reduce((s, b) => s + b.quantity * b.price, 0);
            const avgBuyPrice = totalBuyQty > 0 ? totalBuyCost / totalBuyQty : 0;
            realizedGain = (t.price - avgBuyPrice) * t.quantity;
          }
        }
        return { ...t.toObject(), realizedGain };
      })
    );

    res.json({ success: true, data: enriched });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/transactions (manual sell entry)
const createTransaction = async (req, res) => {
  try {
    const { portfolioId, ticker, type, quantity, price, date, notes } = req.body;

    if (!portfolioId || !ticker || !type || !quantity || !price || !date) {
      return res.status(400).json({ success: false, error: 'All fields required' });
    }

    const transaction = await Transaction.create({
      userId: req.user.id,
      portfolioId,
      ticker: ticker.toUpperCase(),
      type,
      quantity: parseFloat(quantity),
      price: parseFloat(price),
      date: new Date(date),
      notes: notes || '',
    });

    // If selling, reduce or remove the holding
    if (type === 'sell') {
      const holding = await Holding.findOne({ portfolioId, ticker: ticker.toUpperCase(), userId: req.user.id });
      if (holding) {
        const newQty = holding.quantity - parseFloat(quantity);
        if (newQty <= 0) {
          await Holding.findByIdAndDelete(holding._id);
        } else {
          await Holding.findByIdAndUpdate(holding._id, { quantity: newQty });
        }
      }
    }

    res.status(201).json({ success: true, data: transaction });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { getTransactions, createTransaction };
