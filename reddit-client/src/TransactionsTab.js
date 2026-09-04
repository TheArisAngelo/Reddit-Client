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

// Normalize a transaction's category to an array, since older/legacy
// transactions may still have a single string category.
function categoriesOf(t) {
  if (Array.isArray(t.category)) return t.category;
  return t.category ? [t.category] : [];
}

// Component

export default function TransactionsTab({
  onAddTransaction,
  onEditTransaction,
}) {
  const { budgetData } = useGlobalContext();
  const transactions = budgetData?.transactions || [];

  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    date: "",
    categories: [],
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

  // Edit modal
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [editFormData, setEditFormData] = useState(null);
  const [editError, setEditError] = useState("");

  const openEditModal = (t) => {
    setEditingTransaction(t);
    setEditFormData({
      title: t.title,
      amount: String(t.amount),
      date: t.date,
      categories: categoriesOf(t),
      type: t.type,
      tags: (t.tags || []).join(", "),
      isRecurring: !!t.isRecurring,
    });
    setEditError("");
  };

  const closeEditModal = () => {
    setEditingTransaction(null);
    setEditFormData(null);
    setEditError("");
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const toggleEditCategory = (cat) => {
    setEditFormData((prev) => {
      const isSelected = prev.categories.includes(cat);
      return {
        ...prev,
        categories: isSelected
          ? prev.categories.filter((c) => c !== cat)
          : [...prev.categories, cat],
      };
    });
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    const trimmedTitle = editFormData.title.trim();
    const amountValue = parseInt(editFormData.amount, 10);

    if (
      !trimmedTitle ||
      !editFormData.date ||
      !editFormData.amount ||
      editFormData.categories.length === 0
    ) {
      setEditError(
        "Please complete all fields and pick at least one category.",
      );
      return;
    }
    if (!Number.isInteger(amountValue) || amountValue <= 0) {
      setEditError("Please enter a valid amount greater than 0.");
      return;
    }

    const tagsArray = editFormData.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const updatedTransaction = {
      ...editingTransaction,
      title: trimmedTitle,
      amount: amountValue,
      date: editFormData.date,
      category: editFormData.categories,
      type: editFormData.type,
      tags: tagsArray,
      isRecurring: editFormData.isRecurring,
    };

    onEditTransaction?.(updatedTransaction);
    closeEditModal();
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const toggleCategory = (cat) => {
    setFormData((prev) => {
      const isSelected = prev.categories.includes(cat);
      return {
        ...prev,
        categories: isSelected
          ? prev.categories.filter((c) => c !== cat)
          : [...prev.categories, cat],
      };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedTitle = formData.title.trim();
    const amountValue = parseInt(formData.amount, 10);

    if (
      !trimmedTitle ||
      !formData.date ||
      !formData.amount ||
      formData.categories.length === 0
    ) {
      setError("Please complete all fields and pick at least one category.");
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
      category: formData.categories,
      type: formData.type,
      tags: tagsArray,
      isRecurring: formData.isRecurring,
    };

    onAddTransaction(newTransaction);
    setFormData({
      title: "",
      amount: "",
      date: "",
      categories: [],
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
        const cats = categoriesOf(t);
        const q = search.toLowerCase();
        const matchSearch =
          t.title.toLowerCase().includes(q) ||
          cats.some((c) => c.toLowerCase().includes(q)) ||
          (t.tags || []).some((tag) => tag.toLowerCase().includes(q));
        const matchType = filterType === "all" || t.type === filterType;
        const matchCat =
          filterCategory === "all" ||
          cats.includes(filterCategory) ||
          (filterCategory === "Other" &&
            cats.every((c) => !CATEGORIES.includes(c)));

        // Date period filter
        // Income is not scoped to a period — it should always be counted,
        // not just when it falls inside the currently selected week/month/year.
        let matchDate = true;
        if (filterPeriod !== "all" && t.type !== "income") {
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
    <>
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

            <div className="transaction-field transaction-field-wide">
              <label>Category (select one or more)</label>
              <div className="category-chip-group">
                {CATEGORIES.map((c) => {
                  const active = formData.categories.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleCategory(c)}
                      className={`category-chip${active ? " category-chip-active" : ""}`}
                      aria-pressed={active}
                    >
                      <span>{CATEGORY_ICONS[c]}</span> {c}
                    </button>
                  );
                })}
              </div>
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
            {filtered.map((t) => {
              const cats = categoriesOf(t);
              return (
                <div key={t.id || t._id} className="transaction-row">
                  <div className="transaction-row-left">
                    <span className="transaction-category-icon">
                      {cats.map((c) => CATEGORY_ICONS[c] || "📦").join(" ")}
                    </span>
                    <div>
                      <h4>
                        {t.title}
                        {t.isRecurring && (
                          <span className="recurring-badge">🔁 Recurring</span>
                        )}
                      </h4>
                      <p>
                        {cats.join(", ")} • {t.date} • {t.type}
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
                  <div className="transaction-row-right">
                    <strong
                      className={
                        t.type === "income" ? "amount-income" : "amount-expense"
                      }
                    >
                      {t.type === "income" ? "+" : "-"}
                      {currency(t.amount)}
                    </strong>
                    <button
                      type="button"
                      className="transaction-edit-btn"
                      onClick={() => openEditModal(t)}
                      aria-label={`Edit ${t.title}`}
                    >
                      ✏️ Edit
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
      {/* EDIT MODAL */}
      {editingTransaction && editFormData && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Transaction</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={closeEditModal}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <form className="transaction-form" onSubmit={handleEditSubmit}>
              <div className="transaction-form-grid">
                <div className="transaction-field">
                  <label htmlFor="edit-title">Transaction Title</label>
                  <input
                    id="edit-title"
                    name="title"
                    type="text"
                    value={editFormData.title}
                    onChange={handleEditChange}
                  />
                </div>

                <div className="transaction-field">
                  <label htmlFor="edit-amount">Amount Paid</label>
                  <input
                    id="edit-amount"
                    name="amount"
                    type="number"
                    min="1"
                    step="1"
                    value={editFormData.amount}
                    onChange={handleEditChange}
                  />
                </div>

                <div className="transaction-field">
                  <label htmlFor="edit-date">Date</label>
                  <input
                    id="edit-date"
                    name="date"
                    type="date"
                    value={editFormData.date}
                    onChange={handleEditChange}
                  />
                </div>

                <div className="transaction-field transaction-field-wide">
                  <label>Category (select one or more)</label>
                  <div className="category-chip-group">
                    {CATEGORIES.map((c) => {
                      const active = editFormData.categories.includes(c);
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => toggleEditCategory(c)}
                          className={`category-chip${active ? " category-chip-active" : ""}`}
                          aria-pressed={active}
                        >
                          <span>{CATEGORY_ICONS[c]}</span> {c}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="transaction-field">
                  <label htmlFor="edit-type">Type</label>
                  <select
                    id="edit-type"
                    name="type"
                    value={editFormData.type}
                    onChange={handleEditChange}
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>

                <div className="transaction-field">
                  <label htmlFor="edit-tags">Tags (comma-separated)</label>
                  <input
                    id="edit-tags"
                    name="tags"
                    type="text"
                    value={editFormData.tags}
                    onChange={handleEditChange}
                  />
                </div>
              </div>

              <label className="recurring-label">
                <input
                  type="checkbox"
                  name="isRecurring"
                  checked={editFormData.isRecurring}
                  onChange={handleEditChange}
                />
                Recurring transaction (salary, subscription, etc.)
              </label>

              {editError && (
                <p className="transaction-form-error">{editError}</p>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-cancel-btn"
                  onClick={closeEditModal}
                >
                  Cancel
                </button>
                <button type="submit" className="transaction-submit-btn">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
