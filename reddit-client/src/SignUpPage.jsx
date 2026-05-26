import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./App.css";
import { auth, googleProvider } from "./firebase";
import { signInWithPopup } from "firebase/auth";

export default function SignUpPage() {
  const navigate = useNavigate();

  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignUp = async () => {
    try {
      setGoogleLoading(true);
      setError("");

      const result = await signInWithPopup(auth, googleProvider);
      const firebaseToken = await result.user.getIdToken();

      const response = await axios.post(
        "http://localhost:5000/api/auth/google/signup",
        { firebaseToken },
      );

      navigate("/login", {
        state: { message: "Google account registered! Please log in." },
      });
    } catch (err) {
      // If account already exists, tell them to log in instead
      if (err.response?.status === 409) {
        setError("This Google account is already registered. Please log in.");
      } else {
        setError(err.response?.data?.message || "Google sign-up failed.");
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    mobileNumber: "",
    country: "",
    place: "",
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
    const confirmPassword = formData.confirmPassword.trim();
    const mobileNumber = formData.mobileNumber.trim();
    const country = formData.country.trim();
    const place = formData.place.trim();

    if (!username) {
      setError("Please enter a username");
      return;
    }

    if (!mobileNumber) {
      setError("Please enter your mobile number");
      return;
    }

    if (!country) {
      setError("Please enter your country");
      return;
    }

    if (!place) {
      setError("Please enter your place");
      return;
    }

    if (!password) {
      setError("Please enter a password");
      return;
    }

    if (password.length < 4) {
      setError("Password must be at least 4 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      await axios.post("http://localhost:5000/api/auth/signup", {
        username,
        password,
        mobileNumber,
        country,
        place,
      });

      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed");
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
          <p className="eyebrow">Sign Up</p>
          <h1 className="create-page-title">Create your account</h1>

          <Link to="/" className="nav-btn auth-home-btn">
            Home
          </Link>
          <Link to="/login" className="nav-btn auth-home-btn">
            Log In
          </Link>
        </div>
        <section className="create-card login-card">
          <div className="lane-chip">Create Account</div>

          <button
            type="button"
            className="google-signin-btn"
            onClick={handleGoogleSignUp}
            disabled={googleLoading}
          >
            {googleLoading ? (
              "Signing up..."
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

          <form className="create-form" onSubmit={handleSubmit}>
            <label className="create-field">
              <span>Username</span>
              <input
                type="text"
                name="username"
                placeholder="Choose a username"
                value={formData.username}
                onChange={handleChange}
              />
            </label>

            <label className="create-field">
              <span>Mobile Number (Optional)</span>
              <input
                type="text"
                name="mobileNumber"
                placeholder="Enter your mobile number"
                value={formData.mobileNumber}
                onChange={handleChange}
              />
            </label>

            <label className="create-field">
              <span>Country</span>
              <input
                type="text"
                name="country"
                placeholder="Enter your country"
                value={formData.country}
                onChange={handleChange}
              />
            </label>

            <label className="create-field">
              <span>Place</span>
              <input
                type="text"
                name="place"
                placeholder="Enter your place"
                value={formData.place}
                onChange={handleChange}
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

            <button
              type="submit"
              className="create-submit-btn"
              disabled={loading}
            >
              {loading ? "Signing Up..." : "Sign Up"}
            </button>
          </form>

          <p style={{ marginTop: "16px" }}>
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </section>
      </main>
    </div>
  );
}
