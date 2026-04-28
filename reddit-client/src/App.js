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

const API = "http://localhost:5000/api/budget";
const AUTH_STORAGE_KEY = "budget-tracker-auth";

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

function currency(amount) {
  return `₱${Math.round(Number(amount || 0))}`;
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

function SavingsTab({ savingsGoals }) {
  return (
    <section className="panel-card savings-panel">
      <h2>Savings Goals</h2>
      {savingsGoals.length === 0 ? (
        <div className="empty-savings">
          <div className="savings-icon">◎</div>
          <h3>No savings goals at the moment.</h3>
          <p>Let's start saving! Set your first goal to track your progress.</p>
        </div>
      ) : (
        <div className="savings-list">
          {savingsGoals.map((goal) => (
            <div key={goal.id} className="savings-goal-card">
              <h4>{goal.title}</h4>
              <p>
                {currency(goal.saved)} saved of {currency(goal.target)}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function HomePage({ auth, onLogout }) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [budgetData, setBudgetData] = useState(DEFAULT_DATA);
  const [balanceInput, setBalanceInput] = useState("");

  // ✅ Load data from MongoDB with safety check
  useEffect(() => {
    if (auth?.token) {
      fetch(API, {
        headers: { Authorization: `Bearer ${auth.token}` },
      })
        .then((r) => r.json())
        .then((data) => {
          if (data && data.transactions) {
            setBudgetData(data);
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
      }
    } catch (err) {
      console.error("Failed to save deposit", err);
    }
  };

  const handleAddTransaction = async (newTransaction) => {
    try {
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
      } else {
        console.error("Unexpected response from server:", updated);
      }
    } catch (err) {
      console.error("Failed to add transaction", err);
    }
  };

  const handleAddBudget = async (newBudget) => {
    try {
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
    } catch (err) {
      console.error("Failed to add budget", err);
    }
  };

  const handleSetCurrentBalance = async () => {
    const parsedBalance = parseInt(balanceInput, 10);
    console.log("Parsed balance:", parsedBalance);
    if (
      balanceInput.trim() === "" ||
      !Number.isInteger(parsedBalance) ||
      parsedBalance <= 0
    )
      return;

    try {
      const res = await fetch(`${API}/balance`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ addBalance: parsedBalance }),
      });
      console.log("Response status:", res.status);
      const updated = await res.json();
      console.log("Updated data from server:", updated);
      setBudgetData({ ...updated });
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

  const totalIncome = useMemo(() => {
    return transactions
      .filter((item) => item.type === "income")
      .reduce((sum, item) => sum + item.amount, 0);
  }, [transactions]);

  const totalExpenses = useMemo(() => {
    return transactions
      .filter((item) => item.type === "expense")
      .reduce((sum, item) => sum + item.amount, 0);
  }, [transactions]);

  const balance = currentBalance;
  const incomeCount = transactions.filter(
    (item) => item.type === "income",
  ).length;
  const expenseCount = transactions.filter(
    (item) => item.type === "expense",
  ).length;
  const spendingRate =
    totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0;
  const spendingStatus =
    spendingRate < 50 ? "Good" : spendingRate < 80 ? "Warning" : "Critical";

  const categoryTotals = useMemo(() => {
    return transactions
      .filter((item) => item.type === "expense")
      .reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + item.amount;
        return acc;
      }, {});
  }, [transactions]);

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
    <div className="app-shell budget-app">
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
        <div className="auth-status">
          <span>
            Logged in as <strong>{auth.username}</strong>
          </span>
        </div>
      </header>

      <main className="budget-main">
        {activeTab !== "budgets" &&
          activeTab !== "insights" &&
          activeTab !== "charts" && (
            <section className="panel-card current-balance-editor">
              <div className="current-balance-editor-head">
                <div>
                  <h2>Income</h2>
                  <p className="current-balance-editor-text">
                    Enter an amount to add to your current Income.
                  </p>
                </div>
              </div>
              <div className="current-balance-form">
                <div className="transaction-field">
                  <label htmlFor="currentBalance">Current Income</label>
                  <input
                    id="currentBalance"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Enter amount to add"
                    value={balanceInput}
                    onChange={(e) => setBalanceInput(e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  className="transaction-submit-btn"
                  onClick={handleSetCurrentBalance}
                >
                  Add to Income
                </button>
              </div>
            </section>
          )}

        <section className="summary-grid">
          <SummaryCard
            title="Total Income"
            amount={currency(totalIncome)}
            subtitle={`${incomeCount} income transactions`}
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
            amount={currency(balance)}
            subtitle="Your saved balance updated by transactions"
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
            transactions={transactions}
            budgets={budgets}
            categoryTotals={categoryTotals}
            currentBalance={currentBalance}
          />
        )}

        {activeTab === "savings" && <SavingsTab savingsGoals={savingsGoals} />}

        {activeTab === "insights" && (
          <InsightsTab
            transactions={transactions}
            budgets={budgets}
            categoryTotals={categoryTotals}
            currentBalance={currentBalance}
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
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
    setAuth(authData);
  };

  const handleLogout = () => {
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
