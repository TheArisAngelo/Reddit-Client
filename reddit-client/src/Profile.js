import React from "react";
import { Link } from "react-router-dom";
import "./App.css";

export default function Profile() {
  return (
    <div className="app-shell">
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />
      <div className="bg-grid" />

      <div className="profile-topbar">
        <p className="eyebrow">Profile</p>

        <Link to="/" className="nav-btn">
          Home
        </Link>
      </div>

      <main className="profile-layout">
        <section className="profile-card profile-avatar-card">
          <img className="profile-avatar" src="" alt="Profile Avatar" />
        </section>

        <section className="profile-card profile-intro-card">
          <p className="profile-intro-text">TheArisAngelo</p>
        </section>

        <section className="profile-card profile-interests-card">
          <div className="profile-row-title">Interests</div>
          <div className="pill-group">
            <span className="info-pill">🎮 Gaming</span>
            <span className="info-pill">🧳 Travelling</span>
          </div>
        </section>

        <section className="profile-card profile-work-card">
          <div className="card-heading-row">
            <div>
              <h2>Lloyds Financing Corporation</h2>
              <p className="card-subtitle">PHP Developer</p>
            </div>
            <span className="date-badge">2025-March</span>
          </div>

          <div className="card-divider" />

          <ul className="profile-list">
            <li>Worked on brand identity projects.</li>
            <li>Collaborated with clients.</li>
            <li>Developed a versatile design skill set.</li>
            <li>Adapted to unique challenges and requirements.</li>
          </ul>
        </section>

        <section className="profile-card profile-work-card">
          <div className="card-heading-row">
            <div>
              <h2>Silver Goose 8 International</h2>
              <p className="card-subtitle">Front-End Developer</p>
            </div>
            <span className="date-badge">March 2025 - Present</span>
          </div>

          <div className="card-divider" />

          <ul className="profile-list">
            <li>Collaboration</li>
            <li>Branding: Crafted unique brand identities.</li>
            <li>Tools: VSCode, Photoshop</li>
          </ul>
        </section>

        <section className="profile-card profile-small-card">
          <div className="profile-row-title">Development Tools</div>
          <div className="pill-group">
            <span className="tool-pill ai">VSCode</span>
            <span className="tool-pill ps">React</span>
            <span className="tool-pill id">Photoshop</span>
          </div>
        </section>

        <section className="profile-card profile-education-card">
          <div className="education-item">
            <div className="card-heading-row">
              <div>
                <h2>High School</h2>
                <p className="card-subtitle">STEM</p>
                <p className="card-meta">Manila, Philippines</p>
              </div>
              <span className="date-badge">2017</span>
            </div>
          </div>

          <div className="card-divider" />

          <div className="education-item">
            <div className="card-heading-row">
              <div>
                <h2>College</h2>
                <p className="card-subtitle">BS Computer Engineer</p>
                <p className="card-meta">Manila, Philippines</p>
              </div>
              <span className="date-badge">2024</span>
            </div>
          </div>

          <div className="card-divider" />
        </section>

        <section className="profile-card profile-small-card">
          <div className="profile-row-title">Editing Tools</div>
          <div className="pill-group">
            <span className="tool-pill ae">Photoshop</span>
          </div>
        </section>

        <section className="profile-card profile-small-card">
          <div className="profile-row-title">Languages</div>
          <div className="pill-group">
            <span className="info-pill">US</span>
            <span className="info-pill">PH</span>
          </div>
        </section>

        <section className="profile-card profile-wide-card">
          <div className="profile-row-title">Portfolio</div>
          <div className="pill-group">
            <span className="info-pill">📸 Instagram</span>
            <span className="info-pill">▶ YouTube</span>
          </div>
        </section>

        <section className="profile-card profile-wide-card">
          <div className="profile-row-title">Details</div>
          <div className="pill-group">
            <span className="info-pill">🧑 26 years</span>
            <span className="info-pill">✉ aris.angelo.don@outlook.com</span>
            <span className="info-pill">📞 +9563740075</span>
            <span className="info-pill">PH Philippines</span>
          </div>
        </section>
      </main>
    </div>
  );
}
