import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { FiFileText, FiFilter, FiSend, FiCheckCircle, FiClock, FiAlertCircle, FiChevronDown, FiChevronUp } from "react-icons/fi";

const StudentAssignments = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("deadline");
  const [expandedId, setExpandedId] = useState(null);
  const [submitData, setSubmitData] = useState({ content: "", fileUrl: "" });
  const [submitting, setSubmitting] = useState(false);

  const fetchAssignments = async () => {
    try {
      const { data } = await api.get("/assignments/my");
      setAssignments(data.assignments || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load assignments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAssignments(); }, []);

  const courses = [...new Map(assignments.map(a => [a.course?._id, a.course?.title])).entries()]
    .filter(([id]) => id);

  const getMySubmission = (a) => a.submissions?.find(s => String(s.student?._id || s.student) === String(user?._id)) || null;
  const getStatus = (a) => {
    const sub = getMySubmission(a);
    if (!sub) return "pending";
    if (sub.score !== undefined && sub.score !== null) return "graded";
    return "submitted";
  };

  const filtered = assignments
    .filter(a => courseFilter === "all" || a.course?._id === courseFilter)
    .filter(a => statusFilter === "all" || getStatus(a) === statusFilter)
    .sort((a, b) => {
      if (sortBy === "deadline") return new Date(a.deadline) - new Date(b.deadline);
      if (sortBy === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
      return 0;
    });

  const handleSubmit = async (assignmentId) => {
    if (!submitData.content && !submitData.fileUrl) return;
    setSubmitting(true);
    try {
      await api.post(`/assignments/${assignmentId}/submit`, submitData);
      setSubmitData({ content: "", fileUrl: "" });
      setExpandedId(null);
      fetchAssignments();
    } catch (err) {
      setError(err.response?.data?.message || "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const statusConfig = {
    pending: { icon: <FiClock />, color: "#f59e0b", bg: "#fef3c7", label: "Pending" },
    submitted: { icon: <FiSend />, color: "#3b82f6", bg: "#dbeafe", label: "Submitted" },
    graded: { icon: <FiCheckCircle />, color: "#10b981", bg: "#d1fae5", label: "Graded" },
  };

  // Performance stats
  const totalAssignments = assignments.length;
  const submittedCount = assignments.filter(a => getStatus(a) !== "pending").length;
  const gradedOnes = assignments.filter(a => getStatus(a) === "graded");
  const avgScore = gradedOnes.length
    ? Math.round(gradedOnes.reduce((sum, a) => sum + (getMySubmission(a)?.score || 0), 0) / gradedOnes.length)
    : 0;

  return (
    <DashboardLayout title="Assignments" subtitle="Submit assignments and track your grades">
      <style>{`
        .sa-stats { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; margin-bottom: 28px; }
        .sa-stat { background: var(--bg-elevated, #fff); border: 1px solid var(--border-color, #e5e7eb); border-radius: 14px; padding: 20px; display: flex; flex-direction: column; gap: 6px; }
        .sa-stat span { font-size: 13px; color: var(--text-muted); }
        .sa-stat strong { font-size: 1.75rem; }
        .sa-filters { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 24px; align-items: center; }
        .sa-select { padding: 10px 14px; border-radius: 10px; border: 1px solid var(--border-color, #e5e7eb); background: var(--bg-elevated, #fff); color: var(--text-primary); font-size: 14px; min-width: 160px; }
        .sa-card { background: var(--bg-surface, #fff); border: 1px solid var(--border-color, #e5e7eb); border-radius: 16px; padding: 0; margin-bottom: 16px; overflow: hidden; transition: box-shadow 0.2s ease; }
        .sa-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
        .sa-card-header { padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; }
        .sa-card-left { flex: 1; }
        .sa-card-left h3 { font-size: 16px; font-weight: 700; color: var(--text-primary); margin: 0 0 4px; }
        .sa-card-meta { font-size: 13px; color: var(--text-secondary); display: flex; gap: 16px; flex-wrap: wrap; }
        .sa-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 99px; font-size: 12px; font-weight: 700; }
        .sa-expand-icon { font-size: 20px; color: var(--text-secondary); transition: transform 0.2s; }
        .sa-card-body { padding: 0 24px 20px; border-top: 1px solid var(--border-color, #e5e7eb); }
        .sa-desc { font-size: 14px; line-height: 1.6; color: var(--text-secondary); margin: 16px 0; white-space: pre-line; }
        .sa-submit-form { display: flex; flex-direction: column; gap: 12px; margin-top: 16px; }
        .sa-textarea { width: 100%; min-height: 100px; padding: 12px 14px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--bg-body); color: var(--text-primary); font-size: 14px; resize: vertical; font-family: inherit; }
        .sa-input { width: 100%; padding: 10px 14px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--bg-body); color: var(--text-primary); font-size: 14px; }
        .sa-submit-btn { align-self: flex-end; background: #10b981; color: white; border: none; padding: 10px 24px; border-radius: 10px; font-weight: 600; font-size: 14px; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: background 0.2s; }
        .sa-submit-btn:hover { background: #059669; }
        .sa-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .sa-result { background: var(--bg-body); border-radius: 12px; padding: 16px 20px; margin-top: 16px; }
        .sa-result-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .sa-result-label { font-size: 13px; color: var(--text-secondary); }
        .sa-result-value { font-size: 15px; font-weight: 700; }
        .sa-score-bar { height: 8px; background: var(--border-color); border-radius: 99px; overflow: hidden; margin-top: 8px; }
        .sa-score-fill { height: 100%; border-radius: 99px; transition: width 0.4s ease; }
        .sa-empty { text-align: center; padding: 60px 20px; color: var(--text-secondary); }
        .sa-empty-icon { font-size: 48px; color: var(--text-muted); margin-bottom: 16px; }
        .sa-error { background: #fef2f2; border: 1px solid #fee2e2; color: #991b1b; padding: 12px 16px; border-radius: 10px; margin-bottom: 16px; font-size: 13px; display: flex; align-items: center; gap: 8px; }
      `}</style>

      {error && <div className="sa-error"><FiAlertCircle /> {error}</div>}

      {/* Performance Stats */}
      <div className="sa-stats">
        <div className="sa-stat"><span>Total Assignments</span><strong style={{color:"var(--text-primary)"}}>{totalAssignments}</strong></div>
        <div className="sa-stat"><span>Submitted</span><strong style={{color:"#3b82f6"}}>{submittedCount}</strong></div>
        <div className="sa-stat"><span>Graded</span><strong style={{color:"#10b981"}}>{gradedOnes.length}</strong></div>
        <div className="sa-stat"><span>Avg Score</span><strong style={{color:"#f59e0b"}}>{avgScore}%</strong></div>
      </div>

      {/* Filters */}
      <div className="sa-filters">
        <FiFilter style={{ color: "var(--text-secondary)" }} />
        <select className="sa-select" value={courseFilter} onChange={e => setCourseFilter(e.target.value)}>
          <option value="all">All Courses</option>
          {courses.map(([id, title]) => <option key={id} value={id}>{title}</option>)}
        </select>
        <select className="sa-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="submitted">Submitted</option>
          <option value="graded">Graded</option>
        </select>
        <select className="sa-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="deadline">Sort by Deadline</option>
          <option value="newest">Sort by Newest</option>
        </select>
      </div>

      {loading ? (
        <p style={{ textAlign: "center", padding: "40px" }}>Loading assignments...</p>
      ) : filtered.length === 0 ? (
        <div className="sa-empty">
          <div className="sa-empty-icon"><FiFileText /></div>
          <h3>No Assignments Found</h3>
          <p>Assignments from your enrolled courses will appear here.</p>
        </div>
      ) : (
        filtered.map(a => {
          const status = getStatus(a);
          const sc = statusConfig[status];
          const sub = getMySubmission(a);
          const isExpanded = expandedId === a._id;
          const isPastDeadline = a.deadline && new Date(a.deadline) < new Date();

          return (
            <div className="sa-card" key={a._id}>
              <div className="sa-card-header" onClick={() => setExpandedId(isExpanded ? null : a._id)}>
                <div className="sa-card-left">
                  <h3>{a.title}</h3>
                  <div className="sa-card-meta">
                    <span>📚 {a.course?.title || "Course"}</span>
                    {a.deadline && <span>📅 Due: {new Date(a.deadline).toLocaleDateString()}</span>}
                    <span>🏆 Max: {a.maxScore} pts</span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span className="sa-badge" style={{ background: sc.bg, color: sc.color }}>{sc.icon} {sc.label}</span>
                  <span className="sa-expand-icon">{isExpanded ? <FiChevronUp /> : <FiChevronDown />}</span>
                </div>
              </div>

              {isExpanded && (
                <div className="sa-card-body">
                  {a.description && <div className="sa-desc">{a.description}</div>}

                  {/* If graded, show result */}
                  {status === "graded" && sub && (
                    <div className="sa-result">
                      <div className="sa-result-row">
                        <span className="sa-result-label">Score</span>
                        <span className="sa-result-value" style={{ color: sub.score >= a.maxScore * 0.5 ? "#10b981" : "#ef4444" }}>
                          {sub.score} / {a.maxScore}
                        </span>
                      </div>
                      <div className="sa-score-bar">
                        <div className="sa-score-fill" style={{ width: `${(sub.score / a.maxScore) * 100}%`, background: sub.score >= a.maxScore * 0.5 ? "#10b981" : "#ef4444" }} />
                      </div>
                      {sub.feedback && (
                        <div style={{ marginTop: 12 }}>
                          <span className="sa-result-label">Instructor Feedback</span>
                          <p style={{ fontSize: 14, marginTop: 4, color: "var(--text-primary)", lineHeight: 1.5 }}>{sub.feedback}</p>
                        </div>
                      )}
                      <div style={{ marginTop: 8, fontSize: 12, color: "var(--text-muted)" }}>
                        Submitted: {new Date(sub.submittedAt).toLocaleString()}
                      </div>
                    </div>
                  )}

                  {/* If submitted but not graded */}
                  {status === "submitted" && sub && (
                    <div className="sa-result">
                      <p style={{ fontSize: 14, color: "#3b82f6", fontWeight: 600 }}>✓ Submitted on {new Date(sub.submittedAt).toLocaleString()}</p>
                      {sub.content && <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 8 }}>Your answer: {sub.content}</p>}
                      <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 8 }}>Awaiting grade from instructor...</p>
                    </div>
                  )}

                  {/* If pending, show submit form */}
                  {status === "pending" && (
                    <div className="sa-submit-form">
                      {isPastDeadline && (
                        <div style={{ background: "#fef3c7", padding: "10px 14px", borderRadius: 8, fontSize: 13, color: "#92400e" }}>
                          ⚠️ This assignment is past its deadline. Late submissions may not be accepted.
                        </div>
                      )}
                      <textarea
                        className="sa-textarea"
                        placeholder="Type your answer here..."
                        value={submitData.content}
                        onChange={e => setSubmitData({ ...submitData, content: e.target.value })}
                      />
                      <input
                        className="sa-input"
                        type="text"
                        placeholder="Optional: Paste file/document URL"
                        value={submitData.fileUrl}
                        onChange={e => setSubmitData({ ...submitData, fileUrl: e.target.value })}
                      />
                      <button
                        className="sa-submit-btn"
                        disabled={submitting || (!submitData.content && !submitData.fileUrl)}
                        onClick={() => handleSubmit(a._id)}
                      >
                        <FiSend /> {submitting ? "Submitting..." : "Submit Assignment"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
    </DashboardLayout>
  );
};

export default StudentAssignments;
