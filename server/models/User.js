const mongoose = require('mongoose');

const DEFAULT_STARTING_CASH = 1000000; // ₹10,00,000 paper-trading balance

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    startingCash: {
      type: Number,
      default: DEFAULT_STARTING_CASH,
      min: 0,
    },
    virtualCash: {
      type: Number,
      default: DEFAULT_STARTING_CASH,
      min: 0,
    },
  },
  { timestamps: true }
);

// Index for fast login lookups
UserSchema.index({ email: 1 });

module.exports = mongoose.model('User', UserSchema);
