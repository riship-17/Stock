/**
 * Yahoo Finance Service
 * ---------------------
 * DISCLAIMER: Data sourced from yahoo-finance2 (unofficial Yahoo Finance API).
 * Data may be delayed. Suitable for portfolio tracking and analysis ONLY.
 * NOT suitable for algorithmic trading or real-time financial decisions.
 *
 * All yahoo-finance2 calls are made exclusively from this backend service.
 * The frontend never calls Yahoo Finance directly.
 *
 * v3/v4 API: yahooFinance is now instantiated via `new YahooFinance()`.
 */

const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

const StockCache = require('../models/StockCache');

// ─── Cache TTL Configuration ─────────────────────────────────────────────────
const PRICE_TTL_MS = (parseInt(process.env.PRICE_CACHE_TTL_MINUTES) || 2) * 60 * 1000;
const HISTORY_TTL_MS = (parseInt(process.env.HISTORY_CACHE_TTL_MINUTES) || 60) * 60 * 1000;

// Map frontend range keys to yahoo-finance2 period1 offsets
const RANGE_CONFIG = {
  '1D': { period1: () => { const d = new Date(); d.setDate(d.getDate() - 1); return d; }, interval: '5m' },
  '1W': { period1: () => { const d = new Date(); d.setDate(d.getDate() - 7); return d; }, interval: '1h' },
  '1M': { period1: () => { const d = new Date(); d.setMonth(d.getMonth() - 1); return d; }, interval: '1d' },
  '3M': { period1: () => { const d = new Date(); d.setMonth(d.getMonth() - 3); return d; }, interval: '1d' },
  '6M': { period1: () => { const d = new Date(); d.setMonth(d.getMonth() - 6); return d; }, interval: '1d' },
  '1Y': { period1: () => { const d = new Date(); d.setFullYear(d.getFullYear() - 1); return d; }, interval: '1wk' },
  '5Y': { period1: () => { const d = new Date(); d.setFullYear(d.getFullYear() - 5); return d; }, interval: '1mo' },
};

// ─── Retry with Exponential Backoff ──────────────────────────────────────────
async function withRetry(fn, maxAttempts = 3, baseDelayMs = 500) {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts) {
        const delay = baseDelayMs * Math.pow(2, attempt - 1);
        await new Promise((res) => setTimeout(res, delay));
      }
    }
  }
  throw lastError;
}

// ─── Get or Create Cache Document ────────────────────────────────────────────
async function getOrCreateCache(ticker) {
  let cache = await StockCache.findOne({ ticker: ticker.toUpperCase() });
  if (!cache) {
    cache = await StockCache.create({ ticker: ticker.toUpperCase() });
  }
  return cache;
}

// ─── Live Quote (with cache) ──────────────────────────────────────────────────
async function getQuote(ticker) {
  const upperTicker = ticker.toUpperCase();

  try {
    const cache = await getOrCreateCache(upperTicker);

    // Return cached price if fresh
    if (
      cache.priceData &&
      cache.lastFetchedPrice &&
      Date.now() - cache.lastFetchedPrice.getTime() < PRICE_TTL_MS
    ) {
      return { data: cache.priceData, cached: true, error: null };
    }

    // Fetch fresh data from Yahoo Finance (v3/v4 API)
    const result = await withRetry(() =>
      yahooFinance.quote(upperTicker)
    );

    if (!result || !result.regularMarketPrice) {
      throw new Error(`No market data returned for ${upperTicker}`);
    }

    // Build a clean price object
    const priceData = {
      ticker: upperTicker,
      shortName: result.shortName || result.longName || upperTicker,
      longName: result.longName || result.shortName || upperTicker,
      currency: result.currency || 'INR',
      regularMarketPrice: result.regularMarketPrice,
      regularMarketChange: result.regularMarketChange || 0,
      regularMarketChangePercent: result.regularMarketChangePercent || 0,
      regularMarketPreviousClose: result.regularMarketPreviousClose || 0,
      regularMarketOpen: result.regularMarketOpen || 0,
      regularMarketDayHigh: result.regularMarketDayHigh || 0,
      regularMarketDayLow: result.regularMarketDayLow || 0,
      regularMarketVolume: result.regularMarketVolume || 0,
      marketCap: result.marketCap || null,
      fiftyTwoWeekHigh: result.fiftyTwoWeekHigh || null,
      fiftyTwoWeekLow: result.fiftyTwoWeekLow || null,
      trailingPE: result.trailingPE || null,
      exchange: result.exchange || '',
      quoteType: result.quoteType || '',
      marketState: result.marketState || 'CLOSED',
      fetchedAt: new Date().toISOString(),
    };

    // Update cache
    cache.priceData = priceData;
    cache.lastFetchedPrice = new Date();
    cache.isValid = true;
    cache.errorMessage = null;
    await cache.save();

    return { data: priceData, cached: false, error: null };
  } catch (err) {
    console.error(`[YahooFinance] Quote error for ${upperTicker}:`, err.message);

    // Return stale cache rather than nothing
    const cache = await StockCache.findOne({ ticker: upperTicker });
    if (cache?.priceData) {
      return { data: { ...cache.priceData, stale: true }, cached: true, error: 'Using cached data (refresh failed)' };
    }

    return {
      data: null,
      cached: false,
      error: `Data temporarily unavailable for ${upperTicker}. ${err.message}`,
    };
  }
}

// ─── Historical Data (with cache) ─────────────────────────────────────────────
async function getHistory(ticker, range = '1M') {
  const upperTicker = ticker.toUpperCase();
  const rangeConfig = RANGE_CONFIG[range] || RANGE_CONFIG['1M'];

  try {
    const cache = await getOrCreateCache(upperTicker);

    // Check cache freshness for this specific range
    const cachedHistory = cache.historicalData?.get(range);
    const lastFetched = cache.lastFetchedHistory?.get(range);
    if (
      cachedHistory &&
      lastFetched &&
      Date.now() - lastFetched.getTime() < HISTORY_TTL_MS
    ) {
      return { data: cachedHistory, cached: true, error: null };
    }

    // Fetch from Yahoo Finance (v3/v4 API - using chart instead of deprecated historical)
    const result = await withRetry(() =>
      yahooFinance.chart(upperTicker, {
        period1: rangeConfig.period1(),
        period2: new Date(),
        interval: rangeConfig.interval,
      })
    );

    if (!result || !result.quotes || result.quotes.length === 0) {
      throw new Error(`No historical data for ${upperTicker} in range ${range}`);
    }

    const historyData = result.quotes.map((item) => ({
      date: item.date,
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
      volume: item.volume,
    }));

    // Update cache
    if (!cache.historicalData) cache.historicalData = new Map();
    if (!cache.lastFetchedHistory) cache.lastFetchedHistory = new Map();
    cache.historicalData.set(range, historyData);
    cache.lastFetchedHistory.set(range, new Date());
    cache.markModified('historicalData');
    cache.markModified('lastFetchedHistory');
    await cache.save();

    return { data: historyData, cached: false, error: null };
  } catch (err) {
    console.error(`[YahooFinance] History error for ${upperTicker}:`, err.message);

    const cache = await StockCache.findOne({ ticker: upperTicker });
    const cachedHistory = cache?.historicalData?.get(range);
    if (cachedHistory) {
      return { data: cachedHistory, cached: true, error: 'Using cached data (refresh failed)' };
    }

    return {
      data: null,
      cached: false,
      error: `Historical data temporarily unavailable for ${upperTicker}.`,
    };
  }
}

// ─── Validate Ticker ──────────────────────────────────────────────────────────
async function validateTicker(ticker) {
  const upperTicker = ticker.toUpperCase();
  try {
    const result = await withRetry(() =>
      yahooFinance.quote(upperTicker)
    );

    if (!result || !result.regularMarketPrice) {
      return { valid: false, error: `No market data found for "${upperTicker}". Check the ticker symbol.` };
    }

    return {
      valid: true,
      ticker: upperTicker,
      shortName: result.shortName || result.longName || upperTicker,
      currency: result.currency || 'INR',
      exchange: result.exchange || '',
      currentPrice: result.regularMarketPrice,
    };
  } catch (err) {
    return {
      valid: false,
      error: `Invalid ticker "${upperTicker}": ${err.message}`,
    };
  }
}

// ─── Bulk Quotes (for portfolio) ───────────────────────────────────────────────
async function getBulkQuotes(tickers) {
  const results = {};
  await Promise.allSettled(
    tickers.map(async (ticker) => {
      const { data, error } = await getQuote(ticker);
      results[ticker] = data || { error, ticker };
    })
  );
  return results;
}

// ─── Search Stocks ─────────────────────────────────────────────────────────────
async function searchStocks(query) {
  try {
    const result = await withRetry(() =>
      yahooFinance.search(query, { quotesCount: 8, newsCount: 0 })
    );

    // Filter to only equity and ETFs, extract relevant fields
    const quotes = (result.quotes || [])
      .filter((q) => ['EQUITY', 'ETF', 'MUTUALFUND', 'INDEX'].includes(q.quoteType))
      .map((q) => ({
        ticker: q.symbol,
        shortName: q.shortname || q.longname || q.symbol,
        longName: q.longname || q.shortname || q.symbol,
        exchange: q.exchDisp || q.exchange || '',
        quoteType: q.quoteType || '',
      }));

    return { valid: true, data: quotes };
  } catch (err) {
    console.error(`[YahooFinance] Search error for query "${query}":`, err.message);
    return { valid: false, error: err.message };
  }
}

module.exports = { getQuote, getHistory, validateTicker, getBulkQuotes, searchStocks, RANGE_CONFIG };
