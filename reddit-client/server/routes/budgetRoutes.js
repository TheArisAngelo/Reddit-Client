const express = require("express");
const BudgetData = require("../models/BudgetData");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  try {
    const budgetData = await BudgetData.findOne({ userId: req.user.userId });

    if (!budgetData) {
      return res.status(404).json({ message: "Budget data not found" });
    }

    res.json(budgetData);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/balance", authMiddleware, async (req, res) => {
  try {
    const { currentBalance } = req.body;

    const updated = await BudgetData.findOneAndUpdate(
      { userId: req.user.userId },
      { currentBalance },
      { new: true },
    );

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
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

    res.json(budgetData);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

router.post("/budgets", authMiddleware, async (req, res) => {
  try {
    const newBudget = req.body;

    const budgetData = await BudgetData.findOne({ userId: req.user.userId });

    if (!budgetData) {
      return res.status(404).json({ message: "Budget data not found" });
    }

    budgetData.budgets.unshift(newBudget);
    await budgetData.save();

    res.json(budgetData);
  } catch (error) {
    res.status(500)({ message: "Server error" });
  }
});

module.exports = router;
