import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/client";

const InstructorReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
  const [courseFilter, setCourseFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/reviews/my")
      .then(({ data }) => setReviews(data.reviews || []))
      .finally(() => setLoading(false));
  }, []);

  const courses = useMemo(() => {
    const map = new Map();
    reviews.forEach((r) => {
      const id = r.course?._id || r.course;
      if (id && !map.has(String(id))) {
        map.set(String(id), { id, title: r.course?.title || "Course" });
      }
    });
    return Array.from(map.values());
  }, [reviews]);

  const filtered = useMemo(() => {
    if (courseFilter === "all") return reviews;
    return reviews.filter((r) => String(r.course?._id || r.course) === String(courseFilter));
  }, [reviews, courseFilter]);

  const avgRating = filtered.length
    ? (filtered.reduce((s, r) => s + r.rating, 0) / filtered.length).toFixed(1)
    : "0";

  return (
    <DashboardLayout title="Reviews" subtitle="Student feedback on your courses">
      <div className="feature-toolbar">
        <select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} className="feature-select">
          <option value="all">All courses ({reviews.length})</option>
          {courses.map((c) => {
            const count = reviews.filter((r) => String(r.course?.id || r.course?._id || r.course) === String(c.id)).length;
            return (
              <option key={c.id} value={c.id}>
                {c.title} ({count})
              </option>
            );
          })}
        </select>
        {filtered.length > 0 && (
          <p className="feature-toolbar__stat">Average: ★ {avgRating} · {filtered.length} review{filtered.length !== 1 ? "s" : ""}</p>
        )}
      </div>
      {loading ? (
        <p className="dash-empty">Loading reviews...</p>
      ) : (
        <div className="feature-grid">
          {filtered.length === 0 ? (
            <p className="dash-empty">No reviews yet on your courses.</p>
          ) : filtered.map((r) => (
            <article key={r._id} className="feature-card">
              <span className="feature-card__tag">{r.course?.title}</span>
              <p><strong>{r.studentName}</strong></p>
              <p className="review-stars">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</p>
              <p>{r.comment || <em>No comment</em>}</p>
              <time className="feature-card__meta">{new Date(r.createdAt).toLocaleString()}</time>
            </article>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default InstructorReviewsPage;
