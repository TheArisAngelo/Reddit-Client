import React, { useState } from "react";

function currency(amount) {
  return `₱${Math.round(Number(amount || 0))}`;
}

function BudgetProgress({ category, spent, limit, targetDate }) {
  const percentage = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;

  return (
    <div className="budget-progress-item">
      <div className="budget-progress-head">
        <span>{category}</span>
        <span>
          {currency(spent)} spent of {currency(limit)}
        </span>
      </div>

      {targetDate && (
        <p className="budget-target-date">Target date: {targetDate}</p>
      )}

      <div className="budget-progress-bar">
        <div
          className="budget-progress-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default function BudgetsTab({ budgets, categoryTotals, onAddBudget }) {
  const [formData, setFormData] = useState({
    category: "",
    limit: "",
    targetDate: "",
  });
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const trimmedCategory = formData.category.trim();
    const limitValue = parseInt(formData.limit, 10);

    if (!trimmedCategory || !formData.limit || !formData.targetDate) {
      setError("Please complete all fields.");
      return;
    }

    if (!Number.isInteger(limitValue) || limitValue <= 0) {
      setError("Please enter a valid budget amount greater than 0");
      return;
    }

    const budgetToAdd = {
      id: Date.now(),
      category: trimmedCategory,
      limit: limitValue,
      targetDate: formData.targetDate,
    };

    console.log("Budget being sent:", budgetToAdd); // debug

    onAddBudget(budgetToAdd);

    setFormData({
      category: "",
      limit: "",
      targetDate: "",
    });
    setError("");
  };

  return (
    <section className="panel-card">
      <h2>Budget Overview</h2>

      <form className="transaction-form" onSubmit={handleSubmit}>
        <div className="transaction-form-grid">
          <div className="transaction-field">
            <label htmlFor="category">Budget Name</label>
            <input
              id="category"
              name="category"
              type="text"
              placeholder="e.g. House"
              value={formData.category}
              onChange={handleChange}
            />
          </div>

          <div className="transaction-field">
            <label htmlFor="limit">Budget Amount</label>
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

      {budgets.length === 0 ? (
        <p className="empty-text">No budgets yet.</p>
      ) : (
        <div className="budget-progress-list">
          {budgets.map((budget) => (
            <BudgetProgress
              key={budget._id || budget.id}
              category={budget.category}
              spent={categoryTotals[budget.category] || 0}
              limit={budget.limit}
              targetDate={budget.targetDate}
            />
          ))}
        </div>
      )}
    </section>
  );
}
