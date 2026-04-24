import React, { useMemo } from "react";

function currency(amount) {
  return `₱${Math.round(Number(amount || 0))}`;
}

export default function InsightsTab({
  transactions,
  budgets,
  categoryTotals,
  currentBalance,
}) {
  const insights = useMemo(() => {
    const result = [];
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const expenses = transactions.filter((t) => t.type === "expense");

    // This month vs last month per category
    const thisMonthByCategory = {};
    const lastMonthByCategory = {};

    expenses.forEach((t) => {
      const d = new Date(t.date);
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        thisMonthByCategory[t.category] =
          (thisMonthByCategory[t.category] || 0) + t.amount;
      }
      if (d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear) {
        lastMonthByCategory[t.category] =
          (lastMonthByCategory[t.category] || 0) + t.amount;
      }
    });

    // Spending increase/decrease per category
    Object.keys(thisMonthByCategory).forEach((cat) => {
      const thisAmt = thisMonthByCategory[cat];
      const lastAmt = lastMonthByCategory[cat] || 0;
      if (lastAmt > 0) {
        const diff = ((thisAmt - lastAmt) / lastAmt) * 100;
        if (diff >= 20) {
          result.push({
            type: "warning",
            text: `You spent ${Math.round(diff)}% more on ${cat} this month than last month.`,
          });
        } else if (diff <= -20) {
          result.push({
            type: "success",
            text: `Great job! You spent ${Math.abs(Math.round(diff))}% less on ${cat} compared to last month.`,
          });
        }
      }
    });

    // Spending category this month
    const topCategory = Object.entries(thisMonthByCategory).sort(
      (a, b) => b[1] - a[1],
    )[0];
    if (topCategory) {
      result.push({
        type: "info",
        text: `Your top spending category this month is ${topCategory[0]} at ${currency(topCategory[1])}.`,
      });
    }

    // Budget overspend warning
    budgets.forEach((budget) => {
      const spent = categoryTotals[budget.category] || 0;
      const percentage = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;
      if (percentage >= 100) {
        result.push({
          type: "danger",
          text: `You've exceeded your ${budget.category} budget of ${currency(budget.limit)}!`,
        });
      } else if (percentage >= 80) {
        result.push({
          type: "warning",
          text: `You're at ${Math.round(percentage)}% of your ${budget.category} budget. Almost at the limit!`,
        });
      }
    });

    // Estimated end of month balance
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const dayOfMonth = now.getDate();
    const thisMonthExpenses = expenses
      .filter((t) => {
        const d = new Date(t.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, t) => sum + t.amount, 0);

    if (dayOfMonth > 0 && thisMonthExpenses > 0) {
      const dailyAvg = thisMonthExpenses / dayOfMonth;
      const remainingDays = daysInMonth - dayOfMonth;
      const projectedAdditional = dailyAvg * remainingDays;
      const estimatedBalance = currentBalance - projectedAdditional;
      result.push({
        type: "info",
        text: `Estimated end-of-month balance: ${currency(Math.round(estimatedBalance))} based on your current spending rate.`,
      });
    }

    // Unusual transaction
    const thisMonthTotal = Object.values(thisMonthByCategory).reduce(
      (a, b) => a + b,
      0,
    );
    expenses.forEach((t) => {
      const d = new Date(t.date);
      if (
        d.getMonth() === currentMonth &&
        d.getFullYear() === currentYear &&
        thisMonthTotal > 0 &&
        t.amount / thisMonthTotal > 0.5
      ) {
        result.push({
          type: "warning",
          text: `Unusual transaction detected: "${t.title}" accounts for over 50% of your monthly expenses.`,
        });
      }
    });

    // No transactions yet
    if (transactions.length === 0) {
      result.push({
        type: "info",
        text: "No transactions yet. Start adding your income and expenses to get insights!",
      });
    }

    return result;
  }, [transactions, budgets, categoryTotals, currentBalance]);

  const iconMap = {
    info: "💡",
    warning: "⚠️",
    danger: "🚨",
    success: "✅",
  };

  const colorMap = {
    info: "insight-info",
    warning: "insight-warning",
    danger: "insight-danger",
    success: "insight-success",
  };

  return (
    <section className="panel-card">
      <h2>Smart Insights</h2>
      {insights.length === 0 ? (
        <p className="empty-text">
          No insights available yet. Add more transactions to get started
        </p>
      ) : (
        <div className="insights-list">
          {insights.map((insight, index) => (
            <div
              key={index}
              className={`insight-card ${colorMap[insight.type]}`}
            >
              <span className="insight-icon">{iconMap[insight.type]}</span>
              <p className="insight-text">{insight.text}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
