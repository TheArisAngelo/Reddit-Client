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
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    if (error) setError("");
  };

    setFormData((current) => ({ ...current, [name]: value }));
    if (error) setError("");
  };

  // ─── Existing email/password login (unchanged) ────────────────────────────
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
        { username, password },
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

      if (onLogin) onLogin(authData);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  // ─── NEW: Google Sign-in ──────────────────────────────────────────────────
  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      setError("");

      // Step 1: Sign in with Google popup
      const result = await signInWithPopup(auth, googleProvider);

      // Step 2: Get Firebase token from Google result
      const firebaseToken = await result.user.getIdToken();

      // Step 3: Send Firebase token to your backend to verify
      // and get back your app's own token + user data
      const response = await axios.post(
        "http://localhost:5000/api/auth/google",
        { firebaseToken },
      );

      const authData = {
        isLoggedIn: true,
        username: response.data.user.username,
        token: response.data.token,
      };

      const userData = {
        username: response.data.user.username,
        mobileNumber: response.data.user.mobileNumber || "",
        country: response.data.user.country || "",
        place: response.data.user.place || "",
      };

      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
      localStorage.setItem("budget-tracker-user", JSON.stringify(userData));

      if (onLogin) onLogin(authData);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Google sign-in failed.");
    } finally {
      setGoogleLoading(false);
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

          {/* ─── Google Sign-in Button ─────────────────────────────────── */}
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

          {/* ─── Divider ───────────────────────────────────────────────── */}
          <div className="login-divider">
            <span>or sign in with username</span>
          </div>

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
