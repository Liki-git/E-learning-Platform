import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/client";
import Toast from "../../components/Toast";

const StudentReviewsPage = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [myReviews, setMyReviews] = useState([]);
  const [form, setForm] = useState({ courseId: "", rating: 5, comment: "" });
  const [toast, setToast] = useState("");

  useEffect(() => {
    api.get("/enrollments/my").then(({ data }) => {
      setEnrollments((data.enrollments || []).filter((e) =>
        e.status !== "wishlist" && (e.paymentStatus === "paid" || e.paymentStatus === "free")
      ));
    });
    api.get("/reviews/my").then(({ data }) => setMyReviews(data.reviews || []));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    const { data } = await api.post("/reviews", form);
    setToast(`Review saved — course rating updated to ★ ${data.course?.rating ?? ""}`);
    setForm({ courseId: "", rating: 5, comment: "" });
    const list = await api.get("/reviews/my");
    setMyReviews(list.data.reviews || []);
  };

  return (
    <DashboardLayout title="Reviews" subtitle="Rate courses you've enrolled in">
      <Toast message={toast} onClose={() => setToast("")} />
      <form className="feature-form feature-form--wide" onSubmit={submit}>
        <h3>Write a review</h3>
        <select value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })} required>
          <option value="">Select course</option>
          {enrollments.map((e) => <option key={e.course?.id} value={e.course?.id}>{e.course?.title}</option>)}
        </select>
        <label>Rating
          <select value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })}>
            {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} stars</option>)}
          </select>
        </label>
        <textarea rows={4} placeholder="Your review" value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} />
        <button type="submit" className="btn btn--primary">Submit review</button>
      </form>
      <div className="feature-grid">
        {myReviews.map((r) => (
          <article key={r._id} className="feature-card">
            <h3>{r.course?.title}</h3>
            <p>{"★".repeat(r.rating)}</p>
            <p>{r.comment}</p>
            <time>{new Date(r.createdAt).toLocaleDateString()}</time>
          </article>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default StudentReviewsPage;
