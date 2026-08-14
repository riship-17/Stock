const User = require('../models/User');
const Holding = require('../models/Holding');
const Transaction = require('../models/Transaction');
const { getBulkQuotes } = require('../services/yahooFinanceService');

exports.getLeaderboard = async (req, res) => {
  try {
    const users = await User.find({})
      .select('name virtualCash startingCash createdAt');
    if (users.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const holdings = await Holding.find({});
    const tradeCountsAgg = await Transaction.aggregate([
      { $group: { _id: '$userId', count: { $sum: 1 } } },
    ]);
    const tradeCounts = {};
    tradeCountsAgg.forEach((t) => {
      tradeCounts[t._id.toString()] = t.count;
    });

    const tickers = [...new Set(holdings.map((h) => h.ticker))];
    const quotesMap = tickers.length ? await getBulkQuotes(tickers) : {};

    const rows = users.map((u) => {
      const userHoldings = holdings.filter(
        (h) => h.userId.toString() === u._id.toString()
      );
      let investedValue = 0;
      userHoldings.forEach((h) => {
        const q = quotesMap[h.ticker];
        investedValue +=
          h.quantity *
          (q && q.regularMarketPrice ? q.regularMarketPrice : h.buyPrice);
      });
      const totalAccountValue = (u.virtualCash || 0) + investedValue;
      const startingCash = u.startingCash || 0;
      const totalPnL = totalAccountValue - startingCash;
      const returnPct = startingCash > 0 ? (totalPnL / startingCash) * 100 : 0;
      return {
        userId: u._id,
        name: u.name,
        startingCash,
        cash: u.virtualCash || 0,
        investedValue,
        totalAccountValue,
        totalPnL,
        returnPct,
        trades: tradeCounts[u._id.toString()] || 0,
        holdingsCount: userHoldings.length,
        createdAt: u.createdAt,
      };
    });

    rows.sort((a, b) => b.returnPct - a.returnPct);
    const ranked = rows.map((r, i) => ({ ...r, rank: i + 1 }));

    res.json({ success: true, data: ranked });
  } catch (err) {
    console.error('[Leaderboard]', err);
    res.status(500).json({ success: false, error: err.message });
  }
};
