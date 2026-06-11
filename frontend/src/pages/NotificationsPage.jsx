import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppNavbar from "../components/AppNavbar";
import PageShell from "../components/PageShell";
import api from "../api/client";

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const load = () => {
    api.get("/notifications", { params: { limit: 100 } }).then(({ data }) => {
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    });
  };

  useEffect(() => {
    load();
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
      return n.link.startsWith("/") ? n.link : "/home";
    }
  };

  return (
    <PageShell>
      <AppNavbar />
      <main className="section notifications-page">
        <div className="notifications-page__head">
          <h1>All Notifications</h1>
          {unreadCount > 0 && (
            <button type="button" className="btn btn--outline btn--sm" onClick={markAllRead}>
              Mark all read
            </button>
          )}
        </div>
        <ul className="notifications-page__list">
          {notifications.length === 0 ? (
            <li className="dash-empty">No notifications yet.</li>
          ) : (
            notifications.map((n) => (
              <li key={n._id} className={`notifications-page__item${n.read ? "" : " unread"}`}>
                {linkTo(n) ? (
                  <Link to={linkTo(n)}>
                    <strong>{n.title}</strong>
                    <p>{n.message}</p>
                    <time>{new Date(n.createdAt).toLocaleString()}</time>
                  </Link>
                ) : (
                  <div>
                    <strong>{n.title}</strong>
                    <p>{n.message}</p>
                    <time>{new Date(n.createdAt).toLocaleString()}</time>
                  </div>
                )}
              </li>
            ))
          )}
        </ul>
      </main>
    </PageShell>
  );
};

export default NotificationsPage;
