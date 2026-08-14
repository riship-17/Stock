const mongoose = require('mongoose');

const HoldingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    portfolioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Portfolio',
      required: true,
    },
    ticker: {
      type: String,
      required: [true, 'Ticker symbol is required'],
      uppercase: true,
      trim: true,
    },
    companyName: {
      type: String,
      default: '',
    },
    currency: {
      type: String,
      default: 'INR',
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0.001, 'Quantity must be positive'],
    },
    buyPrice: {
      type: Number,
      required: [true, 'Buy price is required'],
      min: [0, 'Buy price cannot be negative'],
    },
    buyDate: {
      type: Date,
      required: [true, 'Buy date is required'],
    },
    sector: {
      type: String,
      default: 'Unknown',
    },
    notes: {
      type: String,
      default: '',
      maxlength: 500,
    },
  },
  { timestamps: true }
);

// Compound index
HoldingSchema.index({ userId: 1, portfolioId: 1, ticker: 1 });

module.exports = mongoose.model('Holding', HoldingSchema);
