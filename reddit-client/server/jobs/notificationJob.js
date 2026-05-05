const cron = require("node-cron");
const Notification = require("../models/Notification");

// You'll need your User model and Transaction/Budget model here.
// Adjust the require paths to match your actual file structure.
const User = require("../models/User");
const BudgetData = require("../models/BudgetData");

// This job runs every day at 8:00 PM
// It checks each user's last transaction date.
// If they haven't logged anything in 24 hours, it creates a reminder notification.
function startNotificationJob() {
  cron.schedule("0 20 * * *", async () => {
    console.log("[Notification Job] Running daily expense reminder check...");

    try {
      const users = await User.find({});
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      for (const user of users) {
        const budgetDoc = await BudgetData.findOne({ userId: user._id });

        const hasRecentTransaction =
          budgetDoc &&
          Array.isArray(budgetDoc.transactions) &&
          budgetDoc.transactions.some((t) => {
            const txDate = new Date(t.date);
            return txDate >= oneDayAgo;
          });

        if (!hasRecentTransaction) {
          // Avoid duplicate reminders: check if we already sent one today
          const startOfDay = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
          );

          const alreadySent = await Notification.findOne({
            userId: user._id,
            type: "reminder",
            createdAt: { $gte: startOfDay },
          });

          if (!alreadySent) {
            await Notification.create({
              userId: user._id,
              message:
                "Don't forget to log your expenses today! Staying on top of your spending helps you reach your goals.",
              type: "reminder",
            });
            console.log(
              `[Notification Job] Reminder sent to user: ${user._id}`,
            );
          }
        }
      }

      console.log("[Notification Job] Done.");
    } catch (err) {
      console.error("[Notification Job] Error:", err);
    }
  });
}

module.exports = { startNotificationJob };
