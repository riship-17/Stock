const mongoose = require('mongoose');

const WatchlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    ticker: {
      type: String,
      required: [true, 'Ticker is required'],
      uppercase: true,
      trim: true,
    },
    companyName: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
      maxlength: 500,
    },
    targetPrice: {
      type: Number,
      default: null,
    },
    addedDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

WatchlistSchema.index({ userId: 1, ticker: 1 }, { unique: true });

module.exports = mongoose.model('Watchlist', WatchlistSchema);
