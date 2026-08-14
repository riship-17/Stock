const User = require('../models/User');
const Holding = require('../models/Holding');
const Transaction = require('../models/Transaction');
const { getQuote, getBulkQuotes } = require('./yahooFinanceService');
const { calcPortfolioSummary } = require('./analyticsService');

const DEFAULT_STARTING_CASH = 1000000;

async function resolveLivePrice(ticker) {
  const { data, error } = await getQuote(ticker);
  if (!data || !data.regularMarketPrice) {
    throw new Error(error || `Live price unavailable for ${ticker}`);
  }
  return {
    price: data.regularMarketPrice,
    companyName: data.longName || data.shortName || ticker.toUpperCase(),
    quote: data,
  };
}

async function getAccountState(userId) {
  const user = await User.findById(userId).select('virtualCash startingCash name role');
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }

  const holdings = await Holding.find({ userId }).sort({ buyDate: 1 });
  if (holdings.length === 0) {
    return {
      cash: user.virtualCash,
      startingCash: user.startingCash,
      investedValue: 0,
      totalAccountValue: user.virtualCash,
      totalPnL: user.virtualCash - user.startingCash,
      totalPnLPercent:
        user.startingCash > 0
          ? ((user.virtualCash - user.startingCash) / user.startingCash) * 100
          : 0,
      holdingsCount: 0,
      distinctTickers: 0,
    };
  }

  const tickers = [...new Set(holdings.map((h) => h.ticker))];
  const quotesMap = await getBulkQuotes(tickers);
  const summary = calcPortfolioSummary(holdings, quotesMap);

  const investedValue = summary.totalCurrentValue;
  const totalAccountValue = user.virtualCash + investedValue;
  const totalPnL = totalAccountValue - user.startingCash;

  return {
    cash: user.virtualCash,
    startingCash: user.startingCash,
    investedValue,
    cashPnL: user.virtualCash - user.startingCash,
    totalAccountValue,
    totalPnL,
    totalPnLPercent:
      user.startingCash > 0 ? (totalPnL / user.startingCash) * 100 : 0,
    holdingsCount: holdings.length,
    distinctTickers: tickers.length,
  };
}

function fifoSell(lots, sellQty) {
  const remaining = sellQty;
  const reducedLots = lots.map((l) => ({ ...l }));
  const matched = [];
  let left = remaining;

  for (const lot of reducedLots) {
    if (left <= 0) break;
    if (lot.quantity <= 0) continue;
    const take = Math.min(lot.quantity, left);
    lot.quantity -= take;
    left -= take;
    matched.push({
      holdingId: lot._id,
      buyDate: lot.buyDate,
      buyPrice: lot.buyPrice,
      matchedQty: take,
    });
  }

  if (left > 0) {
    throw new Error(
      `Insufficient holdings to sell. Short by ${left.toFixed(3)} shares.`
    );
  }

  return { reducedLots, matched };
}

module.exports = {
  DEFAULT_STARTING_CASH,
  resolveLivePrice,
  getAccountState,
  fifoSell,
};
