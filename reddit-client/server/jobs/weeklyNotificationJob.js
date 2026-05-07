const cron = require("node-cron");
const Notification = require("../models/Notification");
const BudgetData = require("../models/BudgetData");

cron.schedule("0 8 * * 1", async () => {
  console.log("[WeeklyJob] Running weekly spending summary...");

  try {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);

    const allBudgetData = await BudgetData.find({});

    const notifications = [];

    for (const budgetData of allBudgetData) {
      const userId = budgetData.userId;

      const weeklyExpenses = budgetData.transactions.filter((t) => {
        const [year, month, day] = t.date.split("-").map(Number);
        const txDate = new Date(year, month - 1, day);
        return t.type === "expense" && txDate >= weekAgo && txDate <= now;
      });

      if (weeklyExpenses.length === 0) continue;

      const total = weeklyExpenses.reduce((sum, t) => sum + t.amount, 0);

      const byCategory = weeklyExpenses.reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {});

      const topCategory = Object.entries(byCategory).sort(
        (a, b) => b[1] - a[1],
      )[0];

      notifications.push({
        userId,
        message: `📊 Last week you spent ₱${Math.round(total)} across ${weeklyExpenses.length} transactions. Biggest category: ${topCategory[0]} (₱${Math.round(topCategory[1])}).`,
        type: "info",
        read: false,
      });
    }

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
      console.log(`[WeeklyJob] Created ${notifications.length} notifications.`);
    } else {
      console.log("[WeeklyJob] No spending data found for last week.");
    }
  } catch (err) {
    console.error("[WeeklyJob] Failed:", err);
  }
});
console.log("[WeeklyJob] Weekly spending summary job scheduled (Mondays 8AM).");
