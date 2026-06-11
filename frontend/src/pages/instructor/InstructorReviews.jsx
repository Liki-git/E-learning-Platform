import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/client";
import { FiStar, FiFilter, FiAlertCircle } from "react-icons/fi";

const StarDisplay = ({ value }) => (
  <div style={{ display: "flex", gap: 2 }}>
    {[1, 2, 3, 4, 5].map(n => (
      <FiStar key={n} size={16} fill={n <= value ? "#f59e0b" : "none"} color={n <= value ? "#f59e0b" : "var(--border-color)"} />
    ))}
  </div>
);

const InstructorReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get("/reviews/my");
        setReviews(data.reviews || []);
      } catch (err) { setError(err.response?.data?.message || err.message || "Failed to load reviews."); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const courses = [...new Map(reviews.map(r => [r.course?._id, r.course?.title])).entries()].filter(([id]) => id);

  const filtered = reviews
    .filter(r => courseFilter === "all" || r.course?._id === courseFilter)
    .sort((a, b) => {
      if (sortBy === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === "highest") return b.rating - a.rating;
      if (sortBy === "lowest") return a.rating - b.rating;
      return 0;
    });

  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : "—";
  const ratingDist = [5, 4, 3, 2, 1].map(n => ({
    stars: n,
    count: reviews.filter(r => r.rating === n).length,
    pct: reviews.length ? Math.round(reviews.filter(r => r.rating === n).length / reviews.length * 100) : 0,
  }));

  return (
    <DashboardLayout title="Reviews" subtitle="Student feedback on your courses">
      <style>{`
        .ir-overview { display: grid; grid-template-columns: 200px 1fr; gap: 32px; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 16px; padding: 28px; margin-bottom: 28px; }
        .ir-avg { text-align: center; }
        .ir-avg-num { font-size: 48px; font-weight: 800; color: #f59e0b; }
        .ir-avg-label { font-size: 14px; color: var(--text-secondary); margin-top: 4px; }
        .ir-dist { display: flex; flex-direction: column; gap: 8px; justify-content: center; }
        .ir-dist-row { display: flex; align-items: center; gap: 10px; }
        .ir-dist-label { font-size: 13px; font-weight: 600; color: var(--text-secondary); min-width: 48px; }
        .ir-dist-bar { flex: 1; height: 8px; background: var(--border-color); border-radius: 99px; overflow: hidden; }
        .ir-dist-fill { height: 100%; background: #f59e0b; border-radius: 99px; transition: width 0.3s; }
        .ir-dist-count { font-size: 12px; color: var(--text-muted); min-width: 32px; text-align: right; }
        .ir-toolbar { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 24px; align-items: center; }
        .ir-select { padding: 10px 14px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--bg-elevated); color: var(--text-primary); font-size: 14px; min-width: 160px; }
        .ir-card { background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 16px; padding: 24px; margin-bottom: 16px; }
        .ir-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
        .ir-card-header h3 { font-size: 15px; font-weight: 700; color: var(--text-primary); margin: 0; }
        .ir-card-student { font-size: 13px; color: var(--text-secondary); margin-bottom: 8px; }
        .ir-card-comment { font-size: 14px; color: var(--text-secondary); line-height: 1.6; }
        .ir-card-date { font-size: 12px; color: var(--text-muted); margin-top: 10px; }
        .ir-empty { text-align: center; padding: 60px 20px; color: var(--text-secondary); }
        .ir-empty-icon { font-size: 48px; color: var(--text-muted); margin-bottom: 16px; }
        .ir-error { background: #fef2f2; border: 1px solid #fee2e2; color: #991b1b; padding: 12px 16px; border-radius: 10px; margin-bottom: 16px; font-size: 13px; display: flex; align-items: center; gap: 8px; }
        @media (max-width: 640px) { .ir-overview { grid-template-columns: 1fr; } }
      `}</style>

      {error && <div className="ir-error"><FiAlertCircle /> {error}</div>}

      {/* Rating Overview */}
      <div className="ir-overview">
        <div className="ir-avg">
          <div className="ir-avg-num">{avgRating}</div>
          <StarDisplay value={Math.round(Number(avgRating) || 0)} />
          <div className="ir-avg-label">{reviews.length} reviews</div>
        </div>
        <div className="ir-dist">
          {ratingDist.map(d => (
            <div className="ir-dist-row" key={d.stars}>
              <span className="ir-dist-label">{d.stars} ★</span>
              <div className="ir-dist-bar"><div className="ir-dist-fill" style={{ width: `${d.pct}%` }} /></div>
              <span className="ir-dist-count">{d.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="ir-toolbar">
        <FiFilter style={{ color: "var(--text-secondary)" }} />
        <select className="ir-select" value={courseFilter} onChange={e => setCourseFilter(e.target.value)}>
          <option value="all">All Courses</option>
          {courses.map(([id, title]) => <option key={id} value={id}>{title}</option>)}
        </select>
        <select className="ir-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="newest">Newest First</option>
          <option value="highest">Highest Rating</option>
          <option value="lowest">Lowest Rating</option>
        </select>
      </div>

      {loading ? <p style={{ textAlign: "center", padding: 40 }}>Loading...</p>
      : filtered.length === 0 ? (
        <div className="ir-empty"><div className="ir-empty-icon"><FiStar /></div><h3>No Reviews Yet</h3><p>Reviews from your students will appear here.</p></div>
      ) : (
        filtered.map(r => (
          <div className="ir-card" key={r._id}>
            <div className="ir-card-header">
              <div>
                <h3>{r.course?.title || "Course"}</h3>
                <div className="ir-card-student">by {r.studentName || "Student"}</div>
              </div>
              <StarDisplay value={r.rating} />
            </div>
            {r.comment && <div className="ir-card-comment">{r.comment}</div>}
            <div className="ir-card-date">{new Date(r.updatedAt || r.createdAt).toLocaleString()}</div>
          </div>
        ))
      )}
    </DashboardLayout>
  );
};

export default InstructorReviews;
