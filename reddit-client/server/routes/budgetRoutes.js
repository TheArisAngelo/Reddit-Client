const express = require("express");
const BudgetData = require("../models/BudgetData");
const authMiddleware = require("../middleware/authMiddleware");
const cache = require("../middleware/cache");

const router = express.Router();

const CACHE_KEY = "/api/budget";

// Helper
const userCacheKey = (req) => `${req.user.userId}:${CACHE_KEY}`;

// Helper: find a transaction subdocument by either Mongo's _id or the
// client-generated `id` (Date.now()) field, since transactions created
// via POST /transactions carry both.
function findTransaction(budgetData, id) {
  return (
    budgetData.transactions.id(id) ||
    budgetData.transactions.find((t) => String(t.id) === String(id))
  );
}

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

    const budgetData = await BudgetData.findOne({ userId: req.user.userId });
    if (!budgetData) {
      return res.status(404).json({ message: "Budget data not found" });
    }

    budgetData.currentBalance =
      (budgetData.currentBalance || 0) + Number(addBalance);
    await budgetData.save();

    cache.del(userCacheKey(req)); // ✅
    res.json(budgetData);
  } catch (error) {
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

    cache.del(userCacheKey(req)); // ✅
    res.json(budgetData);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

router.put("/transactions/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const budgetData = await BudgetData.findOne({ userId: req.user.userId });
    if (!budgetData) {
      return res.status(404).json({ message: "Budget data not found" });
    }

    const transaction = findTransaction(budgetData, id);
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    // Reverse the old transaction's effect on the balance before applying
    // the edit, since amount/type may have changed.
    if (transaction.type === "income") {
      budgetData.currentBalance -= transaction.amount;
    } else {
      budgetData.currentBalance += transaction.amount;
    }

    transaction.title = updates.title ?? transaction.title;
    transaction.amount = updates.amount ?? transaction.amount;
    transaction.date = updates.date ?? transaction.date;
    transaction.category = updates.category ?? transaction.category;
    transaction.type = updates.type ?? transaction.type;
    transaction.tags = updates.tags ?? transaction.tags;
    transaction.isRecurring = updates.isRecurring ?? transaction.isRecurring;

    // Apply the updated transaction's effect on the balance.
    if (transaction.type === "income") {
      budgetData.currentBalance += transaction.amount;
    } else {
      budgetData.currentBalance -= transaction.amount;
    }

    await budgetData.save();

    cache.del(userCacheKey(req)); // ✅
    res.json(budgetData);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
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

    cache.del(userCacheKey(req)); // ✅
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

    cache.del(userCacheKey(req)); // ✅
    res.json(budgetData);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/savings", authMiddleware, async (req, res) => {
  try {
    const { title, target, saved, deadline, category } = req.body;

    if (!title || !target || target <= 0) {
      return res
        .status(400)
        .json({ message: "Title and valid target amount are required" });
    }

    const budgetData = await BudgetData.findOne({ userId: req.user.userId });
    if (!budgetData) {
      return res.status(404).json({ message: "Budget data not found" });
    }

    budgetData.savingsGoals.unshift({
      title,
      target: Number(target),
      saved: Number(saved) || 0,
      deadline: deadline || null,
      category: category || "General",
    });

    await budgetData.save();

    cache.del(userCacheKey(req)); // ✅
    res.json(budgetData);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/savings/:goalId/contribute", authMiddleware, async (req, res) => {
  try {
    const { goalId } = req.params;
    const { amount } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ message: "A valid amount is required" });
    }

    const budgetData = await BudgetData.findOne({ userId: req.user.userId });
    if (!budgetData) {
      return res.status(404).json({ message: "Budget data not found" });
    }

    const goal = budgetData.savingsGoals.id(goalId);
    if (!goal) {
      return res.status(404).json({ message: "Savings goal not found" });
    }

    goal.saved = Math.min((goal.saved || 0) + Number(amount), goal.target);

    await budgetData.save();

    cache.del(userCacheKey(req)); // ✅
    res.json(budgetData);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/savings/:goalId", authMiddleware, async (req, res) => {
  try {
    const { goalId } = req.params;

    const budgetData = await BudgetData.findOne({ userId: req.user.userId });
    if (!budgetData) {
      return res.status(404).json({ message: "Budget data not found" });
    }

    const goal = budgetData.savingsGoals.id(goalId);
    if (!goal) {
      return res.status(404).json({ message: "Savings goal not found" });
    }

    goal.deleteOne();
    await budgetData.save();

    cache.del(userCacheKey(req)); // ✅
    res.json(budgetData);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/subscriptions", authMiddleware, async (req, res) => {
  try {
    const budgetData = await BudgetData.findOne({ userId: req.user.userId });
    if (!budgetData) return res.status(404).json({ message: "Not found" });
    res.json({ subscriptions: budgetData.subscriptions });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/subscriptions", authMiddleware, async (req, res) => {
  try {
    const { name, amount, billingCycle, renewalDate, category } = req.body;
    if (!name || !amount || !renewalDate) {
      return res
        .status(400)
        .json({ message: "Name, amount, and renewal date are required" });
    }

    const budgetData = await BudgetData.findOne({ userId: req.user.userId });
    if (!budgetData) return res.status(404).json({ message: "Not found" });

    budgetData.subscriptions.unshift({
      name,
      amount: Number(amount),
      billingCycle,
      renewalDate,
      category,
    });

    await budgetData.save();
    cache.del(userCacheKey(req)); // ✅
    res.json({ subscriptions: budgetData.subscriptions });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

router.delete("/subscriptions/:id", authMiddleware, async (req, res) => {
  try {
    const budgetData = await BudgetData.findOne({ userId: req.user.userId });
    if (!budgetData) return res.status(404).json({ message: "Not found" });

    const sub = budgetData.subscriptions.id(req.params.id);
    if (!sub) {
      return res.status(404).json({ message: "Subscription not found" }); // ✅ also fixed a syntax error here
    }

    sub.deleteOne();
    await budgetData.save();
    cache.del(userCacheKey(req)); // ✅
    res.json({ subscriptions: budgetData.subscriptions });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.patch("/subscriptions/:id", authMiddleware, async (req, res) => {
  try {
    const budgetData = await BudgetData.findOne({ userId: req.user.userId });
    if (!budgetData) return res.status(404).json({ message: "Not found" });

    const sub = budgetData.subscriptions.id(req.params.id);
    if (!sub) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    sub.renewalDate = req.body.renewalDate;
    await budgetData.save();
    cache.del(userCacheKey(req));
    res.json({ subscriptions: budgetData.subscriptions });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
