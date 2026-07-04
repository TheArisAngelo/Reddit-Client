import React, { useMemo, useState } from "react";
import { useGlobalContext } from "./context/GlobalContext";

// Constants

const CATEGORIES = [
  "Food",
  "Transport",
  "Shopping",
  "Rent",
  "Utilities",
  "Health",
  "Entertainment",
  "Savings",
  "Salary",
  "Other",
];

const CATEGORY_ICONS = {
  Food: "🍔",
  Transport: "🚌",
  Shopping: "🛍️",
  Rent: "🏠",
  Utilities: "💡",
  Health: "❤️",
  Entertainment: "🎬",
  Savings: "💰",
  Salary: "💼",
  Other: "📦",
};

// Helpers

function currency(amount) {
  return `₱${Math.round(Number(amount || 0))}`;
}

// Component

export default function TransactionsTab({ onAddTransaction }) {
  const { budgetData } = useGlobalContext();
  const transactions = budgetData?.transactions || [];
  
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    date: "",
    category: "Food",
    type: "expense",
    tags: "",
    isRecurring: false,
  });
  const [error, setError] = useState("");

  // Search & Filter
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("expense");
  const [filterCategory, setFilterCategory] = useState("all");

  // Date Period Filter
  const [filterPeriod, setFilterPeriod] = useState("week");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedTitle = formData.title.trim();
    const amountValue = parseInt(formData.amount, 10);

    if (!trimmedTitle || !formData.date || !formData.amount) {
      setError("Please complete all fields.");
      return;
    }
    if (!Number.isInteger(amountValue) || amountValue <= 0) {
      setError("Please enter a valid amount greater than 0.");
      return;
    }

    const tagsArray = formData.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const newTransaction = {
      id: Date.now(),
      title: trimmedTitle,
      amount: amountValue,
      date: formData.date,
      category: formData.category,
      type: formData.type,
      tags: tagsArray,
      isRecurring: formData.isRecurring,
    };

    onAddTransaction(newTransaction);
    setFormData({
      title: "",
      amount: "",
      date: "",
      category: "Food",
      type: "expense",
      tags: "",
      isRecurring: false,
    });
    setError("");
  };

  // Filtered & searched list
  const filtered = useMemo(() => {
    if (!transactions || !Array.isArray(transactions)) return [];
    return [...transactions]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .filter((t) => {
        const q = search.toLowerCase();
        const matchSearch =
          t.title.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          (t.tags || []).some((tag) => tag.toLowerCase().includes(q));
        const matchType = filterType === "all" || t.type === filterType;
        const matchCat =
          filterCategory === "all" ||
          t.category === filterCategory ||
          (filterCategory === "Other" && !CATEGORIES.includes(t.category));

        // Date period filter
        let matchDate = true;
        if (filterPeriod !== "all") {
          const now = new Date();
          const today = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
          );
          const [year, month, day] = t.date.split("-").map(Number);
          const txDate = new Date(year, month - 1, day);
          if (filterPeriod === "week") {
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay());
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            matchDate = txDate >= startOfWeek && txDate <= endOfWeek;
          } else if (filterPeriod === "month") {
            matchDate =
              txDate.getMonth() === today.getMonth() &&
              txDate.getFullYear() === today.getFullYear();
          } else if (filterPeriod === "year") {
            matchDate = txDate.getFullYear() === today.getFullYear();
          }
        }

        return matchSearch && matchType && matchCat && matchDate;
      });
  }, [transactions, search, filterType, filterCategory, filterPeriod]);

  return (
    <section className="panel-card">
      <h2>Recent Transactions</h2>

      {/* ADD FORM */}
      <form className="transaction-form" onSubmit={handleSubmit}>
        <div className="transaction-form-grid">
          <div className="transaction-field">
            <label htmlFor="title">Transaction Title</label>
            <input
              id="title"
              name="title"
              type="text"
              placeholder="e.g. Grocery Shopping"
              value={formData.title}
              onChange={handleChange}
            />
          </div>

          <div className="transaction-field">
            <label htmlFor="amount">Amount Paid</label>
            <input
              id="amount"
              name="amount"
              type="number"
              min="1"
              step="1"
              placeholder="e.g. 120"
              value={formData.amount}
              onChange={handleChange}
            />
          </div>

          <div className="transaction-field">
            <label htmlFor="date">Date</label>
            <input
              id="date"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleChange}
            />
          </div>

          <div className="transaction-field">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_ICONS[c]} {c}
                </option>
              ))}
            </select>
          </div>

          <div className="transaction-field">
            <label htmlFor="type">Type</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>

          <div className="transaction-field">
            <label htmlFor="tags">Tags (comma-separated)</label>
            <input
              id="tags"
              name="tags"
              type="text"
              placeholder="e.g. Vacation, Emergency"
              value={formData.tags}
              onChange={handleChange}
            />
          </div>
        </div>

        <label className="recurring-label">
          <input
            type="checkbox"
            name="isRecurring"
            checked={formData.isRecurring}
            onChange={handleChange}
          />
          Recurring transaction (salary, subscription, etc.)
        </label>

        {error && <p className="transaction-form-error">{error}</p>}
        <button type="submit" className="transaction-submit-btn">
          Add Transaction
        </button>
      </form>

      {/* ── SEARCH + FILTERS ── */}
      <div className="transaction-filters">
        <input
          type="text"
          className="transaction-search"
          placeholder="Search by title, category, or tag…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="all">All Types</option>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_ICONS[c]} {c}
            </option>
          ))}
        </select>

        <select
          value={filterPeriod}
          onChange={(e) => setFilterPeriod(e.target.value)}
        >
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {/* TRANSACTION LIST */}
      {filtered.length === 0 ? (
        <p className="empty-text">No transactions found.</p>
      ) : (
        <div className="transactions-list">
          {filtered.map((t) => (
            <div key={t.id || t._id} className="transaction-row">
              <div className="transaction-row-left">
                <span className="transaction-category-icon">
                  {CATEGORY_ICONS[t.category] || "📦"}
                </span>
                <div>
                  <h4>
                    {t.title}
                    {t.isRecurring && (
                      <span className="recurring-badge">🔁 Recurring</span>
                    )}
                  </h4>
                  <p>
                    {t.category} • {t.date} • {t.type}
                    {t.tags?.length > 0 && (
                      <span className="tag-list">
                        {t.tags.map((tag) => (
                          <span key={tag} className="tag-chip">
                            {tag}
                          </span>
                        ))}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <strong
                className={
                  t.type === "income" ? "amount-income" : "amount-expense"
                }
              >
                {t.type === "income" ? "+" : "-"}
                {currency(t.amount)}
              </strong>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
