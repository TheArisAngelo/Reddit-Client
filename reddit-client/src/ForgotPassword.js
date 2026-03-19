import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./App.css";

const USER_STORAGE_KEY = "reddit-client-user";

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    if (error) setError("");
    if (success) setSuccess("");
  };

  const handleSubmit = (event) => {
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

    const savedUserRaw = localStorage.getItem(USER_STORAGE_KEY);
    const savedUser = savedUserRaw ? JSON.parse(savedUserRaw) : null;

    if (!savedUser) {
      setError("No account found. Please sign up first.");
      return;
    }

    if (savedUser.username !== username) {
      setError("Username not found.");
      return;
    }

    const updatedUser = {
      ...savedUser,
      password: newPassword,
    };

    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
    setSuccess("Password reset successful. Redirecting to login...");

    setTimeout(() => {
      navigate("/login");
    }, 1500);
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
                <input
                  type="password"
                  name="newPassword"
                  placeholder="Enter new password"
                  value={formData.newPassword}
                  onChange={handleChange}
                />
              </label>

              <label className="create-field">
                <span>Confirm New Password</span>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm new password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
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
