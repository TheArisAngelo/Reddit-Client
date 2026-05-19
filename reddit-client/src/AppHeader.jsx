import React from "react";
import { Sun, Moon, LayoutDashboard, ArrowLeftRight, Wallet, PiggyBank, Lightbulb, BarChart2 } from "lucide-react";
import NotificationBell from "./NotificationBell";

/**
 * AppHeader — drop-in replacement for the <header className="budget-header"> block in HomePage.
 *
 * Props:
 *   auth       — { isLoggedIn, username, token }
 *   activeTab  — string, currently active tab key
 *   onTabChange — (tabKey: string) => void
 *   darkMode   — boolean
 *   onToggleDark — () => void
 */

const TABS = [
  { key: "dashboard",    label: "Dashboard",    Icon: LayoutDashboard },
  { key: "transactions", label: "Transactions", Icon: ArrowLeftRight   },
  { key: "budgets",      label: "Budgets",      Icon: Wallet           },
  { key: "savings",      label: "Savings",      Icon: PiggyBank        },
  { key: "insights",     label: "Insights",     Icon: Lightbulb        },
  { key: "charts",       label: "Charts",       Icon: BarChart2        },
];

export default function AppHeader({ auth, activeTab, onTabChange, darkMode, onToggleDark }) {
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
          background: var(--panel);
          border: 1px solid var(--border);
          border-radius: 18px;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          flex-wrap: wrap;
        }

        /* ── Logo ── */
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

        /* ── Tab nav ── */
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

        .sw-tab svg {
          flex-shrink: 0;
          opacity: 0.85;
        }

        .sw-tab.active svg {
          opacity: 1;
        }

        /* ── Right controls ── */
        .sw-controls {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        /* User chip */
        .sw-user-chip {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 5px 12px 5px 5px;
          border-radius: 999px;
          background: rgba(148, 163, 184, 0.1);
          border: 1px solid var(--border);
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

        /* Theme toggle */
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

        /* ── Responsive ── */
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

        @media (max-width: 640px) {
          .sw-tab span {
            display: none;   /* show icon only on mobile */
          }
          .sw-tab {
            padding: 8px;
          }
          .sw-username {
            display: none;
          }
        }
      `}</style>

      <header className="sw-header">
        {/* Logo */}
        <div className="sw-logo">SpendWise</div>

        {/* Tab navigation */}
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

        {/* Right-side controls */}
        <div className="sw-controls">
          <NotificationBell token={auth.token} />

          <div className="sw-user-chip" aria-label={`Logged in as ${auth.username}`}>
            <div className="sw-avatar" aria-hidden="true">
              {auth.username ? auth.username.slice(0, 2) : "?"}
            </div>
            <span className="sw-username">{auth.username}</span>
          </div>

          <button
            className="sw-theme-btn"
            onClick={onToggleDark}
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            title={darkMode ? "Light mode" : "Dark mode"}
          >
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </header>
    </>
  );
}
