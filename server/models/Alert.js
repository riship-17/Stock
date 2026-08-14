const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema(
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
    condition: {
      type: String,
      enum: ['above', 'below'],
      required: true,
    },
    targetPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    channel: {
      type: String,
      enum: ['inapp', 'email'],
      default: 'inapp',
    },
    active: {
      type: Boolean,
      default: true,
    },
    triggeredAt: {
      type: Date,
      default: null,
    },
    note: {
      type: String,
      default: '',
      maxlength: 200,
    },
  },
  { timestamps: true }
);

AlertSchema.index({ userId: 1, ticker: 1 });

module.exports = mongoose.model('Alert', AlertSchema);
