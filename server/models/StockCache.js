const mongoose = require('mongoose');

// StockCache stores fetched price and historical data per ticker.
// This avoids hammering yahoo-finance2 on every request.
// DISCLAIMER: Data sourced from Yahoo Finance (unofficial, delayed).
// Suitable for portfolio tracking and analysis ONLY — NOT for algorithmic trading.

const StockCacheSchema = new mongoose.Schema(
  {
    ticker: {
      type: String,
      required: true,
      uppercase: true,
      unique: true,
      trim: true,
    },
    // Snapshot from yahoo-finance2 .quote()
    priceData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    lastFetchedPrice: {
      type: Date,
      default: null,
    },
    // Keyed by range string (e.g. "1mo", "1y")
    historicalData: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
    lastFetchedHistory: {
      type: Map,
      of: Date,
      default: {},
    },
    // Store validation errors so we don't keep retrying bad tickers
    isValid: {
      type: Boolean,
      default: true,
    },
    errorMessage: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('StockCache', StockCacheSchema);
