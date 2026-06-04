import React from "react";
import {
  Sun,
  Moon,
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  PiggyBank,
  Lightbulb,
  BarChart2,
} from "lucide-react";
import NotificationBell from "./NotificationBell";
import { Link } from "react-router-dom";

const TABS = [
  { key: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { key: "transactions", label: "Transactions", Icon: ArrowLeftRight },
  { key: "budgets", label: "Budgets", Icon: Wallet },
  { key: "savings", label: "Savings", Icon: PiggyBank },
  { key: "insights", label: "Insights", Icon: Lightbulb },
  { key: "charts", label: "Charts", Icon: BarChart2 },
];

export default function AppHeader({
  auth,
  activeTab,
  onTabChange,
  darkMode,
  onToggleDark,
}) {
  return (
    <>
      <style>{`
        .sw-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 10px 20px;
          margin-bottom: 28px;
          background: rgba(15, 23, 42, 0.42);
          border: 1px solid rgba(148, 163, 184, 0.18);
          border-radius: 18px;
          backdrop-filter: blur(20px) saturate(160%);
          -webkit-backdrop-filter: blur(20px) saturate(160%);
          box-shadow: 0 8px 32px rgba(2, 6, 23, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.07);
          flex-wrap: wrap;
        }
        .light-mode .sw-header {
            background: rgba(255, 255, 255, 0.58);
            border-color: rgba(255, 255, 255, 0.75);
            box-shadow: 0 8px 32px rgba(100, 116, 139, 0.13),
              inset 0 1px 0 rgba(255, 255, 255, 0.95);
        }

        .sw-logo {
          font-size: 17px;
          font-weight: 800;
          letter-spacing: -0.04em;
          background: linear-gradient(135deg, #a78bfa, #818cf8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          white-space: nowrap;
          user-select: none;
          flex-shrink: 0;
        }

        .sw-tabs {
          display: flex;
          align-items: center;
          gap: 2px;
          flex: 1;
          justify-content: center;
          flex-wrap: wrap;
        }

        .sw-tab {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 13px;
          border: none;
          border-radius: 10px;
          background: transparent;
          color: var(--muted);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.18s ease, color 0.18s ease;
          white-space: nowrap;
          font-family: inherit;
        }

        .sw-tab:hover {
          background: rgba(148, 163, 184, 0.1);
          color: var(--text);
        }

        .sw-tab.active {
          background: linear-gradient(135deg, #7c3aed, #4f46e5);
          color: #fff;
          box-shadow: 0 4px 14px rgba(79, 70, 229, 0.28);
        }

        .sw-tab svg { flex-shrink: 0; opacity: 0.85; }
        .sw-tab.active svg { opacity: 1; }

        .sw-controls {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        .sw-user-chip {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 5px 12px 5px 5px;
          border-radius: 999px;
          background: rgba(148, 163, 184, 0.1);
          border: 1px solid var(--border);
          cursor: pointer;
          transition: background 0.18s ease, border-color 0.18s ease;
        }

        .sw-user-chip:hover {
          background: rgba(124, 58, 237, 0.15);
          border-color: rgba(124, 58, 237, 0.35);
        }

        .sw-avatar {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: linear-gradient(135deg, #7c3aed, #4f46e5);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 800;
          color: #fff;
          flex-shrink: 0;
          text-transform: uppercase;
        }

        .sw-username {
          font-size: 13px;
          font-weight: 600;
          color: var(--text);
          max-width: 120px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .sw-theme-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          border-radius: 10px;
          border: 1px solid var(--border);
          background: transparent;
          color: var(--muted);
          cursor: pointer;
          transition: background 0.18s ease, color 0.18s ease;
          flex-shrink: 0;
        }

        .sw-theme-btn:hover {
          background: rgba(148, 163, 184, 0.1);
          color: var(--text);
        }

        /* ── MOBILE BOTTOM NAV ── */
        .sw-bottom-nav {
          display: none;
        }

        .sw-bottom-tab {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          flex: 1;
          padding: 8px 4px;
          border: none;
          background: transparent;
          color: var(--muted);
          font-size: 10px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: color 0.18s ease;
        }

        .sw-bottom-tab.active {
          color: #a78bfa;
        }

        .sw-bottom-tab svg {
          flex-shrink: 0;
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 900px) {
          .sw-tabs {
            order: 3;
            width: 100%;
            justify-content: flex-start;
          }
          .sw-header {
            padding: 10px 14px;
          }
        }

        @media (max-width: 768px) {
          /* Hide top tabs on mobile */
          .sw-tabs {
            display: none;
          }

          /* Show bottom nav on mobile */
          .sw-bottom-nav {
            display: flex;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            z-index: 1000;
            background: rgba(8, 15, 28, 0.96);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border-top: 1px solid rgba(148, 163, 184, 0.16);
            padding: 6px 0 env(safe-area-inset-bottom, 6px);
          }

          .sw-username {
            display: none;
          }

          .sw-header {
            margin-bottom: 16px;
            border-radius: 12px;
          }
        }
      `}</style>

      {/* ── Top header ── */}
      <header className="sw-header">
        <div className="sw-logo">SpendWise</div>

        {/* Top tab nav — hidden on mobile */}
        <nav className="sw-tabs" role="tablist" aria-label="Main navigation">
          {TABS.map(({ key, label, Icon }) => (
            <button
              key={key}
              role="tab"
              aria-selected={activeTab === key}
              className={`sw-tab${activeTab === key ? " active" : ""}`}
              onClick={() => onTabChange(key)}
            >
              <Icon size={15} aria-hidden="true" />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="sw-controls">
          <NotificationBell token={auth.token} />
          <Link
            to="/profile"
            className="sw-user-chip"
            aria-label={`Logged in as ${auth.username}`}
            style={{ textDecoration: "none" }}
          >
            <div className="sw-avatar" aria-hidden="true">
              {auth.username ? auth.username.slice(0, 2) : "?"}
            </div>
            <span className="sw-username">{auth.username}</span>
          </Link>
          <button
            className="sw-theme-btn"
            onClick={onToggleDark}
            aria-label={
              darkMode ? "Switch to light mode" : "Switch to dark mode"
            }
          >
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </header>

      {/* ── Bottom tab nav — mobile only ── */}
      <nav
        className="sw-bottom-nav"
        role="tablist"
        aria-label="Main navigation"
      >
        {TABS.map(({ key, label, Icon }) => (
          <button
            key={key}
            role="tab"
            aria-selected={activeTab === key}
            className={`sw-bottom-tab${activeTab === key ? " active" : ""}`}
            onClick={() => onTabChange(key)}
          >
            <Icon size={20} aria-hidden="true" />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}
