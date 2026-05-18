const cron = require("node-cron");
const Notification = require("../models/Notification");
const User = require("../models/User");
const BudgetData = require("../models/BudgetData");

// Runs every day at 8:00 AM
// Checks each user's subscriptions and sends a notification
// if any subscription renews tomorrow (1 day away)
function startSubscriptionReminderJob() {
  cron.schedule("0 8 * * *", async () => {
    console.log(
      "[Subscription Reminder Job] Running daily subscription check...",
    );

    try {
      const users = await User.find({});
      const now = new Date();

      // Build tomorrow's date string in YYYY-MM-DD
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split("T")[0];

      const startOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      );

      for (const user of users) {
        const budgetDoc = await BudgetData.findOne({ userId: user._id });

        if (
          !budgetDoc ||
          !Array.isArray(budgetDoc.subscriptions) ||
          budgetDoc.subscriptions.length === 0
        ) {
          continue;
        }

        // Find subscriptions renewing tomorrow
        const dueTomorrow = budgetDoc.subscriptions.filter(
          (s) => s.isActive && s.renewalDate === tomorrowStr,
        );

        for (const sub of dueTomorrow) {
          // Avoid duplicate reminders for the same subscription today
          const alreadySent = await Notification.findOne({
            userId: user._id,
            type: "reminder",
            message: { $regex: sub.name, $options: "i" },
            createdAt: { $gte: startOfDay },
          });

          if (!alreadySent) {
            await Notification.create({
              userId: user._id,
              message: `Reminder: Your ${sub.name} subscription (₱${Number(sub.amount).toLocaleString()}) renews tomorrow on ${sub.renewalDate}.`,
              type: "reminder",
            });
            console.log(
              `[Subscription Reminder Job] Reminder sent to user ${user._id} for ${sub.name}`,
            );
          }
        }
      }

      console.log("[Subscription Reminder Job] Done.");
    } catch (err) {
      console.error("[Subscription Reminder Job] Error:", err);
    }
  });
}

module.exports = { startSubscriptionReminderJob };
