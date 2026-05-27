import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./App.css";
import { FaLock, FaLockOpen } from "react-icons/fa";
import { auth, googleProvider } from "./firebase";
import { signInWithPopup } from "firebase/auth";

const AUTH_STORAGE_KEY = "budget-tracker-auth";

export default function LoginPage({ onLogin }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const identifier = formData.identifier.trim();
    const password = formData.password.trim();

    if (!identifier) {
      setError("Please enter your username or email.");
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
        { identifier, password },
      );

      const authData = {
        isLoggedIn: true,
        username: response.data.user.username,
        token: response.data.token,
      };

      sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));

      if (onLogin) onLogin(authData);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      setError("");

      const result = await signInWithPopup(auth, googleProvider);
      const firebaseToken = await result.user.getIdToken();

      const response = await axios.post(
        "http://localhost:5000/api/auth/google",
        { firebaseToken },
      );

      const authData = {
        isLoggedIn: true,
        username: response.data.user.username,
        token: response.data.token,
      };

      sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));

      if (onLogin) onLogin(authData);
      navigate("/");
    } catch (err) {
      if (err.response?.status === 404) {
        setError(
          "No account found for this Google account. Please sign up first.",
        );
      } else {
        setError(err.response?.data?.message || "Google sign-in failed.");
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="app-shell--auth">
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />
      <div className="bg-grid" />

      <main className="login-layout">
        <div className="auth-page-header">
          <p className="eyebrow">LOGIN</p>
          <h1 className="create-page-title">Access your account</h1>
          <Link to="/" className="nav-btn auth-home-btn">
            Home
          </Link>
        </div>
        <section className="create-card login-card">
          <div className="lane-chip">Sign In</div>

          <button
            type="button"
            className="google-signin-btn"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
          >
            {googleLoading ? (
              "Signing in..."
            ) : (
              <>
                <img
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt="Google"
                  width={20}
                  height={20}
                />
                Continue with Google
              </>
            )}
          </button>

          <div className="login-divider">
            <span>or sign in with username or email</span>
          </div>

          <form className="create-form" onSubmit={handleSubmit}>
            <label className="create-field">
              <span>Username or Email</span>
              <input
                type="text"
                name="identifier"
                placeholder="Enter your username or email"
                value={formData.identifier}
                onChange={handleChange}
              />
            </label>

            <label className="create-field">
              <span>Password</span>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  style={{ width: "100%", paddingRight: "40px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
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
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <FaLockOpen color="#7c3aed" />
                  ) : (
                    <FaLock color="#7c3aed" />
                  )}
                </button>
              </div>
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
