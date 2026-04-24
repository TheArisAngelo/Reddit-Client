import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./App.css";
import { FaLock, FaLockOpen } from "react-icons/fa";

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    if (error) setError("");
    if (success) setSuccess("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const username = formData.username.trim();
    const newPassword = formData.newPassword.trim();
    const confirmPassword = formData.confirmPassword.trim();

    if (!username) {
      setError("Please enter your username.");
      return;
    }

    if (!newPassword) {
      setError("Please enter a new password.");
      return;
    }

    if (!confirmPassword) {
      setError("Please confirm your new password.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      await axios.post("http://localhost:5000/api/auth/reset-password", {
        username,
        newPassword,
      });

      setSuccess("Password reset successful. Redirecting to login...");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(
        err.response?.data?.message || "Reset failed. Please try again.",
      );
    }
  };

  return (
    <>
      <div className="app-shell">
        <div className="bg-orb bg-orb-1" />
        <div className="bg-orb bg-orb-2" />
        <div className="bg-grid" />

        <div className="profile-topbar">
          <div>
            <p className="eyebrow">Reset Password</p>
            <h1 className="create-page-title">Create a new password</h1>
          </div>

          <div className="create-top-actions">
            <Link to="/login" className="nav-btn">
              Back to Login
            </Link>
          </div>
        </div>

        <main className="login-layout">
          <section className="create-card login-card">
            <div className="lane-chip">Forgot Password</div>

            <form className="create-form" onSubmit={handleSubmit}>
              <label className="create-field">
                <span>Username</span>
                <input
                  type="text"
                  name="username"
                  placeholder="Enter your username"
                  value={formData.username}
                  onChange={handleChange}
                />
              </label>

              <label className="create-field">
                <span>New Password</span>
                <div style={{ position: "relative" }}>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    name="newPassword"
                    placeholder="Enter new password"
                    value={formData.newPassword}
                    onChange={handleChange}
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
                      color: "#888",
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
                    name="confirmPassword"
                    placeholder="Confirm new password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
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
                      color: "#888",
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

              {error ? <div className="lane-error">{error}</div> : null}
              {success ? <div className="lane-chip">{success}</div> : null}

              <button type="submit" className="create-submit-btn">
                Reset Password
              </button>
            </form>
          </section>
        </main>
      </div>
    </>
  );
}
