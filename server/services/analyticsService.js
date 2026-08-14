/**
 * Analytics Service
 * -----------------
 * Pure calculation functions for P&L, portfolio summaries, and statistical metrics.
 * No I/O — all functions take data objects and return computed results.
 */

// ─── Per-Holding Calculations ─────────────────────────────────────────────────
function calcHoldingPnL(holding, quote) {
  if (!quote || !quote.regularMarketPrice) {
    return {
      currentPrice: null,
      currentValue: null,
      investedAmount: null,
      absolutePnL: null,
      percentPnL: null,
      todayChange: null,
      todayChangePercent: null,
      holdingDays: null,
      error: quote?.error || 'Price unavailable',
    };
  }

  const currentPrice = quote.regularMarketPrice;
  const investedAmount = holding.buyPrice * holding.quantity;
  const currentValue = currentPrice * holding.quantity;
  const absolutePnL = currentValue - investedAmount;
  const percentPnL = investedAmount > 0 ? (absolutePnL / investedAmount) * 100 : 0;
  const todayChange = (quote.regularMarketChange || 0) * holding.quantity;
  const todayChangePercent = quote.regularMarketChangePercent || 0;
  const holdingDays = holding.buyDate
    ? Math.floor((Date.now() - new Date(holding.buyDate).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return {
    currentPrice,
    currentValue,
    investedAmount,
    absolutePnL,
    percentPnL,
    todayChange,
    todayChangePercent,
    holdingDays,
    error: null,
  };
}

// ─── Exchange Rates ───────────────────────────────────────────────────────────
// Fallback static exchange rates for portfolio summarization.
const EXCHANGE_RATES = {
  USD: 83.50,
  EUR: 90.00,
  GBP: 105.00,
  INR: 1.0,
};

const getExchangeRate = (currency) => EXCHANGE_RATES[currency?.toUpperCase()] || 1.0;

// ─── Portfolio Summary ────────────────────────────────────────────────────────
function calcPortfolioSummary(holdings, quotesMap) {
  let totalInvested = 0;
  let totalCurrentValue = 0;
  let totalTodayChange = 0;
  let validHoldings = 0;

  const enrichedHoldings = holdings.map((h) => {
    const quote = quotesMap[h.ticker];
    const pnl = calcHoldingPnL(h, quote);
    
    // Convert to base currency (INR) for total aggregations
    const rate = getExchangeRate(h.currency || quote?.currency || 'INR');

    if (pnl.currentValue !== null) {
      totalInvested += pnl.investedAmount * rate;
      totalCurrentValue += pnl.currentValue * rate;
      totalTodayChange += pnl.todayChange * rate;
      validHoldings++;
    } else {
      // Use invested amount as fallback for total
      totalInvested += (h.buyPrice * h.quantity) * rate;
    }

    return { ...h, ...pnl, quote };
  });

  const totalAbsolutePnL = totalCurrentValue - totalInvested;
  const totalPercentPnL = totalInvested > 0 ? (totalAbsolutePnL / totalInvested) * 100 : 0;
  const todayChangePercent =
    totalCurrentValue > 0 ? (totalTodayChange / (totalCurrentValue - totalTodayChange)) * 100 : 0;

  return {
    totalInvested,
    totalCurrentValue,
    totalAbsolutePnL,
    totalPercentPnL,
    totalTodayChange,
    todayChangePercent,
    validHoldings,
    totalHoldings: holdings.length,
    enrichedHoldings,
  };
}

// ─── Asset Allocation ─────────────────────────────────────────────────────────
function calcAllocation(enrichedHoldings) {
  const total = enrichedHoldings.reduce((sum, h) => sum + (h.currentValue || h.investedAmount || 0), 0);

  return enrichedHoldings
    .map((h) => ({
      ticker: h.ticker,
      companyName: h.companyName || h.ticker,
      value: h.currentValue || h.investedAmount || 0,
      percentage: total > 0 ? ((h.currentValue || h.investedAmount || 0) / total) * 100 : 0,
      sector: h.sector || 'Unknown',
    }))
    .sort((a, b) => b.value - a.value);
}

// ─── Top Gainers / Losers ─────────────────────────────────────────────────────
function calcTopMovers(enrichedHoldings, n = 3) {
  const valid = enrichedHoldings.filter((h) => h.percentPnL !== null);

  const gainers = [...valid]
    .filter((h) => h.percentPnL >= 0)
    .sort((a, b) => b.percentPnL - a.percentPnL)
    .slice(0, n);

  const losers = [...valid]
    .filter((h) => h.percentPnL < 0)
    .sort((a, b) => a.percentPnL - b.percentPnL)
    .slice(0, n);

  const todayGainers = [...valid]
    .filter((h) => h.todayChangePercent >= 0)
    .sort((a, b) => b.todayChangePercent - a.todayChangePercent)
    .slice(0, n);

  const todayLosers = [...valid]
    .filter((h) => h.todayChangePercent < 0)
    .sort((a, b) => a.todayChangePercent - b.todayChangePercent)
    .slice(0, n);

  return { gainers, losers, todayGainers, todayLosers };
}

// ─── Volatility ───────────────────────────────────────────────────────────────
// Standard deviation of daily returns (annualized)
function calcVolatility(historyData) {
  if (!historyData || historyData.length < 2) return null;

  const closes = historyData.map((d) => d.close).filter(Boolean);
  if (closes.length < 2) return null;

  const dailyReturns = [];
  for (let i = 1; i < closes.length; i++) {
    if (closes[i - 1] > 0) {
      dailyReturns.push((closes[i] - closes[i - 1]) / closes[i - 1]);
    }
  }

  if (dailyReturns.length === 0) return null;

  const mean = dailyReturns.reduce((s, r) => s + r, 0) / dailyReturns.length;
  const variance = dailyReturns.reduce((s, r) => s + Math.pow(r - mean, 2), 0) / dailyReturns.length;
  const stdDev = Math.sqrt(variance);
  const annualized = stdDev * Math.sqrt(252); // 252 trading days

  return {
    dailyStdDev: stdDev * 100,      // in %
    annualizedVolatility: annualized * 100, // in %
    dataPoints: dailyReturns.length,
  };
}

// ─── Range Stats ──────────────────────────────────────────────────────────────
function calcRangeStats(historyData) {
  if (!historyData || historyData.length === 0) return null;

  const closes = historyData.map((d) => d.close).filter(Boolean);
  const highs = historyData.map((d) => d.high).filter(Boolean);
  const lows = historyData.map((d) => d.low).filter(Boolean);
  const volumes = historyData.map((d) => d.volume).filter(Boolean);

  const first = closes[0];
  const last = closes[closes.length - 1];
  const change = last - first;
  const changePercent = first > 0 ? (change / first) * 100 : 0;

  return {
    periodHigh: Math.max(...highs),
    periodLow: Math.min(...lows),
    periodChange: change,
    periodChangePercent: changePercent,
    averageVolume: volumes.length > 0 ? volumes.reduce((s, v) => s + v, 0) / volumes.length : 0,
    startPrice: first,
    endPrice: last,
    ...calcVolatility(historyData),
  };
}

// ─── Portfolio Historical Value ────────────────────────────────────────────────
// Reconstruct portfolio value over time using historical data for each holding.
// Returns array of { date, value } points.
function calcPortfolioHistory(holdings, historicalDataMap) {
  // Collect all dates across all holdings
  const dateMap = {};

  holdings.forEach((holding) => {
    const history = historicalDataMap[holding.ticker];
    if (!history || !history.data) return;

    const buyDate = holding.buyDate ? new Date(holding.buyDate) : null;

    history.data.forEach((point) => {
      const date = new Date(point.date).toISOString().split('T')[0];
      // Only count from buy date onward
      if (buyDate && new Date(point.date) < buyDate) return;

      if (!dateMap[date]) dateMap[date] = 0;
      dateMap[date] += (point.close || 0) * holding.quantity;
    });
  });

  return Object.entries(dateMap)
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}

module.exports = {
  calcHoldingPnL,
  calcPortfolioSummary,
  calcAllocation,
  calcTopMovers,
  calcVolatility,
  calcRangeStats,
  calcPortfolioHistory,
};
