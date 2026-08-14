const Portfolio = require('../models/Portfolio');
const Holding = require('../models/Holding');
const Transaction = require('../models/Transaction');

// GET /api/portfolios
const getPortfolios = async (req, res) => {
  try {
    const portfolios = await Portfolio.find({ userId: req.user.id }).sort({ createdAt: -1 });
    // Attach holding count to each
    const result = await Promise.all(
      portfolios.map(async (p) => {
        const count = await Holding.countDocuments({ portfolioId: p._id });
        return { ...p.toObject(), holdingCount: count };
      })
    );
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/portfolios
const createPortfolio = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ success: false, error: 'Portfolio name is required' });
    }
    const portfolio = await Portfolio.create({ userId: req.user.id, name: name.trim(), description: description?.trim() || '' });
    res.status(201).json({ success: true, data: portfolio });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// PUT /api/portfolios/:id
const updatePortfolio = async (req, res) => {
  try {
    const portfolio = await Portfolio.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { name: req.body.name, description: req.body.description },
      { new: true, runValidators: true }
    );
    if (!portfolio) return res.status(404).json({ success: false, error: 'Portfolio not found' });
    res.json({ success: true, data: portfolio });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// DELETE /api/portfolios/:id
const deletePortfolio = async (req, res) => {
  try {
    const portfolio = await Portfolio.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!portfolio) return res.status(404).json({ success: false, error: 'Portfolio not found' });
    // Cascade delete holdings and transactions
    await Holding.deleteMany({ portfolioId: req.params.id });
    await Transaction.deleteMany({ portfolioId: req.params.id });
    res.json({ success: true, message: 'Portfolio deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { getPortfolios, createPortfolio, updatePortfolio, deletePortfolio };
