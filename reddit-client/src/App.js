import React, { useEffect, useMemo, useState } from "react";
import { Routes, Route, Link, Navigate } from "react-router-dom";
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

const API = "http://localhost:5000/api/budget";
const AUTH_STORAGE_KEY = "budget-tracker-auth";
const CACHE_KEY = "budget-data-cache";
const CACHE_TTL = 5 * 60 * 1000;

const DEFAULT_DATA = {
  currentBalance: 0,
  transactions: [],
  budgets: [],
  savingsGoals: [],
};



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

function isTokenExpired(token) {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

function getStoredAuth() {
  const saved = sessionStorage.getItem(AUTH_STORAGE_KEY);
  try {
    const parsed = saved ? JSON.parse(saved) : null;
    if (parsed?.isLoggedIn && isTokenExpired(parsed.token)) {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
      return { isLoggedIn: false, username: "" };
    }
    return parsed?.isLoggedIn ? parsed : { isLoggedIn: false, username: "" };
  } catch (error) {
    return { isLoggedIn: false, username: "" };
  }
}

function getCachedBudgetData() {
  try {
    const item = sessionStorage.getItem(CACHE_KEY);
    if (!item) return null;
    const { data, timestamp } = JSON.parse(item);
    if (Date.now() - timestamp > CACHE_TTL) {
      sessionStorage.removeItem(CACHE_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function setCachedBudgetData(data) {
  try {
    sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ data, timestamp: Date.now() }),
    );
  } catch {
    // storage full or unavailable, skip caching
  }
}

function clearBudgetCache() {
  sessionStorage.removeItem(CACHE_KEY);
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
    } else if (period === "month") {
      return (
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
      );
    } else if (period === "year") {
      return date.getFullYear() === today.getFullYear();
    }
    return true;
  });
}

function ProtectedRoute({ isLoggedIn, children }) {
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// SideNav always visible on desktop, hidden on mobile
function SideNav({ auth, onLogout, transactions }) {
  if (!auth.isLoggedIn) return null;

  return (
    <aside className="side-nav">
      <div className="side-nav-header">
        <h3>
          <Link
            to="/"
            style={{
              textDecoration: "none",
              color: "inherit",
            }}
          >
            SpendWise
          </Link>
        </h3>
        <p>Hi, {auth.username}</p>
      </div>
      <div className="side-nav-links">
        <Link to="/profile" className="side-nav-link">
          👤 Profile
        </Link>
        <Link
          to="/simulator"
          state={{ transactions }}
          className="side-nav-link"
        >
          💡 What-if Simulator
        </Link>
        <Link to="/subscriptions" className="side-nav-link">
          📋 Subscription Watcher
        </Link>
        <button className="side-nav-link side-nav-logout" onClick={onLogout}>
          ➜] Log Out
        </button>
      </div>
    </aside>
  );
}

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

function HomePage({ auth, onLogout, darkMode, onToggleDark }) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [budgetData, setBudgetData] = useState(DEFAULT_DATA);
  const [balanceInput, setBalanceInput] = useState("");
  const [period, setPeriod] = useState("week");

  // Auto-logout when token expires
  useEffect(() => {
    const interval = setInterval(() => {
      if (auth?.token && isTokenExpired(auth.token)) {
        onLogout();
      }
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, [auth?.token, onLogout]);

  useEffect(() => {
    if (auth?.token) {
      if (isTokenExpired(auth.token)) {
        onLogout();
        return;
      }

      const cached = getCachedBudgetData();
      if (cached) {
        setBudgetData(cached);
        return;
      }

      fetch(API, {
        headers: { Authorization: `Bearer ${auth.token}` },
      })
        .then((r) => {
          if (r.status === 401) {
            onLogout();
            return null;
          }
          return r.json();
        })
        .then((data) => {
          if (!data) return;
          if (data && typeof data === "object") {
            setBudgetData({
              currentBalance: data.currentBalance ?? 0,
              transactions: Array.isArray(data.transactions)
                ? data.transactions
                : [],
              budgets: Array.isArray(data.budgets) ? data.budgets : [],
              savingsGoals: Array.isArray(data.savingsGoals)
                ? data.savingsGoals
                : [],
            });
            setCachedBudgetData(data);
          } else {
            setBudgetData(DEFAULT_DATA);
          }
        })
        .catch((err) => {
          console.error("Failed to load budget data", err);
          setBudgetData(DEFAULT_DATA);
        });
    } else {
      setBudgetData(DEFAULT_DATA);
    }
  }, [auth?.token]);

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
        onLogout();
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

  const handleAddTransaction = async (newTransaction) => {
    const safeTransaction = {
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
        body: JSON.stringify(safeTransaction),
      });
      if (res.status === 401) {
        onLogout();
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

  const handleGoalsUpdate = (updatedData) => {
    setBudgetData(updatedData);
    setCachedBudgetData(updatedData);
  };

  const handleAddBudget = async (newBudget) => {
    const safeBudget = {
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
        body: JSON.stringify(safeBudget),
      });
      if (res.status === 401) {
        onLogout();
        return;
      }
      const updated = await res.json();
      setBudgetData(updated);
      setCachedBudgetData(updated);
    } catch (err) {
      console.error("Failed to add budget", err);
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
        onLogout();
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
        .filter((item) => item.type === "income")
        .reduce((sum, item) => sum + item.amount, 0),
    [filteredTransactions],
  );

  const totalExpenses = useMemo(
    () =>
      filteredTransactions
        .filter((item) => item.type === "expense")
        .reduce((sum, item) => sum + item.amount, 0),
    [filteredTransactions],
  );

  const expenseCount = filteredTransactions.filter(
    (item) => item.type === "expense",
  ).length;

  const allTimeIncome = transactions
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + item.amount, 0);

  const filteredCurrentBalance =
    filteredTransactions
      .filter((item) => item.type === "income")
      .reduce((sum, item) => sum + item.amount, 0) -
    filteredTransactions
      .filter((item) => item.type === "expense")
      .reduce((sum, item) => sum + item.amount, 0);

  const spendingRate =
    (period === "all" ? allTimeIncome : filteredCurrentBalance) > 0
      ? (totalExpenses /
          (period === "all" ? allTimeIncome : filteredCurrentBalance)) *
        100
      : 0;

  const spendingStatus =
    spendingRate < 50 ? "Good" : spendingRate < 80 ? "Warning" : "Critical";

  const categoryTotals = useMemo(() => {
    return filteredTransactions
      .filter((item) => item.type === "expense")
      .reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + item.amount;
        return acc;
      }, {});
  }, [filteredTransactions]);

  const biggestExpenseCategory = useMemo(() => {
    const entries = Object.entries(categoryTotals);
    if (entries.length === 0) return null;
    return entries.reduce((max, curr) => (curr[1] > max[1] ? curr : max));
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

  // Logged-in view
  return (
    <div className={`app-shell budget-app ${darkMode ? "" : "light-mode"}`}>
      {/* Sidebar — always visible on desktop, hidden on mobile via CSS */}
      <SideNav auth={auth} onLogout={onLogout} transactions={transactions} />

      {/* Main content area */}
      <div className="app-body">
        <AppHeader
          auth={auth}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          darkMode={darkMode}
          onToggleDark={onToggleDark}
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
            <TransactionsTab
              transactions={transactions}
              onAddTransaction={handleAddTransaction}
            />
          )}

          {activeTab === "budgets" && (
            <BudgetsTab
              budgets={budgets}
              categoryTotals={categoryTotals}
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
              auth={auth}
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
              darkMode={darkMode}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const [auth, setAuth] = useState(getStoredAuth());
  const [darkMode, setDarkMode] = useState(true);

  const handleLogin = (authData) => {
    clearBudgetCache();
    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
    setAuth(authData);
  };

  const handleLogout = () => {
    clearBudgetCache();
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    setAuth({ isLoggedIn: false, username: "", token: "" });
  };

  useEffect(() => {
    setAuth(getStoredAuth());
  }, []);

  return (
    <Routes>
      <Route
        path="/"
        element={
          <HomePage
            auth={auth}
            onLogout={handleLogout}
            darkMode={darkMode}
            onToggleDark={() => setDarkMode((prev) => !prev)}
          />
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute isLoggedIn={auth.isLoggedIn}>
            <div
              className={`app-shell budget-app ${darkMode ? "" : "light-mode"}`}
            >
              <SideNav auth={auth} onLogout={handleLogout} transactions={[]} />
              <div className="app-body">
                <Profile />
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
          <ProtectedRoute isLoggedIn={auth.isLoggedIn}>
            <div
              className={`app-shell budget-app ${darkMode ? "" : "light-mode"}`}
            >
              <SideNav auth={auth} onLogout={handleLogout} transactions={[]} />
              <div className="app-body">
                <WhatIfSimulator />
              </div>
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/subscriptions"
        element={
          <ProtectedRoute isLoggedIn={auth.isLoggedIn}>
            <div
              className={`app-shell budget-app ${darkMode ? "" : "light-mode"}`}
            >
              <SideNav auth={auth} onLogout={handleLogout} transactions={[]} />
              <div className="app-body">
                <SubscriptionsTab token={auth.token} />
              </div>
            </div>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
