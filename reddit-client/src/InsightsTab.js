import React, { useMemo } from "react";

function currency(amount) {
  return `₱${Math.round(Number(amount || 0))}`;
}

const PERIOD_LABELS = {
  week: "this week",
  month: "this month",
  year: "this year",
  all: "overall",
};

export default function InsightsTab({
  transactions,
  budgets,
  categoryTotals,
  currentBalance,
  period = "month",
}) {
  const insights = useMemo(() => {
    const result = [];
    const periodLabel = PERIOD_LABELS[period] || "this period";

    const expenses = transactions.filter((t) => t.type === "expense");
    const incomes = transactions.filter((t) => t.type === "income");

    const expensesByCategory = {};
    expenses.forEach((t) => {
      expensesByCategory[t.category] =
        (expensesByCategory[t.category] || 0) + t.amount;
    });

    const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
    const totalIncome = incomes.reduce((sum, t) => sum + t.amount, 0);

    if (transactions.length === 0) {
      result.push({
        type: "info",
        text: `No transactions found for ${periodLabel}. Try selecting a different period or add new transactions.`,
      });
      return result;
    }

    const topCategoryEntries = Object.entries(expensesByCategory).sort(
      (a, b) => b[1] - a[1],
    );
    if (topCategoryEntries.length > 0) {
      const [catName, catAmount] = topCategoryEntries[0];
      result.push({
        type: "info",
        text: `Your top spending category ${periodLabel} is ${catName} at ${currency(catAmount)}.`,
      });
    }

    if (currentBalance > 0 && totalExpenses > 0) {
      const savingsRate = Math.max(
        0,
        ((currentBalance - totalExpenses) / currentBalance) * 100,
      );
      if (savingsRate >= 50) {
        result.push({
          type: "success",
          text: `Great! You're saving ${Math.round(savingsRate)}% of your income ${periodLabel}.`,
        });
      } else {
        result.push({
          type: "warning",
          text: `You're only saving ${Math.round(savingsRate)}% of your income ${periodLabel}. Try to reduce expenses.`,
        });
      }
    }

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

    if (totalExpenses > 0) {
      expenses.forEach((t) => {
        if (t.amount / totalExpenses > 0.5) {
          result.push({
            type: "warning",
            text: `Unusual transaction detected: "${t.title}" accounts for over 50% of your expenses ${periodLabel}.`,
          });
        }
      });
    }

    if (totalIncome > 0 && totalExpenses > totalIncome) {
      result.push({
        type: "danger",
        text: `You've spent ${currency(totalExpenses - totalIncome)} more than you earned ${periodLabel}. Review your expenses!`,
      });
    }

    return result;
  }, [transactions, budgets, categoryTotals, currentBalance, period]);

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
          No insights available yet. Add more transactions to get started.
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
