require('dotenv').config({ override: true });
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

// ─── Connect Database ─────────────────────────────────────────────────────────
connectDB();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Request Logger (dev) ─────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// ─── Routes ───────────────────────────────────────────────────────────────────
const auth = require('./middleware/auth');

app.use('/api/auth', require('./routes/auth'));
app.use('/api/account', auth, require('./routes/account'));
app.use('/api/trade', auth, require('./routes/trade'));
app.use('/api/portfolios', auth, require('./routes/portfolios'));
app.use('/api/holdings', auth, require('./routes/holdings'));
app.use('/api/watchlist', auth, require('./routes/watchlist'));
app.use('/api/transactions', auth, require('./routes/transactions'));
app.use('/api/stocks', auth, require('./routes/stocks'));
app.use('/api/dashboard', auth, require('./routes/dashboard'));
app.use('/api/screener', auth, require('./routes/screener'));
app.use('/api/alerts', auth, require('./routes/alerts'));
app.use('/api/news', auth, require('./routes/news'));
app.use('/api/leaderboard', auth, require('./routes/leaderboard'));
app.use('/api/badges', auth, require('./routes/badges'));
app.use('/api/tax', auth, require('./routes/tax'));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route ${req.method} ${req.path} not found` });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[Server Error]', err);
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`🚀 Stock Tracker API running at http://localhost:${PORT}`);
});
