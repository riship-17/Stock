const NewsCache = require('../models/NewsCache');

const NEWS_TTL_MS = 10 * 60 * 1000;

const MOCK_NEWS = [
  {
    id: 'mock-1',
    headline: 'Indian benchmarks end higher as banks and IT lead gains',
    summary:
      'Nifty 50 and Sensex closed positive led by financials and IT heavyweights, tracking firm global cues.',
    source: 'FinVault Desk',
    url: '#',
    image: '',
    related: 'NIFTY,BANKNIFTY,RELIANCE.NS,TCS.NS',
    datetime: Date.now() - 1000 * 60 * 20,
    category: 'general',
  },
  {
    id: 'mock-2',
    headline: 'Reliance Industries announces fresh capex push in green energy',
    summary:
      'The conglomerate reiterated its new-energy ambitions and guided for a multi-year investment cycle.',
    source: 'FinVault Desk',
    url: '#',
    image: '',
    related: 'RELIANCE.NS',
    datetime: Date.now() - 1000 * 60 * 60,
    category: 'general',
  },
  {
    id: 'mock-3',
    headline: 'TCS bags multi-year cloud transformation deal',
    summary:
      'IT major said the contract underscores demand resilience in the cloud and AI services segment.',
    source: 'FinVault Desk',
    url: '#',
    image: '',
    related: 'TCS.NS,INFY.NS',
    datetime: Date.now() - 1000 * 60 * 120,
    category: 'general',
  },
  {
    id: 'mock-4',
    headline: 'HDFC Bank Q2 net interest income in line with estimates',
    summary:
      'The lender posted steady asset quality, with margin guidance largely retained for the coming quarters.',
    source: 'FinVault Desk',
    url: '#',
    image: '',
    related: 'HDFCBANK.NS,ICICIBANK.NS',
    datetime: Date.now() - 1000 * 60 * 200,
    category: 'general',
  },
  {
    id: 'mock-5',
    headline: 'Tata Motors sees strong EV demand across passenger segment',
    summary:
      'The automaker flagged continued EV momentum and capacity additions for the fiscal year.',
    source: 'FinVault Desk',
    url: '#',
    image: '',
    related: 'TATAMOTORS.NS,M&M.NS',
    datetime: Date.now() - 1000 * 60 * 320,
    category: 'general',
  },
];

async function fetchFinnhub(category) {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) return null;
  const url = `https://finnhub.io/api/v1/news?category=${encodeURIComponent(
    category || 'general'
  )}&token=${key}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Finnhub news HTTP ${resp.status}`);
  const raw = await resp.json();
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 30).map((n) => ({
    id: n.id,
    headline: n.headline,
    summary: n.summary,
    source: n.source,
    url: n.url,
    image: n.image,
    related: n.related || '',
    datetime: n.datetime ? n.datetime * 1000 : Date.now(),
    category: n.category || 'general',
  }));
}

async function getNews({ ticker, category } = {}) {
  const cacheKey = `general:${category || 'general'}`;
  let items = null;

  try {
    const cached = await NewsCache.findOne({ key: cacheKey });
    if (cached && cached.lastFetched && Date.now() - cached.lastFetched.getTime() < NEWS_TTL_MS) {
      items = cached.items;
    } else {
      let fresh = null;
      try {
        fresh = await fetchFinnhub(category || 'general');
      } catch (err) {
        console.error('[News] Finnhub fetch failed:', err.message);
      }
      if (!fresh) fresh = MOCK_NEWS;

      if (cached) {
        cached.items = fresh;
        cached.lastFetched = new Date();
        await cached.save();
      } else {
        await NewsCache.create({
          key: cacheKey,
          items: fresh,
          lastFetched: new Date(),
        });
      }
      items = fresh;
    }
  } catch (err) {
    console.error('[News] Service error:', err.message);
    items = MOCK_NEWS;
  }

  let filtered = items || [];
  if (ticker) {
    const t = ticker.toUpperCase();
    filtered = filtered.filter((n) => {
      const hay = `${n.headline || ''} ${n.summary || ''} ${n.related || ''}`.toUpperCase();
      return hay.includes(t.replace('.NS', '')) || hay.includes(t);
    });
  }

  return filtered.map((n) => ({
    id: n.id,
    headline: n.headline,
    summary: n.summary,
    source: n.source,
    url: n.url,
    image: n.image,
    related: n.related,
    datetime: n.datetime,
    publishedAt: new Date(n.datetime).toISOString(),
  }));
}

module.exports = { getNews };
