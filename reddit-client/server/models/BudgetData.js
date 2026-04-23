const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    title: String,
    amount: Number,
    date: String,
    category: String,
    type: String,
  },
  { _id: true },
);

const budgetSchema = new mongoose.Schema(
  {
    category: String,
    limit: Number,
    targetDate: String,
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
