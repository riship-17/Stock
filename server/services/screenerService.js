const { getBulkQuotes } = require('./yahooFinanceService');

const SCREENER_UNIVERSE = [
  'RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'ICICIBANK.NS',
  'HINDUNILVR.NS', 'SBIN.NS', 'BHARTIARTL.NS', 'ITC.NS', 'KOTAKBANK.NS',
  'LT.NS', 'AXISBANK.NS', 'MARUTI.NS', 'ASIANPAINT.NS', 'WIPRO.NS',
  'HCLTECH.NS', 'SUNPHARMA.NS', 'ULTRACEMCO.NS', 'TITAN.NS', 'NESTLEIND.NS',
  'BAJFINANCE.NS', 'TATAMOTORS.NS', 'TATASTEEL.NS', 'ADANIENT.NS', 'ADANIPORTS.NS',
  'JSWSTEEL.NS', 'HINDALCO.NS', 'COALINDIA.NS', 'ONGC.NS', 'NTPC.NS',
  'POWERGRID.NS', 'M&M.NS', 'MARICO.NS', 'DABUR.NS', 'BRITANNIA.NS',
  'CIPLA.NS', 'DRREDDY.NS', 'GRASIM.NS', 'SHREECEM.NS', 'EICHERMOT.NS',
  'TECHM.NS', 'DIVISLAB.NS', 'HEROMOTOCO.NS', 'BAJAJFINSV.NS', 'BPCL.NS',
];

function num(v) {
  if (v == null || v === '' || isNaN(v)) return null;
  return Number(v);
}

async function screen(filters = {}) {
  const quotesMap = await getBulkQuotes(SCREENER_UNIVERSE);

  const rows = Object.values(quotesMap)
    .filter((q) => q && q.regularMarketPrice && !q.error)
    .map((q) => {
      const high52 = q.fiftyTwoWeekHigh || null;
      const low52 = q.fiftyTwoWeekLow || null;
      const pctFrom52High =
        high52 && high52 > 0
          ? ((q.regularMarketPrice - high52) / high52) * 100
          : null;
      const pctFrom52Low =
        low52 && low52 > 0
          ? ((q.regularMarketPrice - low52) / low52) * 100
          : null;
      return {
        ticker: q.ticker,
        companyName: q.longName || q.shortName || q.ticker,
        price: q.regularMarketPrice,
        changePercent: q.regularMarketChangePercent || 0,
        change: q.regularMarketChange || 0,
        volume: q.regularMarketVolume || 0,
        marketCap: q.marketCap || null,
        trailingPE: q.trailingPE || null,
        fiftyTwoWeekHigh: high52,
        fiftyTwoWeekLow: low52,
        pctFrom52High,
        pctFrom52Low,
        currency: q.currency || 'INR',
        exchange: q.exchange || '',
      };
    });

  const f = {
    peMin: num(filters.peMin),
    peMax: num(filters.peMax),
    volumeMin: num(filters.volumeMin),
    volumeMax: num(filters.volumeMax),
    marketCapMin: num(filters.marketCapMin),
    marketCapMax: num(filters.marketCapMax),
    priceMin: num(filters.priceMin),
    priceMax: num(filters.priceMax),
    nearHighPercent: num(filters.nearHighPercent),
    changeMin: num(filters.changeMin),
  };

  const filtered = rows.filter((r) => {
    if (r.trailingPE != null) {
      if (f.peMin != null && r.trailingPE < f.peMin) return false;
      if (f.peMax != null && r.trailingPE > f.peMax) return false;
    } else if (f.peMin != null || f.peMax != null) {
      return false;
    }
    if (f.volumeMin != null && r.volume < f.volumeMin) return false;
    if (f.volumeMax != null && r.volume > f.volumeMax) return false;
    if (r.marketCap != null) {
      if (f.marketCapMin != null && r.marketCap < f.marketCapMin) return false;
      if (f.marketCapMax != null && r.marketCap > f.marketCapMax) return false;
    }
    if (f.priceMin != null && r.price < f.priceMin) return false;
    if (f.priceMax != null && r.price > f.priceMax) return false;
    if (f.changeMin != null && r.changePercent < f.changeMin) return false;
    if (
      f.nearHighPercent != null &&
      (r.pctFrom52High == null || r.pctFrom52High > f.nearHighPercent)
    ) {
      return false;
    }
    return true;
  });

  const sortBy = filters.sortBy || 'marketCap';
  const sortDir = filters.sortDir === 'asc' ? 1 : -1;
  const allowed = [
    'marketCap', 'price', 'trailingPE', 'volume', 'changePercent',
    'pctFrom52High', 'pctFrom52Low',
  ];
  const sortKey = allowed.includes(sortBy) ? sortBy : 'marketCap';

  filtered.sort((a, b) => {
    const av = a[sortKey] ?? -Infinity;
    const bv = b[sortKey] ?? -Infinity;
    return (av - bv) * sortDir;
  });

  const limit = Math.min(parseInt(filters.limit) || 50, 100);
  return filtered.slice(0, limit);
}

module.exports = { screen, SCREENER_UNIVERSE };
