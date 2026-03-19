import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./App.css";

const USER_STORAGE_KEY = "reddit-client-user";

export default function LoginPage({ onLogin }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
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

    if (!username) {
      setError("Please enter your username.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    const savedUserRaw = localStorage.getItem(USER_STORAGE_KEY);
    const savedUser = savedUserRaw ? JSON.parse(savedUserRaw) : null;

    if (!savedUser) {
      setError("No account found. Please sign up first.");
      return;
    }

    if (savedUser.username !== username || savedUser.password !== password) {
      setError("Invalid username or password.");
      return;
    }

    const authData = {
      isLoggedIn: true,
      username: savedUser.username,
    };

    if (onLogin) {
      onLogin(authData);
    }

    navigate("/");
  };

  return (
    <div className="app-shell">
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />
      <div className="bg-grid" />

      <div className="profile-topbar">
        <div>
          <p className="eyebrow">LOGIN</p>
          <h1 className="create-page-title">Access your account</h1>
        </div>

        <div className="create-top-actions">
          <Link to="/" className="nav-btn">
            Home
          </Link>
        </div>
      </div>

      <main className="login-layout">
        <section className="create-card login-card">
          <div className="lane-chip">Sign In</div>

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
              <span>Password</span>
              <input
                type="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
              />
            </label>

            <p style={{ marginTop: "8px", marginBottom: "8px", }}>
              <Link to="/forgot-password">Forgot Password</Link>
            </p>

            {error ? <div className="lane-error">{error}</div> : null}

            <button type="submit" className="create-submit-btn">
              Log In
            </button>
          </form>

          <p style={{ marginTop: "16px" }}>
            No Account Yet? <Link to="/signup">Create one here</Link>
          </p>
        </section>
      </main>
    </div>
  );
}
