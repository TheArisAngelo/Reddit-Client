import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "./App.css";

const AUTH_STORAGE_KEY = "budget-tracker-auth";

function getInitials(username) {
  if (!username) return "?";
  const parts = username.trim().split(/[\s_-]+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return username.slice(0, 2).toUpperCase();
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

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
          headers: { Authorization: `Bearer ${savedAuth.token}` },
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
      <main className="profile-new-layout">
        <div className="profile-new-loading">
          <div className="profile-new-spinner" />
          <p>Loading profile…</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="login-layout">
        <section className="create-card login-card">
          <div className="lane-chip">Profile</div>
          <div className="lane-error">{error}</div>
          <div style={{ marginTop: "16px", display: "flex", gap: "12px" }}>
            <Link to="/" className="nav-btn">
              Home
            </Link>
            <Link to="/login" className="nav-btn">
              Log In
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const initials = getInitials(user?.username);
  const memberSince = formatDate(user?.createdAt);
  const isVerified = user?.isVerified ?? false;
  const isGoogleUser = !!user?.firebaseUid;

  return (
    <main className="profile-new-layout">
      {/* Page header */}
      <div className="profile-new-header">
        <p className="eyebrow">Profile</p>
        <h1 className="create-page-title">Your account details</h1>
      </div>

      <div className="profile-new-card">
        {/* Avatar + name strip */}
        <div className="profile-new-hero">
          <div className="profile-new-avatar">{initials}</div>
          <div className="profile-new-hero-info">
            <h2 className="profile-new-name">{user?.username}</h2>
            <p className="profile-new-location">
              {[user?.place, user?.country].filter(Boolean).join(", ") || "—"}
            </p>
          </div>
          <div className="profile-new-badges">
            {isVerified && (
              <span className="profile-badge profile-badge--verified">
                ✓ Verified
              </span>
            )}
            {isGoogleUser && (
              <span className="profile-badge profile-badge--google">
                G Google
              </span>
            )}
          </div>
        </div>

        {/* Basic info section */}
        <div className="profile-new-section">
          <p className="profile-new-section-label">Basic information</p>
          <div className="profile-new-grid">
            <div className="profile-new-field">
              <span className="profile-new-field-label">Username</span>
              <div className="profile-new-field-value">
                {user?.username || "—"}
              </div>
            </div>
            <div className="profile-new-field">
              <span className="profile-new-field-label">Mobile number</span>
              <div className="profile-new-field-value">
                {user?.mobileNumber || "—"}
              </div>
            </div>
            <div className="profile-new-field">
              <span className="profile-new-field-label">Country</span>
              <div className="profile-new-field-value">
                {user?.country || "—"}
              </div>
            </div>
            <div className="profile-new-field">
              <span className="profile-new-field-label">Place</span>
              <div className="profile-new-field-value">
                {user?.place || "—"}
              </div>
            </div>
            {user?.email && (
              <div className="profile-new-field profile-new-field--full">
                <span className="profile-new-field-label">Email</span>
                <div className="profile-new-field-value">{user.email}</div>
              </div>
            )}
          </div>
        </div>

        {/* Account section */}
        <div className="profile-new-section profile-new-section--footer">
          <p className="profile-new-section-label">Account</p>
          <div className="profile-new-account-row">
            <div className="profile-new-stat">
              <span className="profile-new-stat-label">Member since</span>
              <span className="profile-new-stat-value">{memberSince}</span>
            </div>
            <div className="profile-new-stat">
              <span className="profile-new-stat-label">Account type</span>
              <span className="profile-new-stat-value">
                {isGoogleUser ? "Google" : "Standard"}
              </span>
            </div>
            <div className="profile-new-stat">
              <span className="profile-new-stat-label">Status</span>
              <span
                className={`profile-new-stat-value ${isVerified ? "profile-stat--verified" : "profile-stat--unverified"}`}
              >
                {isVerified ? "Verified" : "Unverified"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
