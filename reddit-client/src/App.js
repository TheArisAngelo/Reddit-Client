import React, { useEffect, useMemo, useState } from "react";
import { Routes, Route, Link, Navigate, useLocation } from "react-router-dom";
import { TrendingUp, Receipt, Banknote, ShieldCheck } from "lucide-react";
import "./App.css";
import Profile from "./Profile";
import LoginPage from "./LoginPage";
import SignUpPage from "./SignUpPage";
import ForgotPassword from "./ForgotPassword";
import BudgetsTab from "./BudgetsTab";
import InsightsTab from "./InsightsTab";
import ChartsTab from "./ChartsTab";
import TransactionsTab from "./TransactionsTab";
import SavingsTab from "./SavingsTab";
import NotificationBell from "./NotificationBell";
import WhatIfSimulator from "./WhatIfSimulator";
import SubscriptionsTab from "./SubscriptionsTab";
import AppHeader from "./AppHeader";
import { useGlobalContext } from "./context/GlobalContext";

const CARD_CONFIG = {
  "income-card": { icon: <TrendingUp size={17} />, iconClass: "icon-teal" },
  "expense-card": { icon: <Receipt size={17} />, iconClass: "icon-coral" },
  "balance-card": { icon: <Banknote size={17} />, iconClass: "icon-blue" },
  "status-card": { icon: <ShieldCheck size={17} />, iconClass: "icon-green" },
};

function sanitize(str) {
  if (typeof str !== "string") return str;
  return str.trim().replace(/<[^>]*>/g, "");
}

function currency(amount) {
  return `₱${Math.round(Number(amount || 0)).toLocaleString()}`;
}

function filterTransactions(transactions, period) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return transactions.filter((t) => {
    const [year, month, day] = t.date.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    if (period === "week") {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return date >= startOfWeek && date <= endOfWeek;
    }
    if (period === "month")
      return (
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
      );
    if (period === "year") return date.getFullYear() === today.getFullYear();
    return true;
  });
}

function ProtectedRoute({ children }) {
  const { auth } = useGlobalContext();
  if (!auth.isLoggedIn) return <Navigate to="/login" replace />;
  return children;
}

function MobileSubNav() {
  const { auth, handleLogout } = useGlobalContext();
  const location = useLocation();
  if (!auth.isLoggedIn) return null;
  return (
    <>
      <style>{`
        .mobile-sub-nav { display: none; }
        @media (max-width: 768px) {
          .mobile-sub-nav {
            display: flex; position: fixed; bottom: 0; left: 0; right: 0; z-index: 1000;
            background: rgba(8,15,28,0.96); backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border-top: 1px solid rgba(148,163,184,0.16);
            padding: 6px 0 env(safe-area-inset-bottom, 6px);
          }
          .mobile-sub-nav-btn {
            display: flex; flex-direction: column; align-items: center;
            justify-content: center; gap: 4px; flex: 1; padding: 8px 4px;
            border: none; background: transparent; color: #94a3b8;
            font-size: 10px; font-weight: 600; cursor: pointer;
            font-family: inherit; text-decoration: none; transition: color .18s ease;
          }
          .mobile-sub-nav-btn:hover, .mobile-sub-nav-btn.active { color: #a78bfa; }
          .mobile-sub-nav-btn svg { flex-shrink: 0; }
        }
      `}</style>
      <nav className="mobile-sub-nav">
        <Link
          to="/"
          className={`mobile-sub-nav-btn${location.pathname === "/" ? " active" : ""}`}
        >
          <svg
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
          >
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
          </svg>
          <span>Dashboard</span>
        </Link>
        <Link
          to="/profile"
          className={`mobile-sub-nav-btn${location.pathname === "/profile" ? " active" : ""}`}
        >
          <svg
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
          </svg>
          <span>Profile</span>
        </Link>
        <Link
          to="/simulator"
          className={`mobile-sub-nav-btn${location.pathname === "/simulator" ? " active" : ""}`}
        >
          <svg
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 3" />
          </svg>
          <span>Simulator</span>
        </Link>
        <Link
          to="/subscriptions"
          className={`mobile-sub-nav-btn${location.pathname === "/subscriptions" ? " active" : ""}`}
        >
          <svg
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
          >
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="M3 10h18" />
          </svg>
          <span>Subscriptions</span>
        </Link>
        <button className="mobile-sub-nav-btn" onClick={handleLogout}>
          <svg
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
          >
            <path d="M16 17l5-5-5-5" />
            <path d="M21 12H9" />
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
          </svg>
          <span>Log Out</span>
        </button>
      </nav>
    </>
  );
}

function SideNav() {
  const { auth, handleLogout, budgetData } = useGlobalContext();
  if (!auth.isLoggedIn) return null;
  const transactions = budgetData?.transactions ?? [];
  return (
    <aside className="side-nav">
      <div className="side-nav-header">
        <h3>
          <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
            SpendWise
          </Link>
        </h3>
        <p>Hi, {auth.username}</p>
      </div>
      <div className="side-nav-links">
        <Link to="/profile" className="side-nav-link">
          👤 Profile
        </Link>
        <Link to="/simulator" className="side-nav-link">
          💡 What-if Simulator
        </Link>
        <Link to="/subscriptions" className="side-nav-link">
          📋 Subscription Watcher
        </Link>
        <button
          className="side-nav-link side-nav-logout"
          onClick={handleLogout}
        >
          ➜] Log Out
        </button>
      </div>
    </aside>
  );
}

// Summary Card
function SummaryCard({
  title,
  amount,
  subtitle,
  className,
  statusText,
  onEmptyAction,
  isEmpty,
}) {
  const config = CARD_CONFIG[className] || {};
  return (
    <div className={`summary-card ${className || ""}`}>
      <div className="summary-card-top">
        <p className="summary-title">{title}</p>
        {config.icon && (
          <span className={`card-icon ${config.iconClass}`} aria-hidden="true">
            {config.icon}
          </span>
        )}
      </div>
      {isEmpty ? (
        <div className="summary-empty">
          <span className="summary-empty-dash" />
          <h3 className="summary-amount summary-amount--muted">{amount}</h3>
          {onEmptyAction && (
            <button className="summary-empty-cta" onClick={onEmptyAction}>
              {subtitle} →
            </button>
          )}
        </div>
      ) : (
        <>
          <h3 className="summary-amount">{amount}</h3>
          <div className="summary-meta">{statusText || subtitle}</div>
        </>
      )}
    </div>
  );
}

// HomePage
function HomePage() {
  const {
    auth,
    handleLogout,
    darkMode,
    toggleDarkMode,
    budgetData,
    setBudgetData,
    setCachedBudgetData,
    clearBudgetCache,
    isTokenExpired,
    API,
  } = useGlobalContext();

  // Only truly local state stays here
  const [activeTab, setActiveTab] = useState("dashboard");
  const [balanceInput, setBalanceInput] = useState("");
  const [period, setPeriod] = useState("week");

  // Auto-logout when token expires
  useEffect(() => {
    const interval = setInterval(() => {
      if (auth?.token && isTokenExpired(auth.token)) handleLogout();
    }, 60_000);
    return () => clearInterval(interval);
  }, [auth?.token]);

  const handleAddTransaction = async (newTransaction) => {
    const safe = {
      ...newTransaction,
      category: sanitize(newTransaction.category),
      description: sanitize(newTransaction.description || ""),
    };
    try {
      clearBudgetCache();
      const res = await fetch(`${API}/transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify(safe),
      });
      if (res.status === 401) {
        handleLogout();
        return;
      }
      const updated = await res.json();
      if (updated && Array.isArray(updated.transactions)) {
        setBudgetData(updated);
        setCachedBudgetData(updated);
      }
    } catch (err) {
      console.error("Failed to add transaction", err);
    }
  };

  const handleAddBudget = async (newBudget) => {
    const safe = {
      ...newBudget,
      name: sanitize(newBudget.name || ""),
      category: sanitize(newBudget.category || ""),
    };
    try {
      clearBudgetCache();
      const res = await fetch(`${API}/budgets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify(safe),
      });
      if (res.status === 401) {
        handleLogout();
        return;
      }
      const updated = await res.json();
      setBudgetData(updated);
      setCachedBudgetData(updated);
    } catch (err) {
      console.error("Failed to add budget", err);
    }
  };

  const handleAddDeposit = async (budgetId, deposit) => {
    try {
      const res = await fetch(`${API}/budgets/${budgetId}/deposits`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify(deposit),
      });
      if (res.status === 401) {
        handleLogout();
        return;
      }
      const updated = await res.json();
      if (updated && Array.isArray(updated.budgets)) {
        setBudgetData(updated);
        setCachedBudgetData(updated);
      }
    } catch (err) {
      console.error("Failed to save deposit", err);
    }
  };

  const handleSetCurrentBalance = async () => {
    const parsedBalance = parseInt(balanceInput, 10);
    if (
      balanceInput.trim() === "" ||
      !Number.isInteger(parsedBalance) ||
      parsedBalance <= 0
    )
      return;
    try {
      clearBudgetCache();
      const res = await fetch(`${API}/balance`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ addBalance: parsedBalance }),
      });
      if (res.status === 401) {
        handleLogout();
        return;
      }
      const updated = await res.json();
      setBudgetData((prev) => ({
        ...prev,
        currentBalance: updated.currentBalance ?? prev.currentBalance,
        ...(updated.transactions && { transactions: updated.transactions }),
        ...(updated.budgets && { budgets: updated.budgets }),
        ...(updated.savingsGoals && { savingsGoals: updated.savingsGoals }),
      }));
      setCachedBudgetData({
        ...budgetData,
        currentBalance: updated.currentBalance ?? budgetData.currentBalance,
      });
      setBalanceInput("");
    } catch (err) {
      console.error("Failed to update balance", err);
    }
  };

  const handleGoalsUpdate = (updatedData) => {
    setBudgetData(updatedData);
    setCachedBudgetData(updatedData);
  };

  const {
    currentBalance,
    transactions = [],
    budgets = [],
    savingsGoals = [],
  } = budgetData;

  const filteredTransactions = useMemo(
    () => filterTransactions(transactions, period),
    [transactions, period],
  );
  const totalIncome = useMemo(
    () =>
      filteredTransactions
        .filter((t) => t.type === "income")
        .reduce((s, t) => s + t.amount, 0),
    [filteredTransactions],
  );
  const totalExpenses = useMemo(
    () =>
      filteredTransactions
        .filter((t) => t.type === "expense")
        .reduce((s, t) => s + t.amount, 0),
    [filteredTransactions],
  );
  const expenseCount = filteredTransactions.filter(
    (t) => t.type === "expense",
  ).length;
  const allTimeIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const filteredCurrentBalance =
    filteredTransactions
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + t.amount, 0) -
    filteredTransactions
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + t.amount, 0);
  const spendingRate =
    (period === "all" ? allTimeIncome : filteredCurrentBalance) > 0
      ? (totalExpenses /
          (period === "all" ? allTimeIncome : filteredCurrentBalance)) *
        100
      : 0;
  const spendingStatus =
    spendingRate < 50 ? "Good" : spendingRate < 80 ? "Warning" : "Critical";

  const categoryTotals = useMemo(
    () =>
      filteredTransactions
        .filter((t) => t.type === "expense")
        .reduce((acc, t) => {
          acc[t.category] = (acc[t.category] || 0) + t.amount;
          return acc;
        }, {}),
    [filteredTransactions],
  );
  const biggestExpenseCategory = useMemo(() => {
    const entries = Object.entries(categoryTotals);
    return entries.length
      ? entries.reduce((max, curr) => (curr[1] > max[1] ? curr : max))
      : null;
  }, [categoryTotals]);

  // Guest view
  if (!auth.isLoggedIn) {
    return (
      <div className="app-shell budget-app">
        <main className="budget-main">
          <section className="guest-home">
            <div className="guest-hero-card">
              <p className="guest-badge">Welcome to SpendWise</p>
              <h1>Track your budget with confidence.</h1>
              <p className="guest-text">
                Manage your income, monitor expenses, plan category budgets, and
                stay focused on savings goals.
              </p>
              <div className="guest-actions">
                <Link to="/login" className="nav-btn">
                  Log In
                </Link>
                <Link to="/signup" className="nav-btn nav-btn-alt">
                  Sign Up
                </Link>
              </div>
            </div>
            <section className="guest-feature-grid">
              <div className="guest-feature-card">
                <h3>Track Expenses</h3>
                <p>
                  See where your money goes and stay aware of daily spending.
                </p>
              </div>
              <div className="guest-feature-card">
                <h3>Set Budgets</h3>
                <p>
                  Create spending limits for food, shopping, transport, and
                  more.
                </p>
              </div>
              <div className="guest-feature-card">
                <h3>Build Savings</h3>
                <p>
                  Stay motivated by tracking progress toward your financial
                  goals.
                </p>
              </div>
            </section>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className={`app-shell budget-app ${darkMode ? "" : "light-mode"}`}>
      <SideNav />
      <div className="app-body">
        <AppHeader
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onToggleDark={toggleDarkMode}
        />
        <main className="budget-main">
          {activeTab !== "budgets" && activeTab !== "savings" && (
            <div className="period-filter">
              <label htmlFor="period-select">Filter by: </label>
              <select
                id="period-select"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
              >
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
                <option value="all">All Time</option>
              </select>
            </div>
          )}

          {activeTab !== "budgets" &&
            activeTab !== "savings" &&
            activeTab !== "insights" &&
            activeTab !== "charts" && (
              <section className="summary-grid">
                <SummaryCard
                  title="Biggest Expense"
                  amount={
                    biggestExpenseCategory
                      ? biggestExpenseCategory[0]
                      : "None yet"
                  }
                  subtitle="Add transaction"
                  isEmpty={!biggestExpenseCategory}
                  onEmptyAction={() => setActiveTab("transactions")}
                  className="income-card"
                />
                <SummaryCard
                  title="Total Expenses"
                  amount={currency(totalExpenses)}
                  subtitle={
                    expenseCount === 0
                      ? "Log your first expense"
                      : `${expenseCount} expense transactions`
                  }
                  isEmpty={expenseCount === 0}
                  onEmptyAction={() => setActiveTab("transactions")}
                  className="expense-card"
                />
                <SummaryCard
                  title="Current Income"
                  amount={currency(
                    period === "all" ? allTimeIncome : filteredCurrentBalance,
                  )}
                  subtitle={
                    totalIncome === 0
                      ? "Add income"
                      : `Income for this ${period}`
                  }
                  isEmpty={totalIncome === 0}
                  onEmptyAction={() => setActiveTab("transactions")}
                  className="balance-card"
                />
                <SummaryCard
                  title="Spending Status"
                  amount={spendingStatus}
                  subtitle="Start adding transactions"
                  statusText={
                    expenseCount > 0
                      ? `Total Expenses: ${currency(totalExpenses)}`
                      : undefined
                  }
                  isEmpty={expenseCount === 0}
                  className={`status-card status-${spendingStatus.toLowerCase()}`}
                />
              </section>
            )}

          {activeTab === "transactions" && (
            <TransactionsTab onAddTransaction={handleAddTransaction} />
          )}
          {activeTab === "budgets" && (
            <BudgetsTab
              onAddBudget={handleAddBudget}
              onAddDeposit={handleAddDeposit}
            />
          )}
          {activeTab === "dashboard" && (
            <InsightsTab
              transactions={filteredTransactions}
              budgets={budgets}
              categoryTotals={categoryTotals}
              currentBalance={filteredCurrentBalance}
              period={period}
            />
          )}
          {activeTab === "savings" && (
            <SavingsTab
              savingsGoals={savingsGoals}
              onGoalsUpdate={handleGoalsUpdate}
            />
          )}
          {activeTab === "insights" && (
            <InsightsTab
              transactions={filteredTransactions}
              budgets={budgets}
              categoryTotals={categoryTotals}
              currentBalance={filteredCurrentBalance}
              period={period}
            />
          )}
          {activeTab === "charts" && (
            <ChartsTab
              transactions={transactions}
              currentBalance={currentBalance}
            />
          )}
        </main>
      </div>
    </div>
  );
}

// App Routes Only
export default function App() {
  const { auth, handleLogin, handleLogout, darkMode } = useGlobalContext();

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <div
              className={`app-shell budget-app ${darkMode ? "" : "light-mode"}`}
            >
              <SideNav />
              <div className="app-body">
                <Profile />
                <MobileSubNav />
              </div>
            </div>
          </ProtectedRoute>
        }
      />

      <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
      <Route path="/signup" element={<SignUpPage onLogin={handleLogin} />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route
        path="/simulator"
        element={
          <ProtectedRoute>
            <div
              className={`app-shell budget-app ${darkMode ? "" : "light-mode"}`}
            >
              <SideNav />
              <div className="app-body">
                <WhatIfSimulator />
                <MobileSubNav />
              </div>
            </div>
          </ProtectedRoute>
        }
      />

      <Route
        path="/subscriptions"
        element={
          <ProtectedRoute>
            <div
              className={`app-shell budget-app ${darkMode ? "" : "light-mode"}`}
            >
              <SideNav />
              <div className="app-body">
                <SubscriptionsTab />
                <MobileSubNav />
              </div>
            </div>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
