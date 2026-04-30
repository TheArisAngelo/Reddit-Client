const express = require("express");
const BudgetData = require("../models/BudgetData");
const authMiddleware = require("../middleware/authMiddleware");
const cache = require("../middleware/cache");

const router = express.Router();

const CACHE_KEY = "/api/budget";

router.get("/", authMiddleware, cache, async (req, res) => {
  try {
    let budgetData = await BudgetData.findOne({ userId: req.user.userId });

    if (!budgetData) {
      budgetData = await BudgetData.create({
        userId: req.user.userId,
        currentBalance: 0,
        transactions: [],
        budgets: [],
        savingsGoals: [],
      });
    }

    res.json(budgetData);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/balance", authMiddleware, async (req, res) => {
  try {
    const { addBalance } = req.body;
    console.log("addBalance received:", addBalance, typeof addBalance);

    const budgetData = await BudgetData.findOne({ userId: req.user.userId });

    if (!budgetData) {
      return res.status(404).json({ message: "Budget data not found" });
    }

    budgetData.currentBalance =
      (budgetData.currentBalance || 0) + Number(addBalance);
    await budgetData.save();

    cache.del(CACHE_KEY);
    res.json(budgetData);
  } catch (error) {
    console.error("Balance update error:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

router.post("/transactions", authMiddleware, async (req, res) => {
  try {
    const newTransaction = req.body;

    const budgetData = await BudgetData.findOne({ userId: req.user.userId });

    if (!budgetData) {
      return res.status(404).json({ message: "Budget data not found" });
    }

    budgetData.transactions.unshift(newTransaction);

    if (newTransaction.type === "income") {
      budgetData.currentBalance += newTransaction.amount;
    } else {
      budgetData.currentBalance -= newTransaction.amount;
    }

    await budgetData.save();

    cache.del(CACHE_KEY);
    res.json(budgetData);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

router.post("/budgets", authMiddleware, async (req, res) => {
  try {
    console.log("Budget received:", req.body);
    const newBudget = req.body;

    const budgetData = await BudgetData.findOne({ userId: req.user.userId });

    if (!budgetData) {
      return res.status(404).json({ message: "Budget data not found" });
    }

    budgetData.budgets.unshift(newBudget);
    await budgetData.save();

    cache.del(CACHE_KEY);
    res.json(budgetData);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/budgets/:budgetId/deposits", authMiddleware, async (req, res) => {
  try {
    const { budgetId } = req.params;
    const { amount, note, date } = req.body;

    const budgetData = await BudgetData.findOne({ userId: req.user.userId });

    if (!budgetData) {
      return res.status(404).json({ message: "Budget data not found" });
    }

    const budget = budgetData.budgets.id(budgetId);

    if (!budget) {
      return res.status(404).json({ message: "Budget not found" });
    }

    budget.deposits.push({ amount, note, date });
    await budgetData.save();

    cache.del(CACHE_KEY);
    res.json(budgetData);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
