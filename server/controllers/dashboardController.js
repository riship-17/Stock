const Portfolio = require('../models/Portfolio');
const Holding = require('../models/Holding');
const User = require('../models/User');
const { getBulkQuotes, getHistory } = require('../services/yahooFinanceService');
const {
  calcPortfolioSummary,
  calcAllocation,
  calcTopMovers,
  calcPortfolioHistory,
} = require('../services/analyticsService');

// GET /api/dashboard/summary
const getDashboardSummary = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('virtualCash startingCash name role');
    const portfolios = await Portfolio.find({ userId: req.user.id });
    const portfolioIds = portfolios.map(p => p._id);
    const allHoldings = await Holding.find({ portfolioId: { $in: portfolioIds } });

    const cash = user ? user.virtualCash : 0;
    const startingCash = user ? user.startingCash : 0;

    if (allHoldings.length === 0) {
      const totalAccountValue = cash;
      return res.json({
        success: true,
        data: {
          totalInvested: 0,
          totalCurrentValue: 0,
          totalPnL: 0,
          totalPnLPercent: 0,
          todayChange: 0,
          todayChangePercent: 0,
          cash,
          startingCash,
          totalAccountValue,
          accountTotalPnL: totalAccountValue - startingCash,
          accountTotalPnLPercent:
            startingCash > 0 ? ((totalAccountValue - startingCash) / startingCash) * 100 : 0,
          portfolios: portfolios.map((p) => ({ ...p.toObject(), holdingCount: 0 })),
          allocation: [],
          topMovers: { gainers: [], losers: [], todayGainers: [], todayLosers: [] },
          portfolioHistory: [],
        },
      });
    }

    // Fetch all quotes in bulk
    const tickers = [...new Set(allHoldings.map((h) => h.ticker))];
    const quotesMap = await getBulkQuotes(tickers);

    const { enrichedHoldings, totalInvested, totalCurrentValue, totalAbsolutePnL, totalPercentPnL, totalTodayChange, todayChangePercent } =
      calcPortfolioSummary(allHoldings, quotesMap);

    const allocation = calcAllocation(enrichedHoldings);
    const topMovers = calcTopMovers(enrichedHoldings);

    // Portfolio history (1Y)
    const historicalDataMap = {};
    await Promise.allSettled(
      tickers.map(async (ticker) => {
        const { data } = await getHistory(ticker, '1Y');
        historicalDataMap[ticker] = { data };
      })
    );
    const portfolioHistory = calcPortfolioHistory(allHoldings, historicalDataMap);

    // Per-portfolio breakdown
    const portfolioBreakdown = await Promise.all(
      portfolios.map(async (portfolio) => {
        const holdings = allHoldings.filter(
          (h) => h.portfolioId.toString() === portfolio._id.toString()
        );
        const portQuotes = {};
        holdings.forEach((h) => { portQuotes[h.ticker] = quotesMap[h.ticker]; });
        const summary = calcPortfolioSummary(holdings, portQuotes);
        return {
          ...portfolio.toObject(),
          holdingCount: holdings.length,
          totalInvested: summary.totalInvested,
          totalCurrentValue: summary.totalCurrentValue,
          totalPnL: summary.totalAbsolutePnL,
          totalPnLPercent: summary.totalPercentPnL,
        };
      })
    );

    const totalAccountValue = cash + totalCurrentValue;

    res.json({
      success: true,
      data: {
        totalInvested,
        totalCurrentValue,
        totalPnL: totalAbsolutePnL,
        totalPnLPercent: totalPercentPnL,
        todayChange: totalTodayChange,
        todayChangePercent,
        cash,
        startingCash,
        totalAccountValue,
        accountTotalPnL: totalAccountValue - startingCash,
        accountTotalPnLPercent:
          startingCash > 0 ? ((totalAccountValue - startingCash) / startingCash) * 100 : 0,
        portfolios: portfolioBreakdown,
        allocation,
        topMovers,
        portfolioHistory,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('[Dashboard] Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { getDashboardSummary };
