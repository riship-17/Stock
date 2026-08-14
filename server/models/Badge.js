const mongoose = require('mongoose');

const BadgeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        'first_trade',
        'ten_trades',
        'fifty_trades',
        'profit_master',
        'whale',
        'diversified',
        'diamond_hands',
      ],
    },
    awardedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

BadgeSchema.index({ userId: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('Badge', BadgeSchema);
