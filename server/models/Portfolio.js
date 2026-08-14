const mongoose = require('mongoose');

const PortfolioSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Portfolio name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },
  },
  { timestamps: true }
);

PortfolioSchema.index({ userId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Portfolio', PortfolioSchema);
