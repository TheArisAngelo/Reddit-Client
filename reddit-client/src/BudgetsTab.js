import React, { useMemo, useState } from "react";

// Helpers

function currency(amount) {
  return `₱${Math.round(Number(amount || 0))}`;
}

function getStatus(percentage) {
  if (percentage >= 100) return "completed";
  if (percentage >= 80) return "danger";
  if (percentage >= 50) return "warning";
  return "good";
}

const STATUS_CONFIG = {
  good: { color: "var(--success)", label: "On Track", icon: "✅" },
  warning: { color: "var(--warning)", label: "Halfway", icon: "⚠️" },
  danger: { color: "var(--danger)", label: "Near Limit", icon: "🔴" },
  completed: { color: "#a78bfa", label: "Completed", icon: "🏆" },
};

const PERIOD_LABELS = {
  weekly: "Weekly",
  monthly: "Monthly",
  custom: "Custom",
};

// Alert Banner

function AlertBanner({ budgets }) {
  const alerts = useMemo(() => {
    return budgets
      .map((b) => {
        const deposited = (b.deposits || []).reduce((s, d) => s + d.amount, 0);
        const pct = b.limit > 0 ? (deposited / b.limit) * 100 : 0;
        return { ...b, deposited, pct };
      })
      .filter((b) => b.pct >= 80 && b.pct < 100)
      .sort((a, b) => b.pct - a.pct);
  }, [budgets]);

  if (alerts.length === 0) return null;

  return (
    <div className="budget-alerts">
      {alerts.map((b) => {
        const status = getStatus(b.pct);
        const cfg = STATUS_CONFIG[status];
        return (
          <div
            key={b._id || b.id}
            className={`budget-alert budget-alert-${status}`}
          >
            <span className="budget-alert-icon">{cfg.icon}</span>
            <span className="budget-alert-text">
              You've deposited {Math.round(b.pct)}% into your{" "}
              <strong>{b.category}</strong> budget — only{" "}
              {currency(b.limit - b.deposited)} to go!
            </span>
          </div>
        );
      })}
    </div>
  );
}

// Budget Progress Card

function BudgetProgress({ budget, onDeposit }) {
  const { category, limit, targetDate, period } = budget;
  const budgetId = budget._id || budget.id;

  const [depositInput, setDepositInput] = useState("");
  const [depositNote, setDepositNote] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [showDepositForm, setShowDepositForm] = useState(false);
  const [depositError, setDepositError] = useState("");

  // Read deposits directly from the budget object (comes from MongoDB)
  const depositHistory = budget.deposits || [];
  const totalDeposited = depositHistory.reduce((s, d) => s + d.amount, 0);
  const percentage =
    limit > 0 ? Math.min((totalDeposited / limit) * 100, 100) : 0;
  const rawPct = limit > 0 ? (totalDeposited / limit) * 100 : 0;
  const status = getStatus(rawPct);
  const cfg = STATUS_CONFIG[status];
  const isCompleted = status === "completed";
  const remaining = limit - totalDeposited;

  const handleDeposit = () => {
    const value = parseInt(depositInput, 10);
    if (!Number.isInteger(value) || value <= 0) {
      setDepositError("Enter a valid amount.");
      return;
    }
    onDeposit(budgetId, {
      amount: value,
      note: depositNote.trim() || null,
      date: new Date().toISOString().split("T")[0],
    });
    setDepositInput("");
    setDepositNote("");
    setDepositError("");
    setShowDepositForm(false);
  };

  return (
    <div className={`budget-progress-item budget-progress-item--${status}`}>

      {/* Completed banner */}
      {isCompleted && (
        <div className="budget-completed-banner">
          🏆 Budget Completed! This budget is now locked.
        </div>
      )}

      {/* Head row */}
      <div className="budget-progress-head">
        <div className="budget-progress-head-left">
          <span className="budget-progress-category">{category}</span>
          {period && (
            <span className="budget-period-badge">
              {PERIOD_LABELS[period] || period}
            </span>
          )}
          {isCompleted && <span className="budget-lock-badge">🔒 Locked</span>}
        </div>
        <div className="budget-progress-head-right">
          <span className="budget-status-badge" style={{ color: cfg.color }}>
            {cfg.icon} {cfg.label}
          </span>
          <span className="budget-progress-amounts">
            {currency(totalDeposited)} / {currency(limit)}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="budget-progress-bar">
        <div
          className="budget-progress-fill"
          style={{
            width: `${percentage}%`,
            background: isCompleted
              ? "linear-gradient(90deg, #a78bfa, #7c3aed)"
              : status === "good"
                ? "linear-gradient(90deg, #34d399, #059669)"
                : status === "warning"
                  ? "linear-gradient(90deg, #fbbf24, #d97706)"
                  : "linear-gradient(90deg, #fb7185, #e11d48)",
            transition: "width 0.6s ease",
          }}
        />
      </div>

      {/* Footer row */}
      <div className="budget-progress-footer">
        <span style={{ color: cfg.color, fontSize: "13px", fontWeight: 600 }}>
          {Math.round(rawPct)}% funded
        </span>
        <span className="budget-progress-remaining">
          {remaining > 0
            ? `${currency(remaining)} remaining`
            : "Goal reached! 🎉"}
        </span>
        {targetDate && (
          <span className="budget-target-date">📅 {targetDate}</span>
        )}
      </div>

      {/* ── Actions (hidden when completed) ── */}
      {!isCompleted && (
        <div className="budget-actions-row">
          <button
            className="budget-deposit-btn"
            onClick={() => {
              setShowDepositForm((p) => !p);
              setDepositError("");
            }}
          >
            {showDepositForm ? "✕ Cancel" : "+ Add Money"}
          </button>
          {depositHistory.length > 0 && (
            <button
              className="budget-history-btn"
              onClick={() => setShowHistory((p) => !p)}
            >
              {showHistory
                ? "Hide History"
                : `📋 History (${depositHistory.length})`}
            </button>
          )}
        </div>
      )}

      {/* Deposit form */}
      {showDepositForm && !isCompleted && (
        <div className="budget-deposit-form">
          <div className="budget-deposit-inputs">
            <input
              type="number"
              min="1"
              step="1"
              placeholder="Amount (e.g. 500)"
              value={depositInput}
              onChange={(e) => setDepositInput(e.target.value)}
              className="budget-deposit-input"
            />
            <input
              type="text"
              placeholder="Note (optional, e.g. Week 1)"
              value={depositNote}
              onChange={(e) => setDepositNote(e.target.value)}
              className="budget-deposit-input"
            />
            <button
              className="budget-deposit-confirm-btn"
              onClick={handleDeposit}
            >
              Deposit
            </button>
          </div>
          {depositError && (
            <p className="transaction-form-error">{depositError}</p>
          )}
        </div>
      )}

      {/* Deposit history */}
      {(showHistory || isCompleted) && depositHistory.length > 0 && (
        <div className="budget-history">
          <p className="budget-history-title">
            Deposit History ({depositHistory.length} deposit
            {depositHistory.length !== 1 ? "s" : ""})
          </p>
          {[...depositHistory].reverse().map((d, i) => (
            <div key={i} className="budget-history-row">
              <span className="budget-history-date">{d.date}</span>
              <span className="budget-history-note">{d.note || "—"}</span>
              <span className="budget-history-amount">
                +{currency(d.amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Main Component

export default function BudgetsTab({
  budgets,
  categoryTotals,
  onAddBudget,
  onAddDeposit,
}) {
  const [formData, setFormData] = useState({
    category: "",
    limit: "",
    targetDate: "",
    period: "monthly",
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedCategory = formData.category.trim();
    const limitValue = parseInt(formData.limit, 10);

    if (!trimmedCategory || !formData.limit || !formData.targetDate) {
      setError("Please complete all fields.");
      return;
    }
    if (!Number.isInteger(limitValue) || limitValue <= 0) {
      setError("Please enter a valid budget amount greater than 0.");
      return;
    }

    onAddBudget({
      id: Date.now(),
      category: trimmedCategory,
      limit: limitValue,
      targetDate: formData.targetDate,
      period: formData.period,
    });

    setFormData({ category: "", limit: "", targetDate: "", period: "monthly" });
    setError("");
  };

  // Summary stats — reads deposits from each budget object
  const totalBudgeted = budgets.reduce((s, b) => s + b.limit, 0);
  const totalDeposited = budgets.reduce((s, b) => {
    return s + (b.deposits || []).reduce((ds, d) => ds + d.amount, 0);
  }, 0);
  const completedCount = budgets.filter((b) => {
    const dep = (b.deposits || []).reduce((s, d) => s + d.amount, 0);
    return dep >= b.limit;
  }).length;

  return (
    <section className="panel-card">
      <h2>Budget Overview</h2>

      {/* Summary strip */}
      {budgets.length > 0 && (
        <div className="budget-summary-strip">
          <div className="budget-summary-item">
            <span className="budget-summary-label">Total Budgeted</span>
            <span className="budget-summary-value">
              {currency(totalBudgeted)}
            </span>
          </div>
          <div className="budget-summary-item">
            <span className="budget-summary-label">Total Deposited</span>
            <span
              className="budget-summary-value"
              style={{ color: "var(--success)" }}
            >
              {currency(totalDeposited)}
            </span>
          </div>
          <div className="budget-summary-item">
            <span className="budget-summary-label">Still Needed</span>
            <span
              className="budget-summary-value"
              style={{
                color:
                  totalBudgeted - totalDeposited > 0
                    ? "var(--warning)"
                    : "var(--success)",
              }}
            >
              {currency(Math.max(0, totalBudgeted - totalDeposited))}
            </span>
          </div>
          {completedCount > 0 && (
            <div className="budget-summary-item">
              <span className="budget-summary-label">Completed</span>
              <span
                className="budget-summary-value"
                style={{ color: "#a78bfa" }}
              >
                {completedCount} 🏆
              </span>
            </div>
          )}
        </div>
      )}

      {/* Alert banners */}
      <AlertBanner budgets={budgets} />

      {/* Add budget form */}
      <form className="transaction-form" onSubmit={handleSubmit}>
        <div className="transaction-form-grid">
          <div className="transaction-field">
            <label htmlFor="category">Budget Name</label>
            <input
              id="category"
              name="category"
              type="text"
              placeholder="e.g. Rent, Vacation, Phone"
              value={formData.category}
              onChange={handleChange}
            />
          </div>
          <div className="transaction-field">
            <label htmlFor="limit">Target Amount</label>
            <input
              id="limit"
              name="limit"
              type="number"
              min="1"
              step="1"
              placeholder="e.g. 5000"
              value={formData.limit}
              onChange={handleChange}
            />
          </div>
          <div className="transaction-field">
            <label htmlFor="period">Period</label>
            <select
              id="period"
              name="period"
              value={formData.period}
              onChange={handleChange}
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div className="transaction-field">
            <label htmlFor="targetDate">Target Date</label>
            <input
              id="targetDate"
              name="targetDate"
              type="date"
              value={formData.targetDate}
              onChange={handleChange}
            />
          </div>
        </div>
        {error && <p className="transaction-form-error">{error}</p>}
        <button type="submit" className="transaction-submit-btn">
          Add Budget
        </button>
      </form>

      {/* Budget list */}
      {budgets.length === 0 ? (
        <p className="empty-text">
          No budgets yet. Add one above to start tracking.
        </p>
      ) : (
        <div className="budget-progress-list">
          {budgets.map((budget) => (
            <BudgetProgress
              key={budget._id || budget.id}
              budget={budget}
              onDeposit={onAddDeposit}
            />
          ))}
        </div>
      )}
    </section>
  );
}
