import React, { useCallback, useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";


const NOTIF_API = "http://localhost:5000/api/notifications";

export default function NotificationBell({ token }) {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const buttonRef = useRef(null);
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

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Recompute position anchored to the bell button on every open
  useEffect(() => {
    if (open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownStyle({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
  }, [open]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

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

  // Rendered via portal directly into document.body — fully escapes any
  // parent overflow, border-radius, or z-index stacking context in the header
  const dropdown = open
    ? ReactDOM.createPortal(
        <div
          ref={dropdownRef}
          className="notif-dropdown"
          style={{ top: dropdownStyle.top, right: dropdownStyle.right }}
        >
          <div className="notif-dropdown-header">
            <span className="notif-dropdown-title">
              Notifications{unreadCount > 0 ? ` (${unreadCount})` : ""}
            </span>
            {unreadCount > 0 && (
              <button
                className="notif-mark-all-btn"
                onClick={handleMarkAllAsRead}
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="notif-list">
            {loading ? (
              <div className="notif-empty">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="notif-empty">
                <span className="notif-empty-icon">✅</span>
                <p>You're all caught up!</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div key={notif._id} className="notif-item">
                  <span className="notif-item-icon">
                    {notif.type === "reminder"
                      ? "🔔"
                      : notif.type === "warning"
                        ? "⚠️"
                        : "ℹ️"}
                  </span>
                  <div className="notif-item-body">
                    <p className="notif-item-message">{notif.message}</p>
                    <span className="notif-item-time">
                      {timeAgo(notif.createdAt)}
                    </span>
                  </div>
                  <button
                    className="notif-dismiss-btn"
                    onClick={() => handleMarkAsRead(notif._id)}
                    title="Dismiss"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>,
        document.body,
      )
    : null;

  return (
    <>
      <button
        ref={buttonRef}
        className={`notif-bell-btn${open ? " open" : ""}`}
        onClick={() => setOpen((prev) => !prev)}
        title="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span className="notif-badge">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {dropdown}
    </>
  );
}
