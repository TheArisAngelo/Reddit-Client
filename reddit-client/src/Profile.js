import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "./App.css";

const AUTH_STORAGE_KEY = "budget-tracker-auth";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const savedAuthRaw = sessionStorage.getItem(AUTH_STORAGE_KEY);
        const savedAuth = savedAuthRaw ? JSON.parse(savedAuthRaw) : null;

        if (!savedAuth?.token) {
          setError("No token found. Please log in.");
          setLoading(false);
          return;
        }

        const response = await axios.get("http://localhost:5000/api/auth/me", {
          headers: {
            Authorization: `Bearer ${savedAuth.token}`,
          },
        });

        setUser(response.data.user);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load user profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="app-shell">
        <div className="bg-orb bg-orb-1" />
        <div className="bg-orb bg-orb-2" />
        <div className="bg-grid" />

        <main className="login-layout">
          <section className="create-card login-card">
            <div className="lane-chip">Profile</div>
            <div>Loading profile...</div>
          </section>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-shell--auth">
        <div className="bg-orb bg-orb-1" />
        <div className="bg-orb bg-orb-2" />
        <div className="bg-grid" />

        <div className="profile-topbar">
          <div>
            <p className="eyebrow">Profile</p>
            <h1 className="create-page-title">Your Account Details</h1>
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
            <div className="lane-chip">Profile</div>
            <div className="lane-error">{error}</div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell--auth">
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />
      <div className="bg-grid" />

      <main className="login-layout">
        <div className="auth-page-header">
          <div>
            <p className="eyebrow">Profile</p>
            <h1 className="create-page-title">Your account details</h1>
          </div>

          <Link to="/" className="nav-btn auth-home-btn">
            Home
          </Link>
        </div>
        <section className="create-card login-card">
          <div className="lane-chip">Basic Information</div>

          <div className="create-form">
            <div className="create-field">
              <span>Username</span>
              <input type="text" value={user?.username || ""} readOnly />
            </div>

            <div className="create-field">
              <span>Mobile Number</span>
              <input type="text" value={user?.mobileNumber || ""} readOnly />
            </div>

            <div className="create-field">
              <span>Country</span>
              <input type="text" value={user?.country || ""} readOnly />
            </div>

            <div className="create-field">
              <span>Place</span>
              <input type="text" value={user?.place || ""} readOnly />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
