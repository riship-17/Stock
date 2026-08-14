const mongoose = require('mongoose');

const NewsCacheSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    items: {
      type: mongoose.Schema.Types.Mixed,
      default: [],
    },
    lastFetched: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('NewsCache', NewsCacheSchema);
