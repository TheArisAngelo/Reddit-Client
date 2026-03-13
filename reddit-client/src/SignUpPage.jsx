import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./App.css";

const USER_STORAGE_KEY = "reddit-client-user";
const AUTH_STORAGE_KEY = "reddit-client-auth";

export default function SignUpPage({ onLogin }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    if (error) setError("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const username = formData.username.trim();
    const password = formData.password.trim();
    const confirmPassword = formData.confirmPassword.trim();

    if (!username) {
      setError("Please enter a username.");
      return;
    }

    if (!password) {
      setError("Please enter a password.");
      return;
    }

    if (password.length < 4) {
      setError("Password must be at least 4 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const userData = { username, password };
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));

    const authData = {
      isLoggedIn: true,
      username,
    };

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));

    if (onLogin) {
      onLogin(authData);
    }

    navigate("/");
  };

  return (
    <div className="app-shell">
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb br-orb-2" />
      <div className="bg-grid" />

      <div className="profile-topbar">
        <div>
          <p className="eyebrow">Sign Up</p>
          <h1 className="create-page-title">
            Create your Reddit dashboard account
          </h1>
        </div>

        <div className="create-top-actions">
          <Link to="/" className="nav-btn">
            Home
          </Link>
          <Link to="/login" className="nav-btn">
            Log In
          </Link>
        </div>
      </div>

      <main className="login-layout">
        <section className="create-card login-card">
          <div className="lane-chip">Create Account</div>

          <form className="create-form" onSubmit={handleSubmit}>
            <label className="create-field">
              <span>Username</span>
              <input
                type="text"
                name="username"
                placeholder="Choose a username"
                value={formData.username}
              />
            </label>

            <label className="create-field">
              <span>Password</span>
              <input
                type="password"
                name="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
              />
            </label>

            <label className="create-field">
              <span>Confirm Password</span>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </label>

            {error ? <div className="lane-error">{error}</div> : null}

            <button type="submit" className="create-submit-btn">
              Sign Up
            </button>
          </form>

          <p style={{ marginTop: "16px" }}>
            Already have an account?
            <Link to="/login">Login</Link>
          </p>
        </section>
      </main>
    </div>
  );
}
