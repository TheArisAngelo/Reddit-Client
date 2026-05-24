import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "./App.css";

const AUTH_STORAGE_KEY = "budget-tracker-auth";
const API = "http://localhost:5000/api/auth";

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

// ── Verification steps: "idle" | "enterEmail" | "enterOtp" | "done"
export default function Profile() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Verification state
  const [verifyStep, setVerifyStep] = useState("idle");
  const [emailInput, setEmailInput] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [verifySuccess, setVerifySuccess] = useState("");
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    fetchProfile();
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
      if (response.data.user.email) {
        setEmailInput(response.data.user.email);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load user profile.");
    } finally {
      setLoading(false);
    }
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

  // ── Render states
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
          <div className="profile-new-avatar">{initials}</div>
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

        {/* ── Email Verification Panel (only for non-Google, unverified users) */}
        {!isGoogleUser && !isVerified && verifyStep !== "done" && (
          <div className="profile-verify-panel">
            <p className="profile-new-section-label">Verify your account</p>

            {verifyStep === "idle" && (
              <>
                <p className="profile-verify-desc">
                  Verify your email address to confirm your identity and unlock
                  the Verified badge.
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
                  Enter the 6-digit code sent to <strong>{emailInput}</strong>.
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
