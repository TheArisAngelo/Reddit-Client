import React, { useState, useMemo } from "react";
import { useGlobalContext } from "./context/GlobalContext";

const API = "http://localhost:5000/api/budget";

function currency(amount) {
  return `₱${Math.round(Number(amount || 0)).toLocaleString()}`;
}

function getDaysLeft(deadline) {
  if (!deadline) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(deadline);
  end.setHours(0, 0, 0, 0);
  const diff = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
  return diff;
}

function getContributionSuggestion(remaining, daysLeft) {
  if (!daysLeft || daysLeft <= 0 || remaining <= 0) return null;
  const perDay = remaining / daysLeft;
  const perWeek = perDay * 7;
  const perMonth = perDay * 30;

  if (perDay < 100) {
    return `Save ${currency(Math.ceil(perDay))}/day to reach your goal`;
  } else if (perWeek < 5000) {
    return `Save ${currency(Math.ceil(perWeek))}/week to reach your goal`;
  } else {
    return `Save ${currency(Math.ceil(perMonth))}/month to reach your goal`;
  }
}

function ProgressBar({ percent }) {
  const clamped = Math.min(100, Math.max(0, percent));
  const color =
    clamped >= 100
      ? "#4ade80"
      : clamped >= 60
        ? "#818cf8"
        : clamped >= 30
          ? "#f59e0b"
          : "#f87171";

  return (
    <div className="savings-progress-track">
      <div
        className="savings-progress-fill"
        style={{ width: `${clamped}%`, background: color }}
      />
    </div>
  );
}

function GoalCard({ goal, onDelete, onContribute }) {
  const [contributeMode, setContributeMode] = useState(false);
  const [amount, setAmount] = useState("");

  const percent = goal.target > 0 ? (goal.saved / goal.target) * 100 : 0;
  const remaining = Math.max(0, goal.target - goal.saved);
  const daysLeft = getDaysLeft(goal.deadline);
  const suggestion = getContributionSuggestion(remaining, daysLeft);
  const isComplete = goal.saved >= goal.target;

  // MongoDB returns _id, not id
  const goalId = goal._id || goal.id;

  const handleContribute = () => {
    const val = parseFloat(amount);
    if (!val || val <= 0) return;
    onContribute(goalId, val);
    setAmount("");
    setContributeMode(false);
  };

  return (
    <div className={`savings-goal-card ${isComplete ? "goal-complete" : ""}`}>
      {/* Header */}
      <div className="goal-card-header">
        <div>
          <h4 className="goal-title">{goal.title}</h4>
          {goal.category && (
            <span className="goal-category-badge">{goal.category}</span>
          )}
        </div>
        <button
          className="goal-delete-btn"
          onClick={() => onDelete(goalId)}
          title="Delete goal"
        >
          ✕
        </button>
      </div>

      {/* Amount */}
      <div className="goal-amounts">
        <span className="goal-saved">{currency(goal.saved)}</span>
        <span className="goal-divider"> / </span>
        <span className="goal-target">{currency(goal.target)}</span>
      </div>

      {/* Progress Bar */}
      <ProgressBar percent={percent} />
      <div className="goal-percent-row">
        <span className="goal-percent">
          {Math.min(100, Math.round(percent))}% saved
        </span>
        {!isComplete && (
          <span className="goal-remaining">{currency(remaining)} left</span>
        )}
        {isComplete && (
          <span className="goal-complete-badge">🎉 Complete!</span>
        )}
      </div>

      {/* Deadline Countdown */}
      {goal.deadline && !isComplete && (
        <div
          className={`goal-deadline ${daysLeft !== null && daysLeft < 0 ? "overdue" : daysLeft !== null && daysLeft <= 7 ? "urgent" : ""}`}
        >
          {daysLeft === null
            ? ""
            : daysLeft < 0
              ? `⚠️ Overdue by ${Math.abs(daysLeft)} days`
              : daysLeft === 0
                ? "⏰ Due today!"
                : `⏱ ${daysLeft} day${daysLeft !== 1 ? "s" : ""} left`}
        </div>
      )}

      {/* Contribution Suggestion */}
      {suggestion && !isComplete && (
        <div className="goal-suggestion">💡 {suggestion}</div>
      )}

      {/* Contribute Button / Form */}
      {!isComplete && (
        <div className="goal-contribute-area">
          {!contributeMode ? (
            <button
              className="goal-contribute-btn"
              onClick={() => setContributeMode(true)}
            >
              + Add Savings
            </button>
          ) : (
            <div className="goal-contribute-form">
              <input
                type="number"
                min="1"
                placeholder="Amount to add (₱)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="goal-contribute-input"
                autoFocus
              />
              <div className="goal-contribute-actions">
                <button className="goal-confirm-btn" onClick={handleContribute}>
                  Confirm
                </button>
                <button
                  className="goal-cancel-btn"
                  onClick={() => {
                    setContributeMode(false);
                    setAmount("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AddGoalForm({ onAdd, onCancel }) {
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");
  const [saved, setSaved] = useState("");
  const [deadline, setDeadline] = useState("");
  const [category, setCategory] = useState("General");

  const categories = [
    "General",
    "Electronics",
    "Travel",
    "Emergency Fund",
    "Education",
    "Vehicle",
    "Home",
    "Health",
    "Other",
  ];

  const handleSubmit = () => {
    if (!title.trim() || !target || parseFloat(target) <= 0) return;
    onAdd({
      title: title.trim(),
      target: parseFloat(target),
      saved: parseFloat(saved) || 0,
      deadline: deadline || null,
      category,
    });
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="add-goal-form">
      <h3 className="add-goal-title">New Savings Goal</h3>

      <div className="goal-form-grid">
        <div className="goal-form-field full-width">
          <label>Goal Name</label>
          <input
            type="text"
            placeholder='e.g. "Laptop", "Travel Fund"'
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="goal-form-field">
          <label>Target Amount (₱)</label>
          <input
            type="number"
            min="1"
            placeholder="50000"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />
        </div>

        <div className="goal-form-field">
          <label>Already Saved (₱) — optional</label>
          <input
            type="number"
            min="0"
            placeholder="0"
            value={saved}
            onChange={(e) => setSaved(e.target.value)}
          />
        </div>

        <div className="goal-form-field">
          <label>Deadline — optional</label>
          <input
            type="date"
            min={today}
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </div>

        <div className="goal-form-field">
          <label>Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="add-goal-actions">
        <button className="transaction-submit-btn" onClick={handleSubmit}>
          Create Goal
        </button>
        <button className="goal-cancel-btn" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function SavingsTab({ savingsGoals = [], onGoalsUpdate }) {
  const { auth } = useGlobalContext();
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("all");

  const handleAddGoal = async (goalData) => {
    try {
      const res = await fetch(`${API}/savings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth?.token}`,
        },
        body: JSON.stringify(goalData),
      });
      const updated = await res.json();
      if (updated?.savingsGoals) onGoalsUpdate(updated);
      setShowForm(false);
    } catch (err) {
      console.error("Failed to add savings goal", err);
    }
  };

  const handleDeleteGoal = async (goalId) => {
    try {
      const res = await fetch(`${API}/savings/${goalId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${auth?.token}` },
      });
      const updated = await res.json();
      if (updated?.savingsGoals) onGoalsUpdate(updated);
    } catch (err) {
      console.error("Failed to delete savings goal", err);
    }
  };

  const handleContribute = async (goalId, amount) => {
    try {
      const res = await fetch(`${API}/savings/${goalId}/contribute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth?.token}`,
        },
        body: JSON.stringify({ amount }),
      });
      const updated = await res.json();
      if (updated?.savingsGoals) onGoalsUpdate(updated);
    } catch (err) {
      console.error("Failed to contribute to goal", err);
    }
  };

  const totalSaved = useMemo(
    () => savingsGoals.reduce((sum, g) => sum + (g.saved || 0), 0),
    [savingsGoals],
  );
  const totalTarget = useMemo(
    () => savingsGoals.reduce((sum, g) => sum + (g.target || 0), 0),
    [savingsGoals],
  );
  const completedCount = useMemo(
    () => savingsGoals.filter((g) => g.saved >= g.target).length,
    [savingsGoals],
  );

  const filteredGoals = useMemo(() => {
    if (filter === "active")
      return savingsGoals.filter((g) => g.saved < g.target);
    if (filter === "complete")
      return savingsGoals.filter((g) => g.saved >= g.target);
    return savingsGoals;
  }, [savingsGoals, filter]);

  return (
    <section className="panel-card savings-panel">
      <div className="savings-header">
        <h2>Savings Goals</h2>
        {!showForm && (
          <button
            className="transaction-submit-btn savings-add-btn"
            onClick={() => setShowForm(true)}
          >
            + New Goal
          </button>
        )}
      </div>

      {/* Summary Stats */}
      {savingsGoals.length > 0 && (
        <div className="savings-summary-row">
          <div className="savings-stat">
            <span className="savings-stat-label">Total Saved</span>
            <span className="savings-stat-value">{currency(totalSaved)}</span>
          </div>
          <div className="savings-stat">
            <span className="savings-stat-label">Total Target</span>
            <span className="savings-stat-value">{currency(totalTarget)}</span>
          </div>
          <div className="savings-stat">
            <span className="savings-stat-label">Goals Complete</span>
            <span className="savings-stat-value">
              {completedCount}/{savingsGoals.length}
            </span>
          </div>
        </div>
      )}

      {/* Add Goal Form */}
      {showForm && (
        <AddGoalForm
          onAdd={handleAddGoal}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Filter Tabs */}
      {savingsGoals.length > 0 && (
        <div className="savings-filter-tabs">
          {["all", "active", "complete"].map((f) => (
            <button
              key={f}
              className={`savings-filter-btn ${filter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      )}

      {/* Goals Grid */}
      {savingsGoals.length === 0 && !showForm ? (
        <div className="empty-savings">
          <div className="savings-icon">◎</div>
          <h3>No savings goals at the moment.</h3>
          <p>Let's start saving! Set your first goal to track your progress.</p>
        </div>
      ) : filteredGoals.length === 0 ? (
        <div className="empty-savings">
          <p>No {filter} goals found.</p>
        </div>
      ) : (
        <div className="savings-goals-grid">
          {filteredGoals.map((goal) => (
            <GoalCard
              key={goal._id || goal.id}
              goal={goal}
              onDelete={handleDeleteGoal}
              onContribute={handleContribute}
            />
          ))}
        </div>
      )}
    </section>
  );
}
