import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/client";

const AnnouncementsFeedPage = ({ title = "Announcements" }) => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    api.get("/announcements").then(({ data }) => setItems(data.announcements || []));
  }, []);

  return (
    <DashboardLayout title={title} subtitle="Platform-wide updates from admin">
      <div className="feature-grid">
        {items.length === 0 ? <p className="dash-empty">No announcements.</p> : items.map((a) => (
          <article key={a._id} className="feature-card">
            <h3>{a.title}</h3>
            <p>{a.message}</p>
            <p className="feature-card__meta">{a.createdBy?.fullName || "Admin"} · {new Date(a.createdAt).toLocaleString()}</p>
          </article>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default AnnouncementsFeedPage;
