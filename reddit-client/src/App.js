import React, { useEffect, useMemo, useState } from "react";
import { Routes, Route, Link, Navigate } from "react-router-dom";
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

const API = "http://localhost:5000/api/budget";
const AUTH_STORAGE_KEY = "budget-tracker-auth";
const CACHE_KEY = "budget-data-cache";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const DEFAULT_DATA = {
  currentBalance: 0,
  transactions: [],
  budgets: [],
  savingsGoals: [],
};

function getStoredAuth() {
  const saved = localStorage.getItem(AUTH_STORAGE_KEY);
  try {
    const parsed = saved ? JSON.parse(saved) : null;
    return parsed?.isLoggedIn ? parsed : { isLoggedIn: false, username: "" };
  } catch (error) {
    return { isLoggedIn: false, username: "" };
  }
}

function getCachedBudgetData() {
  try {
    const item = localStorage.getItem(CACHE_KEY);
    if (!item) return null;
    const { data, timestamp } = JSON.parse(item);
    if (Date.now() - timestamp > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function setCachedBudgetData(data) {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ data, timestamp: Date.now() }),
    );
  } catch {
    // storage full or unavailable, skip caching
  }
}

function clearBudgetCache() {
  localStorage.removeItem(CACHE_KEY);
}

function currency(amount) {
  return `₱${Math.round(Number(amount || 0))}`;
}

function filterTransactions(transactions, period) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return transactions.filter((t) => {
    const [year, month, day] = t.date.split("-").map(Number);
    const date = new Date(year, month - 1, day);

    if (period === "week") {
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7);
      return date >= weekAgo && date <= today;
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

function SideNav({ auth, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {auth.isLoggedIn && (
        <button
          className={`side-nav-toggle ${isOpen ? "open" : ""}`}
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? "✕" : "☰"}
        </button>
      )}

      {auth.isLoggedIn && (
        <aside className={`side-nav ${isOpen ? "open" : ""}`}>
          <div className="side-nav-header">
            <h3>Menu</h3>
            <p>{auth.isLoggedIn ? `Hi, ${auth.username}` : "Welcome"}</p>
          </div>

          <div className="side-nav-links">
            {!auth.isLoggedIn ? (
              <>
                <Link
                  to="/login"
                  className="side-nav-link"
                  onClick={() => setIsOpen(false)}
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="side-nav-link side-nav-link-alt"
                  onClick={() => setIsOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/profile"
                  className="side-nav-link"
                  onClick={() => setIsOpen(false)}
                >
                  Profile
                </Link>
                <button
                  className="side-nav-link side-nav-logout"
                  onClick={() => {
                    onLogout();
                    setIsOpen(false);
                  }}
                >
                  Log Out
                </button>
              </>
            )}
          </div>
        </aside>
      )}

      {auth.isLoggedIn && isOpen && (
        <div className="side-nav-overlay" onClick={() => setIsOpen(false)} />
      )}
    </>
  );
}

function SummaryCard({ title, amount, subtitle, className, statusText }) {
  return (
    <div className={`summary-card ${className || ""}`}>
      <p className="summary-title">{title}</p>
      <h3 className="summary-amount">{amount}</h3>
      <p className="summary-subtitle">{statusText || subtitle}</p>
    </div>
  );
}

function HomePage({ auth, onLogout }) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [budgetData, setBudgetData] = useState(DEFAULT_DATA);
  const [balanceInput, setBalanceInput] = useState("");
  const [period, setPeriod] = useState("month");
  const [darkMode, setDarkMode] = useState(true);

  // Load data — use cache if fresh, otherwise fetch from API
  useEffect(() => {
    if (auth?.token) {
      const cached = getCachedBudgetData();
      if (cached) {
        setBudgetData(cached);
        return;
      }

      fetch(API, {
        headers: { Authorization: `Bearer ${auth.token}` },
      })
        .then((r) => r.json())
        .then((data) => {
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
    try {
      clearBudgetCache(); // bust cache before mutation
      const res = await fetch(`${API}/transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify(newTransaction),
      });
      const updated = await res.json();
      if (updated && Array.isArray(updated.transactions)) {
        setBudgetData(updated);
        setCachedBudgetData(updated);
      } else {
        console.error("Unexpected response from server:", updated);
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
    try {
      clearBudgetCache(); // bust cache before mutation
      const res = await fetch(`${API}/budgets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify(newBudget),
      });
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
      const updated = await res.json();

      // Merge instead of replace
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

  const totalIncome = useMemo(() => {
    return filteredTransactions
      .filter((item) => item.type === "income")
      .reduce((sum, item) => sum + item.amount, 0);
  }, [filteredTransactions]);

  const totalExpenses = useMemo(() => {
    return filteredTransactions
      .filter((item) => item.type === "expense")
      .reduce((sum, item) => sum + item.amount, 0);
  }, [filteredTransactions]);

  const balance = currentBalance;
  const expenseCount = filteredTransactions.filter(
    (item) => item.type === "expense",
  ).length;

  // Derive the balance dynamically from all transactions
  const totalAllTimeIncome = transactions
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + item.amount, 0);

  const totalAllTimeExpenses = transactions
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + item.amount, 0);

  const filteredCurrentBalance =
    filteredTransactions
      .filter((item) => item.type === "income")
      .reduce((sum, item) => sum + item.amount, 0) -
    filteredTransactions
      .filter((item) => item.type === "expense")
      .reduce((sum, item) => sum + item.amount, 0);

  const allTimeIncome = transactions
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + item.amount, 0);

  const dynamicIncome =
    period === "all" ? allTimeIncome : filteredCurrentBalance;

  const spendingRate =
    dynamicIncome > 0 ? (totalExpenses / dynamicIncome) * 100 : 0;
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

  if (!auth.isLoggedIn) {
    return (
      <div className="app-shell budget-app">
        <SideNav auth={auth} onLogout={onLogout} />
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
      <SideNav auth={auth} onLogout={onLogout} />

      <header className="budget-header">
        <h1>SpendWise</h1>
        <div className="tab-nav">
          <button
            className={activeTab === "dashboard" ? "active" : ""}
            onClick={() => setActiveTab("dashboard")}
          >
            Dashboard
          </button>
          <button
            className={activeTab === "transactions" ? "active" : ""}
            onClick={() => setActiveTab("transactions")}
          >
            Transactions
          </button>
          <button
            className={activeTab === "budgets" ? "active" : ""}
            onClick={() => setActiveTab("budgets")}
          >
            Budgets
          </button>
          <button
            className={activeTab === "savings" ? "active" : ""}
            onClick={() => setActiveTab("savings")}
          >
            Savings
          </button>
          <button
            className={activeTab === "insights" ? "active" : ""}
            onClick={() => setActiveTab("insights")}
          >
            Insights
          </button>
          <button
            className={activeTab === "charts" ? "active" : ""}
            onClick={() => setActiveTab("charts")}
          >
            Charts
          </button>
        </div>
        <div
          className="auth-status"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            justifyContent: "center",
          }}
        >
          <span>
            Logged in as <strong>{auth.username}</strong>
          </span>
          <NotificationBell token={auth.token} />
          <button
            onClick={() => setDarkMode((prev) => !prev)}
            style={{
              background: "transparent",
              border: "1px solid var(--border)",
              borderRadius: "10px",
              padding: "6px 14px",
              color: "var(--text)",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "700",
              transition: "0.2s ease",
            }}
          >
            {darkMode ? "☀️ Light" : "🌙 Dark"}
          </button>
        </div>
      </header>

      <main className="budget-main">
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

        <section className="summary-grid">
          <SummaryCard
            title="Biggest Expense"
            amount={biggestExpenseCategory ? biggestExpenseCategory[0] : "None"}
            subtitle={
              biggestExpenseCategory
                ? currency(biggestExpenseCategory[1])
                : "No Expenses yet"
            }
            className="income-card"
          />
          <SummaryCard
            title="Total Expenses"
            amount={currency(totalExpenses)}
            subtitle={`${expenseCount} expense transactions`}
            className="expense-card"
          />
          <SummaryCard
            title="Current Income"
            amount={currency(
              period === "all" ? allTimeIncome : filteredCurrentBalance,
            )}
            subtitle={
              period === "all"
                ? `Total income (all time)`
                : `Income for ${period === "week" ? "this week" : period === "month" ? "this month" : "this year"}`
            }
            className="balance-card"
          />
          <SummaryCard
            title="Spending Status"
            amount={spendingStatus}
            subtitle={`${spendingRate.toFixed(0)}% of income spent`}
            statusText={`Total Expenses: ${currency(totalExpenses)}`}
            className={`status-card status-${spendingStatus.toLowerCase()}`}
          />
        </section>

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
          />
        )}
      </main>
    </div>
  );
}

export default function App() {
  const [auth, setAuth] = useState(getStoredAuth());

  const handleLogin = (authData) => {
    clearBudgetCache(); // clear stale cache from previous session
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
    setAuth(authData);
  };

  const handleLogout = () => {
    clearBudgetCache(); // clear cache on logout
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setAuth({ isLoggedIn: false, username: "", token: "" });
  };

  useEffect(() => {
    setAuth(getStoredAuth());
  }, []);

  return (
    <Routes>
      <Route
        path="/"
        element={<HomePage auth={auth} onLogout={handleLogout} />}
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute isLoggedIn={auth.isLoggedIn}>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
      <Route path="/signup" element={<SignUpPage onLogin={handleLogin} />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
    </Routes>
  );
}
