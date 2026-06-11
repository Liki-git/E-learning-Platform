import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { FiVolume2, FiFilter, FiCheckCircle, FiAlertCircle } from "react-icons/fi";

const InstructorAnnouncements = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const fetchAnnouncements = async () => {
    try {
      const { data } = await api.get("/announcements");
      setAnnouncements(data.announcements || []);
    } catch { setError("Failed to load announcements."); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  const isRead = (ann) => ann.readBy?.includes(user?._id);

  const handleMarkRead = async (id) => {
    try {
      await api.patch(`/announcements/${id}/read`);
      setAnnouncements(prev => prev.map(a => a._id === id ? { ...a, readBy: [...(a.readBy || []), user?._id] } : a));
    } catch { /* silent */ }
  };

  const handleMarkAllRead = async () => {
    const unread = announcements.filter(a => !isRead(a));
    try {
      await Promise.all(unread.map(a => api.patch(`/announcements/${a._id}/read`)));
      setAnnouncements(prev => prev.map(a => ({ ...a, readBy: [...(a.readBy || []), user?._id] })));
    } catch { /* silent */ }
  };

  const filtered = announcements
    .filter(a => {
      if (filter === "unread") return !isRead(a);
      if (filter === "read") return isRead(a);
      return true;
    })
    .sort((a, b) => sortBy === "newest" ? new Date(b.createdAt) - new Date(a.createdAt) : new Date(a.createdAt) - new Date(b.createdAt));

  const unreadCount = announcements.filter(a => !isRead(a)).length;

  return (
    <DashboardLayout title="Announcements" subtitle="Platform-wide announcements from the admin">
      <style>{`
        .ian-stats { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; margin-bottom: 28px; }
        .ian-stat { background: var(--bg-elevated); border: 1px solid var(--border-color); border-radius: 14px; padding: 20px; display: flex; flex-direction: column; gap: 6px; }
        .ian-stat span { font-size: 13px; color: var(--text-muted); }
        .ian-stat strong { font-size: 1.75rem; }
        .ian-toolbar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 24px; }
        .ian-filters { display: flex; gap: 12px; align-items: center; }
        .ian-select { padding: 10px 14px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--bg-elevated); color: var(--text-primary); font-size: 14px; min-width: 140px; }
        .ian-mark-all { background: transparent; border: 1.5px solid #10b981; color: #10b981; padding: 8px 16px; border-radius: 10px; font-weight: 600; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.2s; }
        .ian-mark-all:hover { background: #d1fae5; }
        .ian-card { background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 16px; padding: 24px; margin-bottom: 16px; position: relative; transition: all 0.2s; }
        .ian-card.unread { border-left: 4px solid #3b82f6; }
        .ian-card.read { opacity: 0.75; }
        .ian-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
        .ian-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
        .ian-card-header h3 { font-size: 17px; font-weight: 700; color: var(--text-primary); margin: 0; display: flex; align-items: center; gap: 10px; }
        .ian-unread-dot { width: 10px; height: 10px; border-radius: 50%; background: #3b82f6; flex-shrink: 0; }
        .ian-mark-btn { background: transparent; border: 1px solid var(--border-color); border-radius: 8px; padding: 6px 12px; font-size: 12px; cursor: pointer; color: var(--text-secondary); display: flex; align-items: center; gap: 4px; transition: all 0.2s; }
        .ian-mark-btn:hover { border-color: #10b981; color: #10b981; }
        .ian-card-date { font-size: 12px; color: var(--text-muted); margin-bottom: 10px; }
        .ian-card-body { font-size: 14px; color: var(--text-secondary); line-height: 1.7; white-space: pre-line; }
        .ian-card-author { font-size: 12px; font-weight: 600; color: #10b981; margin-top: 10px; }
        .ian-empty { text-align: center; padding: 60px 20px; color: var(--text-secondary); }
        .ian-empty-icon { font-size: 48px; color: var(--text-muted); margin-bottom: 16px; }
        .ian-error { background: #fef2f2; border: 1px solid #fee2e2; color: #991b1b; padding: 12px 16px; border-radius: 10px; margin-bottom: 16px; font-size: 13px; display: flex; align-items: center; gap: 8px; }
      `}</style>

      {error && <div className="ian-error"><FiAlertCircle /> {error}</div>}

      <div className="ian-stats">
        <div className="ian-stat"><span>Total</span><strong style={{color:"var(--text-primary)"}}>{announcements.length}</strong></div>
        <div className="ian-stat"><span>Unread</span><strong style={{color:"#3b82f6"}}>{unreadCount}</strong></div>
        <div className="ian-stat"><span>Read</span><strong style={{color:"#10b981"}}>{announcements.length - unreadCount}</strong></div>
      </div>

      <div className="ian-toolbar">
        <div className="ian-filters">
          <FiFilter style={{ color: "var(--text-secondary)" }} />
          <select className="ian-select" value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="unread">Unread ({unreadCount})</option>
            <option value="read">Read</option>
          </select>
          <select className="ian-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
        {unreadCount > 0 && (
          <button className="ian-mark-all" onClick={handleMarkAllRead}><FiCheckCircle /> Mark All as Read</button>
        )}
      </div>

      {loading ? <p style={{ textAlign: "center", padding: 40 }}>Loading...</p>
      : filtered.length === 0 ? (
        <div className="ian-empty"><div className="ian-empty-icon"><FiVolume2 /></div><h3>No Announcements</h3><p>Announcements from the admin will appear here.</p></div>
      ) : (
        filtered.map(ann => {
          const read = isRead(ann);
          return (
            <div className={`ian-card ${read ? "read" : "unread"}`} key={ann._id}>
              <div className="ian-card-header">
                <h3>{!read && <span className="ian-unread-dot" />} {ann.title}</h3>
                {!read && <button className="ian-mark-btn" onClick={() => handleMarkRead(ann._id)}><FiCheckCircle /> Mark Read</button>}
              </div>
              <div className="ian-card-date">{new Date(ann.createdAt).toLocaleString()}</div>
              <div className="ian-card-body">{ann.message}</div>
              <div className="ian-card-author">— {ann.createdBy?.fullName || "Admin"}</div>
            </div>
          );
        })
      )}
    </DashboardLayout>
  );
};

export default InstructorAnnouncements;
