import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/client";
import Toast from "../../components/Toast";

const InstructorQAPage = () => {
  const [courses, setCourses] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [courseFilter, setCourseFilter] = useState("all");
  const [replyText, setReplyText] = useState({});
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get("/qa/my")
      .then(({ data }) => {
        setQuestions(data.questions || []);
        setCourses(data.courses || []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (courseFilter === "all") return questions;
    return questions.filter((q) => String(q.course?._id || q.course) === String(courseFilter));
  }, [questions, courseFilter]);

  const reply = async (id) => {
    const message = replyText[id]?.trim();
    if (!message) return;
    try {
      await api.post(`/qa/${id}/reply`, { message });
      setReplyText({ ...replyText, [id]: "" });
      setToast("Reply posted");
      load();
    } catch (err) {
      setToast(err.response?.data?.message || "Could not post reply");
    }
  };

  return (
    <DashboardLayout title="Q&A" subtitle="View and reply to all student questions on your courses">
      <Toast message={toast} onClose={() => setToast("")} />
      <div className="feature-toolbar">
        <select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} className="feature-select">
          <option value="all">All courses ({questions.length})</option>
          {courses.map((c) => {
            const count = questions.filter((q) => String(q.course?._id || q.course) === String(c._id)).length;
            return (
              <option key={c._id} value={c._id}>
                {c.title} ({count})
              </option>
            );
          })}
        </select>
      </div>
      {loading ? (
        <p className="dash-empty">Loading questions...</p>
      ) : (
        <div className="qa-list">
          {filtered.length === 0 ? (
            <p className="dash-empty">No questions yet on your courses.</p>
          ) : filtered.map((q) => (
            <article key={q._id} className="qa-thread">
              <span className="feature-card__tag">{q.course?.title || "Course"}</span>
              <h4>{q.studentName}: {q.question}</h4>
              <time>{new Date(q.createdAt).toLocaleString()}</time>
              {(q.replies || []).map((r, i) => (
                <div key={i} className="qa-reply">
                  <strong>{r.userName} ({r.userRole})</strong>
                  <p>{r.message}</p>
                  <time>{new Date(r.createdAt).toLocaleString()}</time>
                </div>
              ))}
              <div className="qa-reply-form">
                <input
                  value={replyText[q._id] || ""}
                  onChange={(e) => setReplyText({ ...replyText, [q._id]: e.target.value })}
                  placeholder="Write your reply as instructor..."
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), reply(q._id))}
                />
                <button type="button" className="btn btn--primary btn--sm" onClick={() => reply(q._id)}>Reply</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default InstructorQAPage;
