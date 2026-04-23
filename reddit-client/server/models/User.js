const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    mobileNumber: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: String,
      required: true,
      trim: true,
    },
    place: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    currentBalance: {
      type: Number,
      default: 0,
    },
    transactions: {
      type: Array,
      default: [],
    },
    budgets: {
      type: Array,
      default: [],
    },
    savingsGoals: {
      type: Array,
      default: [],
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
