import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./App.css";

const USER_STORAGE_KEY = "reddit-client-user";
const AUTH_STORAGE_KEY = "reddit-client-auth";

export default function Profile() {
  const savedUserRaw = localStorage.getItem(USER_STORAGE_KEY);
  const savedUser = savedUserRaw ? JSON.parse(savedUserRaw) : null;

  const [formData, setFormData] = useState({
    username: savedUser?.username || "",
    mobileNumber: savedUser?.mobileNumber || "",
    country: savedUser?.country || "",
    place: savedUser?.place || "",
  });

  const [editingField, setEditingField] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  if (!savedUser) {
    return (
      <div className="app-shell">
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
            <Link to="/signup" className="nav-btn">
              Sign Up
            </Link>
          </div>
        </div>

        <main className="login-layout">
          <section className="create-card login-card">
            <div className="lane-chip">Profile</div>
            <div className="lane-error">No user information found.</div>
          </section>
        </main>
      </div>
    );
  }

 

  return (
    <div className="app-shell">
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />
      <div className="bg-grid" />

      <div className="profile-topbar">
        <div>
          <p className="eyebrow">Profile</p>
          <h1 className="create-page-title">Your account details</h1>
        </div>

        <div className="create-top-actions">
          <Link to="/" className="nav-btn">
            Home
          </Link>
          <Link to="/create" className="nav-btn">
            Create Post
          </Link>
        </div>
      </div>

      <main className="login-layout">
        <section className="create-card login-card">
          <div className="lane-chip">Basic Information</div>

          <div className="create-form">
            <div className="create-field">
              <span>Username</span>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  readOnly={!isEditingUsername}
                />

                {!isEditingUsername ? (
                  <button
                    type="button"
                    onClick={handleEditClick}
                    style={{
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      fontSize: "18px",
                    }}
                    title="Edit Username"
                  >
                    ✏️
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleSaveUsername}
                      style={{
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        fontSize: "18px",
                      }}
                      title="Save Username"
                    >
                      ✅
                    </button>

                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      style={{
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        fontSize: "18px",
                      }}
                      title="Cancel"
                    >
                      ❌
                    </button>
                  </>
                )}
              </div>
            </div>

            {error ? <div className="lane-error">{error}</div> : null}
            {message ? <div className="lane-chip">{message}</div> : null}

            <div className="create-field">
              <span>Mobile Number</span>
              <input
                type="text"
                value={savedUser.mobileNumber || ""}
                readOnly
              />
            </div>

            <div className="create-field">
              <span>Country</span>
              <input type="text" value={savedUser.country || ""} readOnly />
            </div>

            <div className="create-field">
              <span>Place</span>
              <input type="text" value={savedUser.place || ""} readOnly />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
