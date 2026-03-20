import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./App.css";

const AUTH_STORAGE_KEY = "budget-tracker-auth";

export default function LoginPage({ onLogin }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    if (error) setError("");
  };

  const handleSubmit = async (event) => {
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

    try {
      setLoading(true);

      const response = await axios.post(
        "http://localhost:5000/api/auth/login",
        {
          username,
          password,
        },
      );

      const authData = {
        isLoggedIn: true,
        username: response.data.user.username,
        token: response.data.token,
      };

      const userData = {
        username: response.data.user.username,
        mobileNumber: response.data.user.mobileNumber,
        country: response.data.user.country,
        place: response.data.user.place,
      };

      localStorage.setItem("budget-tracker-auth", JSON.stringify(authData));
      localStorage.setItem("budget-tracker-user", JSON.stringify(userData));

      if (onLogin) {
        onLogin(authData);
      }

      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed.");
    } finally {
      setLoading(false);
    }
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

            <p style={{ marginTop: "8px", marginBottom: "8px" }}>
              <Link to="/forgot-password">Forgot Password</Link>
            </p>

            {error ? <div className="lane-error">{error}</div> : null}

            <button
              type="submit"
              className="create-submit-btn"
              disabled={loading}
            >
              {loading ? "Logging In..." : "Log In"}
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
