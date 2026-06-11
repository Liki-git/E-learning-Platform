import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { FiBell } from "react-icons/fi";
import api from "../api/client";

const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const ref = useRef(null);

  const load = () => {
    api.get("/notifications", { params: { limit: 5 } }).then(({ data }) => {
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
      setTotalCount(data.totalCount || 0);
    }).catch(() => {});
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markAllRead = async () => {
    await api.patch("/notifications/read-all");
    load();
  };

  const linkTo = (n) => {
    if (!n.link) return null;
    try {
      const u = new URL(n.link, window.location.origin);
      return u.pathname + u.search;
    } catch {
      return n.link.startsWith("/") ? n.link : "/student/dashboard";
    }
  };

  return (
    <div className="notif-bell" ref={ref}>
      <button type="button" className="icon-btn notif-bell__btn" aria-label="Notifications" onClick={() => setOpen(!open)}>
        <FiBell size={18} />
        {unreadCount > 0 && <span className="notif-bell__badge">{unreadCount > 9 ? "9+" : unreadCount}</span>}
      </button>
      {open && (
        <div className="notif-panel">
          <div className="notif-panel__head">
            <strong>Notifications</strong>
            {unreadCount > 0 && (
              <button type="button" onClick={markAllRead}>Mark all read</button>
            )}
          </div>
          <ul className="notif-panel__list">
            {notifications.length === 0 ? (
              <li className="notif-panel__empty">No notifications yet</li>
            ) : (
              notifications.map((n) => (
                <li key={n._id} className={n.read ? "" : "unread"}>
                  {linkTo(n) ? (
                    <Link to={linkTo(n)} onClick={() => setOpen(false)}>
                      <strong>{n.title}</strong>
                      <span>{n.message}</span>
                      <time>{new Date(n.createdAt).toLocaleString()}</time>
                    </Link>
                  ) : (
                    <div>
                      <strong>{n.title}</strong>
                      <span>{n.message}</span>
                      <time>{new Date(n.createdAt).toLocaleString()}</time>
                    </div>
                  )}
                </li>
              ))
            )}
          </ul>
          {totalCount > 5 && (
            <div className="notif-panel__footer">
              <Link to="/notifications" onClick={() => setOpen(false)}>View all notifications</Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
