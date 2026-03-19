import React, { useEffect, useMemo, useState } from "react";
import { Routes, Route, Link, Navigate } from "react-router-dom";
import "./App.css";
import Profile from "./Profile";
import CreatePage from "./CreatePage";
import LoginPage from "./LoginPage";
import SignUpPage from "./SignUpPage";
import NewsPage from "./NewsPage";
import ForgotPassword from "./ForgotPassword";

const AUTH_STORAGE_KEY = "budget-tracker-auth";
const BUDGET_STORAGE_KEY = "budget-tracker-data";

const DEFAULT_DATA = {
  transactions: [
    {
      id: 1,
      type: "income",
      category: "Salary",
      title: "Monthly Salary",
      amount: 2500,
      date: "2025-03-01",
    },
    {
      id: 2,
      type: "expense",
      category: "Food",
      title: "Groceries",
      amount: 120,
      date: "2025-03-02",
    },
    {
      id: 3,
      type: "expense",
      category: "Shopping",
      title: "Clothes",
      amount: 80,
      date: "2025-03-03",
    },
    {
      id: 4,
      type: "expense",
      category: "Entertainment",
      title: "Movie Night",
      amount: 40,
      date: "2025-03-04",
    },
    {
      id: 5,
      type: "expense",
      category: "Transportation",
      title: "Gas",
      amount: 60,
      date: "2025-03-05",
    },
  ],
  budgets: [
    { category: "Food", limit: 250 },
    { category: "Shopping", limit: 250 },
    { category: "Entertainment", limit: 250 },
    { category: "Transportation", limit: 150 },
  ],
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

function getStoredBudgetData() {
  const saved = localStorage.getItem(BUDGET_STORAGE_KEY);

  try {
    const parsed = saved ? JSON.parse(saved) : null;
    return parsed || DEFAULT_DATA;
  } catch (error) {
    return DEFAULT_DATA;
  }
}

function currency(amount) {
  return `$${Number(amount || 0).toFixed(2)}`;
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
      <button
        className={`side-nav-toggle ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? "✕" : "☰"}
      </button>

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
              <Link
                to="/news"
                className="side-nav-link"
                onClick={() => setIsOpen(false)}
              >
                News
              </Link>
              <Link
                to="/create"
                className="side-nav-link side-nav-link-alt"
                onClick={() => setIsOpen(false)}
              >
                Create Page
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

      {isOpen && (
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

function BudgetProgress({ category, spent, limit }) {
  const percentage = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;

  return (
    <div className="budget-progress-item">
      <div className="budget-progress-head">
        <span>{category}</span>
        <span>
          {currency(spent)} spent of {currency(limit)}
        </span>
      </div>
      <div className="budget-progress-bar">
        <div
          className="budget-progress-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function TransactionsTab({ transactions }) {
  return (
    <section className="panel-card">
      <h2>Recent Transactions</h2>
      {transactions.length === 0 ? (
        <p className="empty-text">No transactions yet.</p>
      ) : (
        <div className="transactions-list">
          {transactions.map((transaction) => (
            <div key={transaction.id} className="transaction-row">
              <div>
                <h4>{transaction.title}</h4>
                <p>
                  {transaction.category} • {transaction.date}
                </p>
              </div>
              <strong
                className={
                  transaction.type === "income"
                    ? "amount-income"
                    : "amount-expense"
                }
              >
                {transaction.type === "income" ? "+" : "-"}
                {currency(transaction.amount)}
              </strong>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function BudgetsTab({ budgets, categoryTotals }) {
  return (
    <section className="panel-card">
      <h2>Budget Overview</h2>
      <div className="budget-progress-list">
        {budgets.map((budget) => (
          <BudgetProgress
            key={budget.category}
            category={budget.category}
            spent={categoryTotals[budget.category] || 0}
            limit={budget.limit}
          />
        ))}
      </div>
    </section>
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

  useEffect(() => {
    setBudgetData(getStoredBudgetData());
  }, []);

  useEffect(() => {
    localStorage.setItem(BUDGET_STORAGE_KEY, JSON.stringify(budgetData));
  }, [budgetData]);

  const { transactions, budgets, savingsGoals } = budgetData;

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

  const balance = totalIncome - totalExpenses;

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
                  more.{" "}
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
        <h1>Personal Budget Tracker</h1>

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
        </div>

        <div className="auth-status">
          <span>
            Logged in as <strong>{auth.username}</strong>
          </span>
        </div>
      </header>

      <main className="budget-main">
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
            title="Current Balance"
            amount={currency(balance)}
            subtitle="Net balance from all transactions"
            className="balance-card"
          />
          <SummaryCard
            title="Spending Status"
            amount={spendingStatus}
            subtitle={`${spendingRate.toFixed(0)}% of income spent`}
            className="status-card"
          />
        </section>

        {activeTab === "dashboard" && (
          <section className="dashboard-grid">
            <BudgetsTab budgets={budgets} categoryTotals={categoryTotals} />
            <SavingsTab savingsGoals={savingsGoals} />
          </section>
        )}

        {activeTab === "transactions" && (
          <TransactionsTab transactions={transactions} />
        )}

        {activeTab === "budgets" && (
          <BudgetsTab budgets={budgets} categoryTotals={categoryTotals} />
        )}

        {activeTab === "savings" && <SavingsTab savingsGoals={savingsGoals} />}
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
    setAuth({ isLoggedIn: false, username: "" });
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
      <Route path="/profile" element={<Profile />} />
      <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
      <Route path="/signup" element={<SignUpPage onLogin={handleLogin} />} />
      <Route path="/news" element={<NewsPage />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route
        path="/create"
        element={
          <ProtectedRoute isLoggedIn={auth.isLoggedIn}>
            <CreatePage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
