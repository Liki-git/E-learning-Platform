import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/client";
import { FiStar, FiFilter, FiEdit3, FiAlertCircle } from "react-icons/fi";

const StarRating = ({ value, onChange, readOnly }) => (
  <div style={{ display: "flex", gap: 4 }}>
    {[1, 2, 3, 4, 5].map(n => (
      <button
        key={n}
        type="button"
        onClick={() => !readOnly && onChange(n)}
        style={{
          background: "none", border: "none", cursor: readOnly ? "default" : "pointer",
          fontSize: 24, color: n <= value ? "#f59e0b" : "var(--border-color)",
          transition: "transform 0.15s", padding: 2,
        }}
        onMouseEnter={e => !readOnly && (e.target.style.transform = "scale(1.2)")}
        onMouseLeave={e => (e.target.style.transform = "scale(1)")}
      >
        <FiStar fill={n <= value ? "#f59e0b" : "none"} />
      </button>
    ))}
  </div>
);

const StudentReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [formCourse, setFormCourse] = useState("");
  const [formRating, setFormRating] = useState(5);
  const [formComment, setFormComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editId, setEditId] = useState(null);

  const fetchData = async () => {
    try {
      const [revRes, enrRes] = await Promise.all([
        api.get("/reviews/my"),
        api.get("/enrollments/my"),
      ]);
      setReviews(revRes.data.reviews || []);
      setEnrollments((enrRes.data.enrollments || []).filter(e => e.status !== "wishlist"));
    } catch (err) { setError(err.response?.data?.message || err.message || "Failed to load data."); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const courses = enrollments.map(e => ({ id: e.course?.id || e.course?._id, title: e.course?.title })).filter(c => c.id);
  const filtered = reviews.filter(r => courseFilter === "all" || (r.course?._id || r.course?.id) === courseFilter);

  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : "—";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formCourse || !formRating) return;
    setSubmitting(true);
    setError("");
    try {
      await api.post("/reviews", { courseId: formCourse, rating: formRating, comment: formComment });
      setShowForm(false);
      setFormCourse("");
      setFormRating(5);
      setFormComment("");
      setEditId(null);
      fetchData();
    } catch (err) { setError(err.response?.data?.message || "Failed to submit review."); }
    finally { setSubmitting(false); }
  };

  const handleEdit = (r) => {
    setFormCourse(r.course?._id || "");
    setFormRating(r.rating);
    setFormComment(r.comment || "");
    setEditId(r._id);
    setShowForm(true);
  };

  return (
    <DashboardLayout title="Reviews" subtitle="Rate your courses and view your review history">
      <style>{`
        .sr-stats { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; margin-bottom: 28px; }
        .sr-stat { background: var(--bg-elevated); border: 1px solid var(--border-color); border-radius: 14px; padding: 20px; display: flex; flex-direction: column; gap: 6px; }
        .sr-stat span { font-size: 13px; color: var(--text-muted); }
        .sr-stat strong { font-size: 1.75rem; }
        .sr-toolbar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 24px; }
        .sr-filters { display: flex; gap: 12px; align-items: center; }
        .sr-select { padding: 10px 14px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--bg-elevated); color: var(--text-primary); font-size: 14px; min-width: 160px; }
        .sr-write-btn { background: #10b981; color: white; border: none; padding: 10px 20px; border-radius: 10px; font-weight: 600; font-size: 14px; cursor: pointer; display: flex; align-items: center; gap: 8px; }
        .sr-write-btn:hover { background: #059669; }
        .sr-card { background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 16px; padding: 24px; margin-bottom: 16px; }
        .sr-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
        .sr-card-header h3 { font-size: 16px; font-weight: 700; color: var(--text-primary); margin: 0; }
        .sr-edit-btn { background: transparent; border: none; color: var(--text-secondary); cursor: pointer; font-size: 16px; padding: 4px 8px; border-radius: 6px; }
        .sr-edit-btn:hover { background: var(--bg-body); color: #10b981; }
        .sr-card-comment { font-size: 14px; color: var(--text-secondary); line-height: 1.6; margin-top: 8px; }
        .sr-card-date { font-size: 12px; color: var(--text-muted); margin-top: 8px; }
        .sr-form-card { background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 16px; padding: 28px; margin-bottom: 24px; }
        .sr-form-field { margin-bottom: 18px; }
        .sr-form-field label { display: block; font-size: 14px; font-weight: 600; margin-bottom: 8px; color: var(--text-primary); }
        .sr-form-textarea { width: 100%; height: 100px; padding: 12px 14px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--bg-body); color: var(--text-primary); font-size: 14px; resize: none; font-family: inherit; }
        .sr-empty { text-align: center; padding: 60px 20px; color: var(--text-secondary); }
        .sr-empty-icon { font-size: 48px; color: var(--text-muted); margin-bottom: 16px; }
        .sr-error { background: #fef2f2; border: 1px solid #fee2e2; color: #991b1b; padding: 12px 16px; border-radius: 10px; margin-bottom: 16px; font-size: 13px; display: flex; align-items: center; gap: 8px; }
      `}</style>

      {error && <div className="sr-error"><FiAlertCircle /> {error}</div>}

      <div className="sr-stats">
        <div className="sr-stat"><span>Total Reviews</span><strong style={{color:"var(--text-primary)"}}>{reviews.length}</strong></div>
        <div className="sr-stat"><span>Avg Rating</span><strong style={{color:"#f59e0b"}}>★ {avgRating}</strong></div>
        <div className="sr-stat"><span>Enrolled Courses</span><strong style={{color:"#3b82f6"}}>{courses.length}</strong></div>
      </div>

      <div className="sr-toolbar">
        <div className="sr-filters">
          <FiFilter style={{ color: "var(--text-secondary)" }} />
          <select className="sr-select" value={courseFilter} onChange={e => setCourseFilter(e.target.value)}>
            <option value="all">All Courses</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>
        <button className="sr-write-btn" onClick={() => { setShowForm(!showForm); setEditId(null); setFormCourse(""); setFormRating(5); setFormComment(""); }}>
          <FiEdit3 /> Write Review
        </button>
      </div>

      {showForm && (
        <div className="sr-form-card">
          <h3 style={{ marginBottom: 20, fontSize: 18 }}>{editId ? "Edit Review" : "Write a Review"}</h3>
          <form onSubmit={handleSubmit}>
            <div className="sr-form-field">
              <label>Select Course</label>
              <select className="sr-select" style={{ width: "100%" }} value={formCourse} onChange={e => setFormCourse(e.target.value)}>
                <option value="">Choose a course...</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
            <div className="sr-form-field">
              <label>Rating</label>
              <StarRating value={formRating} onChange={setFormRating} />
            </div>
            <div className="sr-form-field">
              <label>Comment (optional)</label>
              <textarea className="sr-form-textarea" placeholder="Share your experience..." value={formComment} onChange={e => setFormComment(e.target.value)} />
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button type="submit" className="btn btn--primary" disabled={submitting || !formCourse}>{submitting ? "Saving..." : editId ? "Update Review" : "Submit Review"}</button>
              <button type="button" className="btn btn--outline" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p style={{ textAlign: "center", padding: 40 }}>Loading reviews...</p>
      ) : filtered.length === 0 ? (
        <div className="sr-empty">
          <div className="sr-empty-icon"><FiStar /></div>
          <h3>No Reviews Yet</h3>
          <p>Write a review for your enrolled courses to help others.</p>
        </div>
      ) : (
        filtered.map(r => (
          <div className="sr-card" key={r._id}>
            <div className="sr-card-header">
              <div>
                <h3>{r.course?.title || "Course"}</h3>
                <StarRating value={r.rating} readOnly />
              </div>
              <button className="sr-edit-btn" onClick={() => handleEdit(r)} title="Edit Review"><FiEdit3 /></button>
            </div>
            {r.comment && <div className="sr-card-comment">{r.comment}</div>}
            <div className="sr-card-date">{new Date(r.updatedAt || r.createdAt).toLocaleString()}</div>
          </div>
        ))
      )}
    </DashboardLayout>
  );
};

export default StudentReviews;
