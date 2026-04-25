const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    title: String,
    amount: Number,
    date: String,
    category: {
      type: String,
      default: "Other", // ← remove the enum entirely
    },
    type: String,
    tags: { type: [String], default: [] },
    isRecurring: { type: Boolean, default: false },
  },
  { _id: true },
);

const depositSchema = new mongoose.Schema(
  {
    amount: Number,
    note: String,
    date: String,
  },
  { _id: false },
);

const budgetSchema = new mongoose.Schema(
  {
    category: String,
    limit: Number,
    targetDate: String,
    period: { type: String, default: "monthly" },
    deposits: { type: [depositSchema], default: [] },
  },
  { _id: true },
);

const savingsGoalSchema = new mongoose.Schema(
  {
    title: String,
    target: Number,
    saved: Number,
  },
  { _id: true },
);

const budgetDataSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    currentBalance: {
      type: Number,
      default: 0,
    },
    transactions: {
      type: [transactionSchema],
      default: [],
    },
    budgets: {
      type: [budgetSchema],
      default: [],
    },
    savingsGoals: {
      type: [savingsGoalSchema],
      default: [],
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("BudgetData", budgetDataSchema);
