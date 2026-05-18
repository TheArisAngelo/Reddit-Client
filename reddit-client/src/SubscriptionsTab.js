import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API = "http://localhost:5000/api/budget/subscriptions";

const CATEGORIES = [
  "Netflix",
  "Spotify",
  "Youtube",
  "Phone Plan",
  "School",
  "Gaming",
  "Other",
];

function daysUntil(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const renewal = new Date(dateStr);
  renewal.setHours(0, 0, 0, 0);
  return Math.ceil((renewal - today) / (1000 * 60 * 60 * 24));
}

function getRenewalStatus(days) {
  if (days < 0) return { label: "Overdue", className: "renewal-overdue" };
  if (days === 0) return { label: "Renews Today!", className: "renewal-today" };
  if (days <= 7)
    return {
      label: `In ${days} day${days === 1 ? "" : "s"}`,
      className: "renewal-soon",
    };
  return { label: `In ${days} days`, className: "renewal-ok" };
}

export default function SubscriptionsTab({ token }) {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    amount: "",
    billingCycle: "monthly",
    renewalDate: "",
    category: "Other",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(API, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        setSubscriptions(data.subscriptions || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token]);

  const handleAdd = async () => {
    if (!form.name || !form.amount || !form.renewalDate) {
      setError("Name, amount, and renewal date are required.");
      return;
    }
    setError("");
    const res = await fetch(API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSubscriptions(data.subscriptions || []);
    setForm({
      name: "",
      amount: "",
      billingCycle: "monthly",
      renewalDate: "",
      category: "Other",
    });
    setShowForm(false);
  };

  const handleDelete = async (id) => {
    const res = await fetch(`${API}/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setSubscriptions(data.subscriptions || []);
  };

  const sorted = [...subscriptions].sort(
    (a, b) => new Date(a.renewalDate) - new Date(b.renewalDate),
  );

  const upcoming = sorted.filter((s) => daysUntil(s.renewalDate) <= 7);

  const monthlyTotal = subscriptions.reduce((sum, s) => {
    return sum + (s.billingCycle === "yearly" ? s.amount / 12 : s.amount);
  }, 0);

  return (
    <div className="subs-page">
      {/* Topbar */}
      <div className="subs-topbar">
        <Link to="/" className="sim-back-btn">
          ← Back to SpendWise
        </Link>
      </div>

      <div className="subs-wrap">
        {/* Page Header */}
        <div className="subs-header">
          <div>
            <h2 className="subs-title">📋 Subscription Watcher</h2>
            <p className="subs-sub">
              Track your recurring subscriptions and upcoming subscriptions
            </p>
          </div>
          <button
            className="transaction-submit-btn subs-add-btn"
            onClick={() => setShowForm((p) => !p)}
          >
            {showForm ? "Cancel" : "+ Add Subscription"}
          </button>
        </div>

        {/* Summary Strip */}
        <div className="budget-summary-strip subs-summary">
          <div className="budget-summary-item">
            <span className="budget-summary-label">Total Subscriptions</span>
            <span className="budget-summary-value">{subscriptions.length}</span>
          </div>
          <div className="budget-summary-item">
            <span className="budget-summary-label">Est. Monthly Cost</span>
            <span className="budget-summary-value subs-cost">
              ₱{Math.round(monthlyTotal).toLocaleString()}
            </span>
          </div>
          <div className="budget-summary-item">
            <span className="budget-summary-label">Renewing Soon</span>
            <span className="budget-summary-value subs-soon">
              {upcoming.length}
            </span>
          </div>
        </div>

        {/* Add Form */}
        {showForm && (
          <div className="transaction-form subs-form">
            <h3 className="subs-form-title">New Subscription</h3>
            {error && <p className="transaction-form-error">{error}</p>}
            <div className="transaction-form-grid">
              <div className="transaction-field">
                <label>Name</label>
                <input
                  placeholder="e.g. Netflix"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="transaction-field">
                <label>Amount (₱)</label>
                <input
                  type="number"
                  placeholder="e.g. 499"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                />
              </div>
              <div className="transaction-field">
                <label>Billing Cycle</label>
                <select
                  value={form.billingCycle}
                  onChange={(e) =>
                    setForm({ ...form, billingCycle: e.target.value })
                  }
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div className="transaction-field">
                <label>Category</label>
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                >
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="transaction-field subs-field-full">
                <label>Next Renewal Date</label>
                <input
                  type="date"
                  value={form.renewalDate}
                  onChange={(e) =>
                    setForm({ ...form, renewalDate: e.target.value })
                  }
                />
              </div>
            </div>
            <button className="transaction-submit-btn" onClick={handleAdd}>
              Save Subscription
            </button>
          </div>
        )}

        {/* Upcoming Renewals */}
        {upcoming.length > 0 && (
          <div className="subs-upcoming">
            <h3 className="subs-section-title subs-section-title--warning">
              ⚠️ Renewing Within 7 Days
            </h3>
            <div className="subs-list">
              {upcoming.map((s) => {
                const { label, className } = getRenewalStatus(
                  daysUntil(s.renewalDate),
                );
                return (
                  <div
                    key={s._id}
                    className={`subs-row subs-row--alert ${className}-border`}
                  >
                    <div>
                      <span className="subs-row-name">{s.name}</span>
                      <span className="subs-row-category">{s.category}</span>
                    </div>
                    <span className={`subs-renewal-label ${className}`}>
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* All Subscriptions */}
        <h3 className="subs-section-title">All Subscriptions</h3>
        {loading ? (
          <p className="empty-text">Loading...</p>
        ) : sorted.length === 0 ? (
          <p className="empty-text">No Subscriptions yet. Add one above!</p>
        ) : (
          <div className="subs-list">
            {sorted.map((s) => {
              const days = daysUntil(s.renewalDate);
              const { label, className } = getRenewalStatus(days);
              return (
                <div key={s._id} className="subs-row">
                  <div className="subs-row-info">
                    <span className="subs-row-name">{s.name}</span>
                    <span className="subs-row-meta">
                      {s.category} . {s.billingCycle} . Renews {s.renewalDate}
                    </span>
                  </div>
                  <div className="subs-row-right">
                    <span className="subs-row-amount">
                      ₱{Number(s.amount).toLocaleString()}
                    </span>
                    <span className={`subs-renewal-label ${className}`}>
                      {label}
                    </span>
                    <button
                      className="budget-history-btn subs-remove-btn"
                      onClick={() => handleDelete(s._id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
