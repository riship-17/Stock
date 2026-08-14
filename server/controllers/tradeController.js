const User = require('../models/User');
const Holding = require('../models/Holding');
const Transaction = require('../models/Transaction');
const { getQuote } = require('../services/yahooFinanceService');
const { resolveLivePrice, getAccountState, fifoSell } = require('../services/tradingService');

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

exports.buy = async (req, res) => {
  try {
    const { portfolioId, ticker, quantity } = req.body;
    const qty = parseFloat(quantity);

    if (!portfolioId || !ticker || !qty || qty <= 0) {
      return res.status(400).json({
        success: false,
        error: 'portfolioId, ticker and a positive quantity are required',
      });
    }

    const useLive = req.body.useLivePrice !== false;
    let price = req.body.price ? parseFloat(req.body.price) : null;
    let companyName = req.body.companyName || '';

    if (useLive && (price == null || price <= 0)) {
      const live = await resolveLivePrice(ticker);
      price = live.price;
      if (!companyName) companyName = live.companyName;
    }
    if (price == null || price <= 0) {
      return res.status(400).json({ success: false, error: 'A valid price is required' });
    }

    const cost = round2(price * qty);
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    if (cost > user.virtualCash + Number.EPSILON) {
      return res.status(400).json({
        success: false,
        error: `Insufficient virtual cash. Need ₹${cost.toFixed(2)}, available ₹${user.virtualCash.toFixed(2)}`,
      });
    }

    if (!companyName) {
      try {
        const live = await resolveLivePrice(ticker);
        companyName = live.companyName;
      } catch (_) {
        companyName = ticker.toUpperCase();
      }
    }

    const buyDate = req.body.buyDate ? new Date(req.body.buyDate) : new Date();

    const holding = await Holding.create({
      userId: req.user.id,
      portfolioId,
      ticker: ticker.toUpperCase(),
      companyName,
      quantity: qty,
      buyPrice: round2(price),
      buyDate,
      sector: req.body.sector || 'Unknown',
      notes: req.body.notes || 'Paper trade buy',
    });

    await Transaction.create({
      userId: req.user.id,
      portfolioId,
      ticker: ticker.toUpperCase(),
      companyName,
      type: 'buy',
      quantity: qty,
      price: round2(price),
      date: buyDate,
      notes: req.body.notes || 'Paper trade buy',
    });

    user.virtualCash = round2(user.virtualCash - cost);
    await user.save();

    const account = await getAccountState(req.user.id);

    res.status(201).json({
      success: true,
      data: holding,
      account,
      message: `Bought ${qty} ${ticker.toUpperCase()} @ ₹${price.toFixed(2)} (cost ₹${cost.toFixed(2)})`,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.sell = async (req, res) => {
  try {
    const { portfolioId, ticker, quantity } = req.body;
    const qty = parseFloat(quantity);

    if (!portfolioId || !ticker || !qty || qty <= 0) {
      return res.status(400).json({
        success: false,
        error: 'portfolioId, ticker and a positive quantity are required',
      });
    }

    const lots = await Holding.find({
      userId: req.user.id,
      portfolioId,
      ticker: ticker.toUpperCase(),
    }).sort({ buyDate: 1 });

    const totalAvailable = lots.reduce((s, l) => s + l.quantity, 0);
    if (totalAvailable < qty) {
      return res.status(400).json({
        success: false,
        error: `Insufficient holdings. You hold ${totalAvailable} ${ticker.toUpperCase()}, tried to sell ${qty}.`,
      });
    }

    let price = req.body.price ? parseFloat(req.body.price) : null;
    let companyName = lots[0]?.companyName || '';
    if (price == null || price <= 0) {
      const live = await resolveLivePrice(ticker);
      price = live.price;
      if (!companyName) companyName = live.companyName;
    }
    if (price == null || price <= 0) {
      return res.status(400).json({ success: false, error: 'A valid price is required' });
    }

    const { reducedLots, matched } = fifoSell(
      lots.map((l) => l.toObject()),
      qty
    );

    let realizedGain = 0;
    const sellDate = req.body.sellDate ? new Date(req.body.sellDate) : new Date();

    for (const m of matched) {
      realizedGain += round2((price - m.buyPrice) * m.matchedQty);

      const lot = reducedLots.find((l) => l._id.toString() === m.holdingId.toString());
      if (!lot) continue;
      if (lot.quantity <= 1e-9) {
        await Holding.findByIdAndDelete(m.holdingId);
      } else {
        await Holding.updateOne(
          { _id: m.holdingId, userId: req.user.id },
          { quantity: round2(lot.quantity) }
        );
      }
    }

    const proceeds = round2(price * qty);

    await Transaction.create({
      userId: req.user.id,
      portfolioId,
      ticker: ticker.toUpperCase(),
      companyName,
      type: 'sell',
      quantity: qty,
      price: round2(price),
      date: sellDate,
      notes: req.body.notes || 'Paper trade sell',
    });

    const user = await User.findById(req.user.id);
    user.virtualCash = round2(user.virtualCash + proceeds);
    await user.save();

    const account = await getAccountState(req.user.id);

    res.status(201).json({
      success: true,
      data: {
        ticker: ticker.toUpperCase(),
        quantity: qty,
        price: round2(price),
        proceeds,
        realizedGain: round2(realizedGain),
        matchedLots: matched.map((m) => ({
          buyDate: m.buyDate,
          buyPrice: m.buyPrice,
          matchedQty: m.matchedQty,
        })),
      },
      account,
      message:
        realizedGain >= 0
          ? `Sold ${qty} ${ticker.toUpperCase()} @ ₹${price.toFixed(2)} — profit ₹${realizedGain.toFixed(2)}`
          : `Sold ${qty} ${ticker.toUpperCase()} @ ₹${price.toFixed(2)} — loss ₹${Math.abs(realizedGain).toFixed(2)}`,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.reset = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    await Holding.deleteMany({ userId: req.user.id });
    await Transaction.deleteMany({ userId: req.user.id });

    user.virtualCash = user.startingCash;
    await user.save();

    const account = await getAccountState(req.user.id);
    res.json({
      success: true,
      account,
      message: `Paper account reset to ₹${user.startingCash.toLocaleString('en-IN')}`,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
