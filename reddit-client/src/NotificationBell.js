import React, { useCallback, useEffect, useRef, useState } from "react";

const NOTIF_API = "http://localhost:5000/api/notifications";

export default function NotificationBell({ token }) {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const unreadCount = notifications.length;

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(NOTIF_API, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Fetch on mount and every 5 minutes
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await fetch(`${NOTIF_API}/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await fetch(`${NOTIF_API}/read-all`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications([]);
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div style={{ position: "relative" }} ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        title="Notifications"
        style={{
          position: "relative",
          background: "transparent",
          border: "1px solid var(--border, rgba(255,255,255,0.12))",
          borderRadius: "10px",
          padding: "6px 12px",
          cursor: "pointer",
          fontSize: "18px",
          lineHeight: 1,
          color: "var(--text, #fff)",
          transition: "background 0.2s",
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-6px",
              right: "-6px",
              background: "#ef4444",
              color: "#fff",
              borderRadius: "999px",
              fontSize: "11px",
              fontWeight: "700",
              minWidth: "18px",
              height: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 4px",
              lineHeight: 1,
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 10px)",
            right: 0,
            width: "320px",
            background: "var(--card-bg, #1a1a2e)",
            border: "1px solid var(--border, rgba(255,255,255,0.12))",
            borderRadius: "14px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            zIndex: 1000,
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "14px 16px",
              borderBottom: "1px solid var(--border, rgba(255,255,255,0.08))",
            }}
          >
            <span
              style={{
                fontWeight: "700",
                fontSize: "14px",
                color: "var(--text, #fff)",
              }}
            >
              Notifications {unreadCount > 0 && `(${unreadCount})`}
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#a78bfa",
                  fontSize: "12px",
                  cursor: "pointer",
                  fontWeight: "600",
                  padding: 0,
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notification List */}
          <div style={{ maxHeight: "300px", overflowY: "auto" }}>
            {loading ? (
              <div
                style={{
                  padding: "20px",
                  textAlign: "center",
                  color: "var(--text-muted, #888)",
                  fontSize: "13px",
                }}
              >
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: "28px 20px", textAlign: "center" }}>
                <div style={{ fontSize: "28px", marginBottom: "8px" }}>✅</div>
                <p
                  style={{
                    color: "var(--text-muted, #888)",
                    fontSize: "13px",
                    margin: 0,
                  }}
                >
                  You're all caught up!
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    padding: "12px 16px",
                    borderBottom:
                      "1px solid var(--border, rgba(255,255,255,0.06))",
                    background: "rgba(167,139,250,0.05)",
                  }}
                >
                  <span
                    style={{
                      fontSize: "18px",
                      marginTop: "1px",
                      flexShrink: 0,
                    }}
                  >
                    {notif.type === "reminder"
                      ? "🔔"
                      : notif.type === "warning"
                        ? "⚠️"
                        : "ℹ️"}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        margin: "0 0 4px 0",
                        fontSize: "13px",
                        color: "var(--text, #fff)",
                        lineHeight: "1.4",
                      }}
                    >
                      {notif.message}
                    </p>
                    <span
                      style={{
                        fontSize: "11px",
                        color: "var(--text-muted, #888)",
                      }}
                    >
                      {timeAgo(notif.createdAt)}
                    </span>
                  </div>
                  <button
                    onClick={() => handleMarkAsRead(notif._id)}
                    title="Dismiss"
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--text-muted, #888)",
                      cursor: "pointer",
                      fontSize: "16px",
                      padding: "0",
                      flexShrink: 0,
                      lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
