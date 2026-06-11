import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/client";
import { FiTrash2, FiPlus, FiAlertCircle } from "react-icons/fi";

const AdminAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchAnnouncements = async () => {
    try {
      const { data } = await api.get("/announcements");
      setAnnouncements(data.announcements || []);
    } catch (err) {
      setError("Failed to load announcements.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title || !message) {
      setError("Title and message are required.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await api.post("/announcements", { title, message });
      setTitle("");
      setMessage("");
      fetchAnnouncements();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create announcement.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this announcement?")) return;
    try {
      await api.delete(`/announcements/${id}`);
      setAnnouncements(announcements.filter((a) => a._id !== id));
    } catch (err) {
      setError("Failed to delete announcement.");
    }
  };

  return (
    <DashboardLayout title="Platform Announcements" subtitle="Manage announcements sent to all registered users">
      <div className="ann-container">
        <style>{`
          .ann-grid {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 32px;
            margin-top: 20px;
          }
          .ann-form-card {
            background: var(--bg-surface, #ffffff);
            border: 1px solid var(--border-color, #e5e7eb);
            border-radius: 16px;
            padding: 24px;
            height: fit-content;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
          }
          .ann-form-group {
            margin-bottom: 16px;
          }
          .ann-form-group label {
            display: block;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 6px;
            color: var(--text-primary);
          }
          .ann-input {
            width: 100%;
            padding: 10px 14px;
            border-radius: 8px;
            border: 1px solid var(--border-color, #e5e7eb);
            background: var(--bg-body, #f9fafb);
            color: var(--text-primary);
            font-size: 14px;
          }
          .ann-textarea {
            width: 100%;
            height: 120px;
            padding: 10px 14px;
            border-radius: 8px;
            border: 1px solid var(--border-color, #e5e7eb);
            background: var(--bg-body, #f9fafb);
            color: var(--text-primary);
            font-size: 14px;
            resize: none;
          }
          .ann-list {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }
          .ann-card {
            background: var(--bg-surface, #ffffff);
            border: 1px solid var(--border-color, #e5e7eb);
            border-radius: 16px;
            padding: 20px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
            position: relative;
          }
          .ann-card-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 8px;
          }
          .ann-card-header h3 {
            font-size: 16px;
            font-weight: 700;
            color: var(--text-primary);
            margin: 0;
          }
          .ann-date {
            font-size: 12px;
            color: var(--text-secondary);
            margin-bottom: 8px;
            display: block;
          }
          .ann-author {
            font-size: 12px;
            font-weight: 600;
            color: #10b981;
          }
          .ann-delete-btn {
            background: transparent;
            border: none;
            color: #ef4444;
            cursor: pointer;
            font-size: 18px;
            padding: 4px;
            border-radius: 4px;
            transition: background 0.2s ease;
          }
          .ann-delete-btn:hover {
            background: #fef2f2;
          }
          [data-theme="dark"] .ann-delete-btn:hover {
            background: #450a0a;
          }
          .ann-error {
            background: #fef2f2;
            border: 1px solid #fee2e2;
            color: #991b1b;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 16px;
            font-size: 13px;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          @media (max-width: 900px) {
            .ann-grid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>

        {error && (
          <div className="ann-error">
            <FiAlertCircle />
            <span>{error}</span>
          </div>
        )}

        <div className="ann-grid">
          <div className="ann-left">
            <h2>Active Announcements</h2>
            {loading ? (
              <p>Loading announcements...</p>
            ) : announcements.length === 0 ? (
              <p>No announcements found.</p>
            ) : (
              <div className="ann-list">
                {announcements.map((ann) => (
                  <article className="ann-card" key={ann._id}>
                    <div className="ann-card-header">
                      <h3>{ann.title}</h3>
                      <button
                        type="button"
                        className="ann-delete-btn"
                        onClick={() => handleDelete(ann._id)}
                        title="Delete Announcement"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                    <span className="ann-date">
                      {new Date(ann.createdAt).toLocaleString()} · by <span className="ann-author">{ann.createdBy?.fullName || "Admin"}</span>
                    </span>
                    <p style={{ fontSize: "14px", lineHeight: "1.5", whiteSpace: "pre-line" }}>
                      {ann.message}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="ann-right">
            <div className="ann-form-card">
              <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "16px" }}>Publish Announcement</h2>
              <form onSubmit={handleCreate}>
                <div className="ann-form-group">
                  <label htmlFor="ann-title">Title</label>
                  <input
                    id="ann-title"
                    type="text"
                    className="ann-input"
                    placeholder="Enter announcement title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="ann-form-group">
                  <label htmlFor="ann-msg">Message</label>
                  <textarea
                    id="ann-msg"
                    className="ann-textarea"
                    placeholder="Type the message for all users..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn--primary btn--full"
                  disabled={submitting}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                >
                  <FiPlus />
                  {submitting ? "Publishing..." : "Publish Now"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminAnnouncements;
