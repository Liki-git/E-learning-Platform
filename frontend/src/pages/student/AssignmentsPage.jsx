import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/client";
import Toast from "../../components/Toast";
import { useAuth } from "../../context/AuthContext";

const StudentAssignmentsPage = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [active, setActive] = useState(null);
  const [content, setContent] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [toast, setToast] = useState("");

  const load = () => api.get("/assignments/my").then(({ data }) => setAssignments(data.assignments || []));
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    await api.post(`/assignments/${active._id}/submit`, { content, fileUrl });
    setToast("Assignment submitted!");
    setActive(null);
    setContent("");
    setFileUrl("");
    load();
  };

  return (
    <DashboardLayout title="Assignments" subtitle="View deadlines and submit your work">
      <Toast message={toast} onClose={() => setToast("")} />
      {assignments.length === 0 ? (
        <p className="dash-empty">No assignments yet.</p>
      ) : (
        <div className="feature-grid">
          {assignments.map((a) => {
            const mine = a.submissions?.find((s) => String(s.student) === String(user?.id));
            const submitted = Boolean(mine);
            return (
              <article key={a._id} className="feature-card">
                <span className="feature-card__tag">{a.course?.title}</span>
                <h3>{a.title}</h3>
                <p>{a.description}</p>
                <p className="feature-card__meta">Due: {new Date(a.deadline).toLocaleString()} · Max {a.maxScore} pts</p>
                {mine?.score != null && <p className="success-msg">Graded: {mine.score}/{a.maxScore} — {mine.feedback || "No feedback"}</p>}
                {submitted && mine?.score == null && <p className="feature-card__meta">Submitted — awaiting grade</p>}
                <button type="button" className="btn btn--primary btn--sm" onClick={() => setActive(a)}>{submitted ? "Resubmit" : "Submit"}</button>
              </article>
            );
          })}
        </div>
      )}
      {active && (
        <div className="modal-overlay" onClick={() => setActive(null)}>
          <form className="modal-card" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
            <h3>{active.title}</h3>
            <textarea rows={5} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Your answer..." required />
            <input value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} placeholder="Optional file URL" />
            <button type="submit" className="btn btn--primary">Submit assignment</button>
          </form>
        </div>
      )}
    </DashboardLayout>
  );
};

export default StudentAssignmentsPage;
