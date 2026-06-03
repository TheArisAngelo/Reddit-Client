import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./App.css";
import { FaLock, FaLockOpen } from "react-icons/fa";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  // Step 1 — Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    clearMessages();

    if (!identifier.trim()) {
      return setError("Please enter your username or email.");
    }

    setLoading(true);
    try {
      await axios.post("http://localhost:5000/api/auth/forgot/send-otp", {
        identifier,
      });
      setSuccess("OTP sent! Check your email.");
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2 — Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    clearMessages();

    if (!otp.trim()) return setError("Please enter the OTP.");
    if (otp.length !== 6) return setError("OTP must be 6 digits.");

    setLoading(true);
    try {
      await axios.post("http://localhost:5000/api/auth/forgot/verify-otp", {
        identifier,
        otp,
      });
      setSuccess("OTP verified! Set your new password.");
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid or expired OTP.");
    } finally {
      setLoading(false);
    }
  };

  // Step 3 — Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    clearMessages();

    if (!newPassword) return setError("Please enter a new password.");
    if (newPassword.length < 4)
      return setError("Password must be at least 4 characters.");
    if (!confirmPassword) return setError("Please confirm your new password.");
    if (newPassword !== confirmPassword)
      return setError("Passwords do not match.");

    setLoading(true);
    try {
      await axios.post("http://localhost:5000/api/auth/reset-password", {
        identifier,
        newPassword,
      });
      setSuccess("Password reset successful. Redirecting to login...");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(
        err.response?.data?.message || "Reset failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell--auth">
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />
      <div className="bg-grid" />

      <main className="login-layout">
        <div className="auth-page-header">
          <p className="eyebrow">Reset Password</p>
          <h1 className="create-page-title">
            {step === 1 && "Find your account"}
            {step === 2 && "Enter your OTP"}
            {step === 3 && "Create a new password"}
          </h1>
          <Link to="/login" className="nav-btn auth-home-btn">
            Back to Login
          </Link>
        </div>

        <section className="create-card login-card">
          <div className="lane-chip">
            {step === 1 && "Step 1 of 3 — Identify Account"}
            {step === 2 && "Step 2 of 3 — Verify OTP"}
            {step === 3 && "Step 3 of 3 — New Password"}
          </div>

          {/* Step 1 — Identifier */}
          {step === 1 && (
            <form className="create-form" onSubmit={handleSendOtp}>
              <label className="create-field">
                <span>Username or Email</span>
                <input
                  type="text"
                  placeholder="Enter your username or email"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    clearMessages();
                  }}
                />
              </label>

              {error && <div className="lane-error">{error}</div>}
              {success && <div className="lane-chip">{success}</div>}

              <button
                type="submit"
                className="create-submit-btn"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send OTP"}
              </button>
            </form>
          )}

          {/* Step 2 — OTP */}
          {step === 2 && (
            <form className="create-form" onSubmit={handleVerifyOtp}>
              <label className="create-field">
                <span>6-Digit OTP</span>
                <input
                  type="text"
                  placeholder="Enter the OTP sent to your email"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value);
                    clearMessages();
                  }}
                />
              </label>

              {error && <div className="lane-error">{error}</div>}
              {success && <div className="lane-chip">{success}</div>}

              <button
                type="submit"
                className="create-submit-btn"
                disabled={loading}
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>

              <button
                type="button"
                className="nav-btn auth-home-btn"
                style={{ marginTop: "8px" }}
                onClick={() => {
                  clearMessages();
                  setStep(1);
                }}
              >
                ← Back
              </button>
            </form>
          )}

          {/* Step 3 — New Password */}
          {step === 3 && (
            <form className="create-form" onSubmit={handleResetPassword}>
              <label className="create-field">
                <span>New Password</span>
                <div style={{ position: "relative" }}>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      clearMessages();
                    }}
                    style={{ width: "100%", paddingRight: "40px" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    style={{
                      position: "absolute",
                      right: "10px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      fontSize: "18px",
                      lineHeight: 1,
                    }}
                    aria-label={
                      showNewPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showNewPassword ? (
                      <FaLockOpen color="#7c3aed" />
                    ) : (
                      <FaLock color="#7c3aed" />
                    )}
                  </button>
                </div>
              </label>

              <label className="create-field">
                <span>Confirm New Password</span>
                <div style={{ position: "relative" }}>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      clearMessages();
                    }}
                    style={{ width: "100%", paddingRight: "40px" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    style={{
                      position: "absolute",
                      right: "10px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      fontSize: "18px",
                      lineHeight: 1,
                    }}
                    aria-label={
                      showConfirmPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showConfirmPassword ? (
                      <FaLockOpen color="#7c3aed" />
                    ) : (
                      <FaLock color="#7c3aed" />
                    )}
                  </button>
                </div>
              </label>

              {error && <div className="lane-error">{error}</div>}
              {success && <div className="lane-chip">{success}</div>}

              <button
                type="submit"
                className="create-submit-btn"
                disabled={loading}
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
