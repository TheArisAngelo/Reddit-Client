import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import {
  FiTrendingDown,
  FiDollarSign,
  FiBarChart2,
  FiTarget,
  FiZap,
  FiFlame,
  FiAward,
  FiMoon,
  FiAlertTriangle,
} from "react-icons/fi";

import axios from "axios";
import "./App.css";

const AUTH_STORAGE_KEY = "budget-tracker-auth";
const API = "http://localhost:5000/api/auth";
const BUDGET_API = "http://localhost:5000/api/budget";

function getInitials(username) {
  if (!username) return "?";
  const parts = username.trim().split(/[\s_-]+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return username.slice(0, 2).toUpperCase();
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function getToken() {
  const raw = sessionStorage.getItem(AUTH_STORAGE_KEY);
  const parsed = raw ? JSON.parse(raw) : null;
  return parsed?.token || null;
}

function BadgeIcon({ type, size, color }) {
  switch (type) {
    case "award":
      return <FiAward size={size} color={color} />;
    case "flame":
      return <FiTrendingDown size={size} color={color} />;
    case "zap":
      return <FiZap size={size} color={color} />;
    case "target":
      return <FiTarget size={size} color={color} />;
    case "trending":
      return <FiTrendingDown size={size} color={color} />;
    case "moon":
      return <FiMoon size={size} color={color} />;
    default:
      return <FiZap size={size} color={color} />;
  }
}

// Verification steps: "idle" | "enterEmail" | "enterOtp" | "done"
export default function Profile() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Avatar state
  const [avatarUrl, setAvatarUrl] = useState(null);
  const fileInputRef = useRef(null);

  // Verification state
  const [verifyStep, setVerifyStep] = useState("idle");
  const [emailInput, setEmailInput] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [verifySuccess, setVerifySuccess] = useState("");
  const [countdown, setCountdown] = useState(0);

  const [budgetSummary, setBudgetSummary] = useState(null);
  const [spendingBadge, setSpendingBadge] = useState(null);

  // Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    fetchProfile();
    fetchBudgetSummary();
  }, []);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const fetchProfile = async () => {
    try {
      const token = getToken();
      if (!token) {
        setError("No token found. Please log in.");
        setLoading(false);
        return;
      }
      const response = await axios.get(`${API}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(response.data.user);
      if (response.data.user.avatar) {
        const url = `http://localhost:5000${response.data.user.avatar}`;
        setAvatarUrl(url);
        sessionStorage.setItem("user-avatar", url); // ← add this
      }
      if (response.data.user.email) {
        setEmailInput(response.data.user.email);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load user profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const res = await axios.post(`${API}/me/avatar`, formData, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setAvatarUrl(`http://localhost:5000${res.data.avatarUrl}`);
      sessionStorage.setItem(
        "user-avatar",
        `http://localhost:5000${res.data.avatarUrl}`,
      );
    } catch (err) {
      console.error("Avatar upload failed", err);
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      await axios.delete(`${API}/me/avatar`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setAvatarUrl(null);
      sessionStorage.removeItem("user-avatar");
    } catch (err) {
      console.error("Failed to remove avatar", err);
    }
  };

  const fetchBudgetSummary = async () => {
    try {
      const token = getToken();
      if (!token) return;
      const res = await axios.get(BUDGET_API, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const { transactions = [], budgets = [], savingsGoals = [] } = res.data;

      const now = new Date();
      const thisMonth = transactions.filter((t) => {
        const d = new Date(t.date);
        return (
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      });

      const totalSpentThisMonth = thisMonth
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);

      const totalSaved = savingsGoals.reduce(
        (sum, g) => sum + (g.saved || 0),
        0,
      );
      const activeBudgets = budgets.length;
      const completedGoals = savingsGoals.filter(
        (g) => g.saved >= g.target,
      ).length;

      setBudgetSummary({
        totalSpentThisMonth,
        totalSaved,
        activeBudgets,
        completedGoals,
      });
      const badge = computeSpendingBadge(transactions, budgets, savingsGoals);
      setSpendingBadge(badge);
    } catch (err) {
      console.error("Failed to load budget summary", err);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteError("");
    if (!deleteInput.trim()) {
      setDeleteError("Please enter your username or email.");
      return;
    }
    setDeleteLoading(true);
    try {
      await axios.delete(`${API}/me`, {
        headers: { Authorization: `Bearer ${getToken()}` },
        data: { identifier: deleteInput.trim() },
      });
      // Clear session and redirect to login
      sessionStorage.clear();
      window.location.href = "/login";
    } catch (err) {
      setDeleteError(
        err.response?.data?.message || "Failed to delete account.",
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const computeSpendingBadge = (transactions, budgets, savingsGoals) => {
    const now = new Date();

    const thisMonthTransactions = transactions.filter((t) => {
      const d = new Date(t.date);
      return (
        d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      );
    });

    const monthlyIncome = thisMonthTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyExpenses = thisMonthTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => t.amount, 0);

    const spendingRate =
      monthlyIncome > 0 ? (monthlyExpenses / monthlyIncome) * 100 : 0;

    const hasTransactions = transactions.length > 0;
    const hasBudgets = budgets.length > 0;
    const hasGoals = savingsGoals.length > 0;
    const completedGoals = savingsGoals.filter(
      (g) => g.saved >= g.target,
    ).length;

    if (!hasTransactions) {
      return {
        label: "Getting Started",
        description: "Add your first transaction to get started.",
        color: "#94a3b8",
        bg: "rgba(148, 163, 184, 0.12)",
        border: "rgba(148, 163, 184, 0.25)",
        icon: "moon",
      };
    }
    if (completedGoals > 0) {
      return {
        label: "Goal Crusher",
        description: `You've completed ${completedGoals} savings goal${completedGoals > 1 ? "s" : ""}. Outstanding!`,
        color: "#fbbf24",
        bg: "rgba(251, 191, 36, 0.12)",
        border: "rgba(251, 191, 36, 0.25)",
        icon: "award",
      };
    }

    if (spendingRate >= 80) {
      return {
        label: "High Spender",
        description:
          "Your expenses are consuming most of your income this month.",
        color: "#fb7185",
        bg: "rgba(251, 113, 133, 0.12)",
        border: "rgba(251, 113, 133, 0.25)",
        icon: "flame",
      };
    }

    if (hasBudgets && hasGoals && spendingRate < 50) {
      return {
        label: "On Track",
        description:
          "You have budgets, savings goals, and healthy spending. Keep it up!",
        color: "#60a5fa",
        bg: "rgba(96, 165, 250, 0.12)",
        border: "rgba(96, 165, 250, 0.25)",
        icon: "zap",
      };
    }

    if (hasBudgets && spendingRate < 80) {
      return {
        label: "Budget Conscious",
        description: "You're managing your budgets well this month.",
        color: "#c084fc",
        bg: "rgba(192, 132, 252, 0.12)",
        border: "rgba(192, 132, 252, 0.25)",
        icon: "target",
      };
    }

    if (hasGoals && spendingRate < 50) {
      return {
        label: "Smart Saver",
        description:
          "You're spending wisely and working toward your savings goals.",
        color: "#34d399",
        bg: "rgba(52, 211, 153, 0.12)",
        border: "rgba(52, 211, 153, 0.25)",
        icon: "trending",
      };
    }

    // Fallback
    return {
      label: "Getting Started",
      description:
        "Set up budgets and savings goals to unlock your spending personality.",
      color: "#94a3b8",
      bg: "rgba(148, 163, 184, 0.12)",
      border: "rgba(148, 163, 184, 0.25)",
      icon: "moon",
    };
  };

  const handleSendOtp = async () => {
    setVerifyError("");
    setVerifySuccess("");
    if (!emailInput.trim()) {
      setVerifyError("Please enter your email address.");
      return;
    }
    setVerifyLoading(true);
    try {
      await axios.post(
        `${API}/send-otp`,
        { email: emailInput.trim() },
        { headers: { Authorization: `Bearer ${getToken()}` } },
      );
      setVerifyStep("enterOtp");
      setVerifySuccess("A 6-digit code was sent to your email.");
      setCountdown(60);
    } catch (err) {
      setVerifyError(err.response?.data?.message || "Failed to send OTP.");
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setVerifyError("");
    setVerifySuccess("");
    if (!otpInput.trim()) {
      setVerifyError("Please enter the code from your email.");
      return;
    }
    setVerifyLoading(true);
    try {
      await axios.post(
        `${API}/verify-otp`,
        { otp: otpInput.trim() },
        { headers: { Authorization: `Bearer ${getToken()}` } },
      );
      setVerifyStep("done");
      setVerifySuccess("Your email has been verified!");
      setUser((prev) => ({ ...prev, isVerified: true, email: emailInput }));
    } catch (err) {
      setVerifyError(
        err.response?.data?.message || "Incorrect or expired code.",
      );
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleResend = () => {
    setOtpInput("");
    setVerifyError("");
    setVerifySuccess("");
    setVerifyStep("enterEmail");
  };

  // Render states
  if (loading) {
    return (
      <main className="profile-new-layout">
        <div className="profile-new-loading">
          <div className="profile-new-spinner" />
          <p>Loading profile…</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="login-layout">
        <section className="create-card login-card">
          <div className="lane-chip">Profile</div>
          <div className="lane-error">{error}</div>
          <div style={{ marginTop: "16px", display: "flex", gap: "12px" }}>
            <Link to="/" className="nav-btn">
              Home
            </Link>
            <Link to="/login" className="nav-btn">
              Log In
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const initials = getInitials(user?.username);
  const memberSince = formatDate(user?.createdAt);
  const isVerified = user?.isVerified ?? false;
  const isGoogleUser = !!user?.firebaseUid;

  return (
    <main className="profile-new-layout">
      {/* Page header */}
      <div className="profile-new-header">
        <p className="eyebrow">Profile</p>
        <h1 className="create-page-title">Your account details</h1>
      </div>

      <div className="profile-new-card">
        {/* Avatar + name strip */}
        <div className="profile-new-hero">
          <div
            className="profile-new-avatar"
            onClick={() => fileInputRef.current?.click()}
            style={{
              cursor: "pointer",
              position: "relative",
              overflow: "hidden",
            }}
            title="Click to change photo"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Profile"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: "inherit",
                }}
              />
            ) : (
              initials
            )}
            {/* Hover overlay */}
            <div
              className="avatar-edit-overlay"
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0,0,0,0.45)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: 0,
                transition: "opacity 0.2s",
                fontSize: "11px",
                color: "#fff",
                fontWeight: 600,
                letterSpacing: "0.05em",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = 1)}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = 0)}
            >
              EDIT
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleAvatarChange}
            />
          </div>

          {/* Remove photo button — only shows if avatar is set */}
          {avatarUrl && (
            <button
              onClick={handleRemoveAvatar}
              style={{
                fontSize: "11px",
                color: "#fb7185",
                background: "none",
                border: "none",
                cursor: "pointer",
                marginTop: "6px",
                alignSelf: "center",
              }}
            >
              Remove photo
            </button>
          )}
          <div className="profile-new-hero-info">
            <h2 className="profile-new-name">{user?.username}</h2>
            <p className="profile-new-location">
              {[user?.place, user?.country].filter(Boolean).join(", ") || "—"}
            </p>
          </div>
          <div className="profile-new-badges">
            {isVerified && (
              <span className="profile-badge profile-badge--verified">
                ✓ Verified
              </span>
            )}
            {isGoogleUser && (
              <span className="profile-badge profile-badge--google">
                G Google
              </span>
            )}
          </div>
        </div>

        {/* Financial Summary Strip */}
        {budgetSummary && (
          <div className="profile-summary-strip">
            <div className="profile-summary-item">
              <span className="profile-summary-icon">
                <FiTrendingDown size={22} color="#fb7185" />
              </span>
              <span className="profile-summary-label">Spent this month</span>
              <span
                className="profile-summary-value"
                style={{ color: "#fb7185" }}
              >
                ₱{budgetSummary.totalSpentThisMonth.toLocaleString()}
              </span>
            </div>
            <div className="profile-summary-item">
              <span className="profile-summary-icon">
                <FiDollarSign size={22} color="#34d399" />
              </span>

              <span className="profile-summary-label">Saved Toward Goals</span>
              <span
                className="profile-summary-value"
                style={{ color: "#34d399" }}
              >
                ₱{budgetSummary.totalSaved.toLocaleString()}
              </span>
            </div>
            <div className="profile-summary-item">
              <span className="profile-summary-icon">
                <FiBarChart2 size={22} color="#818cf8" />
              </span>
              <span className="profile-summary-label">Active Budgets</span>
              <span
                className="profile-summary-value"
                style={{ color: "#818cf8" }}
              >
                {budgetSummary.activeBudgets}
              </span>
            </div>
            <div className="profile-summary-item">
              <span className="profile-summary-icon">
                <FiTarget size={22} color="#c084fc" />
              </span>
              <span className="profile-summary-label">
                {" "}
                Savings Goals Completed
              </span>
              <span
                className="profile-summary-value"
                style={{ color: "#c084fc" }}
              >
                {budgetSummary.completedGoals}
              </span>
            </div>
          </div>
        )}

        {/* Spending Personality Badge */}
        {spendingBadge && (
          <div className="profile-new-section">
            <p className="profile-new-section-label">Spending Personality</p>
            <div
              className="profile-badge-card"
              style={{
                background: spendingBadge.bg,
                borderColor: spendingBadge.border,
              }}
            >
              <div
                className="profile-badge-icon"
                style={{
                  background: spendingBadge.bg,
                  borderColor: spendingBadge.border,
                }}
              >
                <BadgeIcon
                  type={spendingBadge.icon}
                  size={24}
                  color={spendingBadge.color}
                />
              </div>
              <div className="profile-badge-info">
                <span
                  className="profile-badge-label"
                  style={{ color: spendingBadge.color }}
                >
                  {spendingBadge.label}
                </span>
                <span className="profile-badge-desc">
                  {spendingBadge.description}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Basic info section */}
        <div className="profile-new-section">
          <p className="profile-new-section-label">Basic information</p>
          <div className="profile-new-grid">
            <div className="profile-new-field">
              <span className="profile-new-field-label">Username</span>
              <div className="profile-new-field-value">
                {user?.username || "—"}
              </div>
            </div>
            <div className="profile-new-field">
              <span className="profile-new-field-label">Mobile number</span>
              <div className="profile-new-field-value">
                {user?.mobileNumber || "—"}
              </div>
            </div>
            <div className="profile-new-field">
              <span className="profile-new-field-label">Country</span>
              <div className="profile-new-field-value">
                {user?.country || "—"}
              </div>
            </div>
            <div className="profile-new-field">
              <span className="profile-new-field-label">Place</span>
              <div className="profile-new-field-value">
                {user?.place || "—"}
              </div>
            </div>
            {user?.email && (
              <div className="profile-new-field profile-new-field--full">
                <span className="profile-new-field-label">Email</span>
                <div className="profile-new-field-value">{user.email}</div>
              </div>
            )}
          </div>
        </div>

        {/* Account section */}
        <div className="profile-new-section profile-new-section--footer">
          <p className="profile-new-section-label">Account</p>
          <div className="profile-new-account-row">
            <div className="profile-new-stat">
              <span className="profile-new-stat-label">Member since</span>
              <span className="profile-new-stat-value">{memberSince}</span>
            </div>
            <div className="profile-new-stat">
              <span className="profile-new-stat-label">Account type</span>
              <span className="profile-new-stat-value">
                {isGoogleUser ? "Google" : "Standard"}
              </span>
            </div>
            <div className="profile-new-stat">
              <span className="profile-new-stat-label">Status</span>
              <span
                className={`profile-new-stat-value ${
                  isVerified
                    ? "profile-stat--verified"
                    : "profile-stat--unverified"
                }`}
              >
                {isVerified ? "Verified" : "Unverified"}
              </span>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="profile-new-section profile-danger-zone">
          <p className="profile-new-section-label">Danger Zone</p>
          <div className="danger-zone-card">
            <div className="danger-zone-info">
              <span className="danger-zone-title">Delete Account</span>
              <span className="danger-zone-desc">
                Permanently delete your account and all your data. This action
                cannot be undone.
              </span>
            </div>
            <button
              className="danger-zone-btn"
              onClick={() => {
                setShowDeleteModal(true);
                setDeleteError("");
                setDeleteInput("");
              }}
            >
              Delete Account
            </button>
          </div>
        </div>

        {/*Delete Confirmation Modal */}
        {showDeleteModal && (
          <div
            className="modal-overlay"
            onClick={() => setShowDeleteModal(false)}
          >
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <span className="modal-icon">
                  <FiAlertTriangle size={22} color="#fb7185" />
                </span>
                <h3 className="modal-title">Delete Account</h3>
              </div>
              <p className="modal-desc">
                This will permanently delete your account and all associated
                data including transactions, budgets, and savings goals.{" "}
                <strong>This cannot be undone.</strong>
              </p>
              <p className="modal-confirm-label">
                Type your <strong>username</strong> or <strong>email</strong> to
                confirm:
              </p>
              <input
                type="text"
                className="modal-input"
                placeholder="Username or email"
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleDeleteAccount()}
              />
              {deleteError && <p className="modal-error">{deleteError}</p>}
              <div className="modal-actions">
                <button
                  className="modal-cancel-btn"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleteLoading}
                >
                  Cancel
                </button>
                <button
                  className="modal-delete-btn"
                  onClick={handleDeleteAccount}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? "Deleting..." : "Yes, Delete My Account"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Email Verification Panel (only for non-Google, unverified users) */}
        {!isGoogleUser &&
          !isVerified &&
          !user?.email &&
          verifyStep !== "done" && (
            <div className="profile-verify-panel">
              <p className="profile-new-section-label">Verify your account</p>

              {verifyStep === "idle" && (
                <>
                  <p className="profile-verify-desc">
                    Verify your email address to confirm your identity and
                    unlock the Verified badge.
                  </p>
                  <button
                    className="profile-verify-btn"
                    onClick={() => setVerifyStep("enterEmail")}
                  >
                    Verify email
                  </button>
                </>
              )}

              {verifyStep === "enterEmail" && (
                <>
                  <p className="profile-verify-desc">
                    Enter the email address you'd like to verify.
                  </p>
                  <div className="profile-verify-row">
                    <input
                      type="email"
                      className="profile-verify-input"
                      placeholder="you@example.com"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                    />
                    <button
                      className="profile-verify-btn"
                      onClick={handleSendOtp}
                      disabled={verifyLoading}
                    >
                      {verifyLoading ? "Sending…" : "Send code"}
                    </button>
                  </div>
                  {verifyError && (
                    <p className="profile-verify-error">{verifyError}</p>
                  )}
                </>
              )}

              {verifyStep === "enterOtp" && (
                <>
                  {verifySuccess && (
                    <p className="profile-verify-success">{verifySuccess}</p>
                  )}
                  <p className="profile-verify-desc">
                    Enter the 6-digit code sent to <strong>{emailInput}</strong>
                    .
                  </p>
                  <div className="profile-verify-row">
                    <input
                      type="text"
                      className="profile-verify-input profile-verify-input--otp"
                      placeholder="_ _ _ _ _ _"
                      maxLength={6}
                      value={otpInput}
                      onChange={(e) =>
                        setOtpInput(e.target.value.replace(/\D/g, ""))
                      }
                      onKeyDown={(e) => e.key === "Enter" && handleVerifyOtp()}
                    />
                    <button
                      className="profile-verify-btn"
                      onClick={handleVerifyOtp}
                      disabled={verifyLoading}
                    >
                      {verifyLoading ? "Verifying…" : "Verify"}
                    </button>
                  </div>
                  {verifyError && (
                    <p className="profile-verify-error">{verifyError}</p>
                  )}
                  <p className="profile-verify-resend">
                    {countdown > 0 ? (
                      <>Resend available in {countdown}s</>
                    ) : (
                      <>
                        Didn't get it?{" "}
                        <button
                          className="profile-verify-link"
                          onClick={handleResend}
                        >
                          Resend code
                        </button>
                      </>
                    )}
                  </p>
                </>
              )}
            </div>
          )}

        {/* Success message after verification */}
        {verifyStep === "done" && (
          <div className="profile-verify-panel profile-verify-panel--success">
            <p className="profile-verify-success">
              ✓ Your account is now verified!
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
