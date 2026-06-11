import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/client";
import { FiFileText, FiFilter, FiPlus, FiCheckCircle, FiClock, FiUsers, FiAlertCircle, FiChevronDown, FiChevronUp, FiX } from "react-icons/fi";

const InstructorAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [myCourses, setMyCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [expandedId, setExpandedId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ courseId: "", title: "", description: "", deadline: "", maxScore: 100 });
  const [creating, setCreating] = useState(false);
  const [gradeData, setGradeData] = useState({ studentId: "", score: "", feedback: "" });
  const [grading, setGrading] = useState(false);
  const [gradeAssignmentId, setGradeAssignmentId] = useState(null);

  const fetchData = async () => {
    try {
      const [aRes, cRes] = await Promise.all([
        api.get("/assignments/my"),
        api.get("/courses?status="),
      ]);
      setAssignments(aRes.data.assignments || []);
      setMyCourses((cRes.data.courses || cRes.data || []));
    } catch (err) { setError(err.response?.data?.message || err.message || "Failed to load data."); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = assignments
    .filter(a => courseFilter === "all" || a.course?._id === courseFilter)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const totalSubmissions = assignments.reduce((s, a) => s + (a.submissions?.length || 0), 0);
  const gradedCount = assignments.reduce((s, a) => s + (a.submissions?.filter(sub => sub.score !== undefined && sub.score !== null).length || 0), 0);
  const pendingGrade = totalSubmissions - gradedCount;

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.courseId || !form.title || !form.deadline) { setError("Course, title, and deadline are required."); return; }
    setCreating(true);
    setError("");
    try {
      await api.post("/assignments", form);
      setShowCreate(false);
      setForm({ courseId: "", title: "", description: "", deadline: "", maxScore: 100 });
      fetchData();
    } catch (err) { setError(err.response?.data?.message || "Failed to create."); }
    finally { setCreating(false); }
  };

  const handleGrade = async (assignmentId) => {
    if (!gradeData.studentId || gradeData.score === "") return;
    setGrading(true);
    try {
      await api.patch(`/assignments/${assignmentId}/grade`, {
        studentId: gradeData.studentId,
        score: Number(gradeData.score),
        feedback: gradeData.feedback,
      });
      setGradeData({ studentId: "", score: "", feedback: "" });
      setGradeAssignmentId(null);
      fetchData();
    } catch (err) { setError(err.response?.data?.message || "Failed to grade."); }
    finally { setGrading(false); }
  };

  return (
    <DashboardLayout title="Assignments" subtitle="Create assignments and grade student submissions">
      <style>{`
        .ia-stats { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; margin-bottom: 28px; }
        .ia-stat { background: var(--bg-elevated); border: 1px solid var(--border-color); border-radius: 14px; padding: 20px; display: flex; flex-direction: column; gap: 6px; }
        .ia-stat span { font-size: 13px; color: var(--text-muted); }
        .ia-stat strong { font-size: 1.75rem; }
        .ia-toolbar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 24px; }
        .ia-filters { display: flex; gap: 12px; align-items: center; }
        .ia-select { padding: 10px 14px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--bg-elevated); color: var(--text-primary); font-size: 14px; min-width: 160px; }
        .ia-create-btn { background: #10b981; color: white; border: none; padding: 10px 20px; border-radius: 10px; font-weight: 600; font-size: 14px; cursor: pointer; display: flex; align-items: center; gap: 8px; }
        .ia-create-btn:hover { background: #059669; }
        .ia-card { background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 16px; margin-bottom: 16px; overflow: hidden; }
        .ia-card-header { padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; }
        .ia-card-header:hover { background: var(--bg-body); }
        .ia-card-left h3 { font-size: 16px; font-weight: 700; margin: 0 0 4px; color: var(--text-primary); }
        .ia-card-meta { font-size: 13px; color: var(--text-secondary); display: flex; gap: 16px; flex-wrap: wrap; }
        .ia-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 99px; font-size: 12px; font-weight: 700; }
        .ia-card-body { padding: 0 24px 24px; border-top: 1px solid var(--border-color); }
        .ia-sub-table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        .ia-sub-table th, .ia-sub-table td { padding: 12px 16px; text-align: left; border-bottom: 1px solid var(--border-color); font-size: 14px; }
        .ia-sub-table th { font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; background: var(--bg-body); }
        .ia-grade-btn { background: #3b82f6; color: white; border: none; padding: 6px 14px; border-radius: 8px; font-size: 13px; cursor: pointer; font-weight: 600; }
        .ia-grade-btn:hover { background: #2563eb; }
        .ia-grade-form { background: var(--bg-body); padding: 20px; border-radius: 12px; margin-top: 12px; display: flex; flex-direction: column; gap: 12px; }
        .ia-grade-input { padding: 10px 14px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--bg-surface); color: var(--text-primary); font-size: 14px; font-family: inherit; }
        .ia-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 9999; display: flex; align-items: center; justify-content: center; }
        .ia-modal { background: var(--bg-surface); border-radius: 16px; padding: 32px; width: 90%; max-width: 520px; max-height: 90vh; overflow-y: auto; }
        .ia-modal h2 { margin: 0 0 20px; font-size: 18px; display: flex; justify-content: space-between; align-items: center; }
        .ia-modal-field { width: 100%; padding: 10px 14px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--bg-body); color: var(--text-primary); font-size: 14px; margin-bottom: 14px; font-family: inherit; }
        .ia-empty { text-align: center; padding: 60px 20px; color: var(--text-secondary); }
        .ia-empty-icon { font-size: 48px; color: var(--text-muted); margin-bottom: 16px; }
        .ia-error { background: #fef2f2; border: 1px solid #fee2e2; color: #991b1b; padding: 12px 16px; border-radius: 10px; margin-bottom: 16px; font-size: 13px; display: flex; align-items: center; gap: 8px; }
      `}</style>

      {error && <div className="ia-error"><FiAlertCircle /> {error}</div>}

      {showCreate && (
        <div className="ia-modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="ia-modal" onClick={e => e.stopPropagation()}>
            <h2>Create Assignment <button onClick={() => setShowCreate(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "var(--text-secondary)" }}><FiX /></button></h2>
            <form onSubmit={handleCreate}>
              <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Course</label>
              <select className="ia-modal-field" value={form.courseId} onChange={e => setForm({ ...form, courseId: e.target.value })}>
                <option value="">Select Course...</option>
                {myCourses.map(c => <option key={c.id || c._id} value={c.id || c._id}>{c.title}</option>)}
              </select>
              <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Title</label>
              <input className="ia-modal-field" placeholder="Assignment title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Description</label>
              <textarea className="ia-modal-field" style={{ height: 80, resize: "none" }} placeholder="Describe the assignment..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Deadline</label>
              <input className="ia-modal-field" type="datetime-local" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />
              <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Max Score</label>
              <input className="ia-modal-field" type="number" value={form.maxScore} onChange={e => setForm({ ...form, maxScore: e.target.value })} />
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
                <button type="button" className="btn btn--outline" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn--primary" disabled={creating}>{creating ? "Creating..." : "Create Assignment"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="ia-stats">
        <div className="ia-stat"><span>Total Assignments</span><strong style={{color:"var(--text-primary)"}}>{assignments.length}</strong></div>
        <div className="ia-stat"><span>Total Submissions</span><strong style={{color:"#3b82f6"}}>{totalSubmissions}</strong></div>
        <div className="ia-stat"><span>Graded</span><strong style={{color:"#10b981"}}>{gradedCount}</strong></div>
        <div className="ia-stat"><span>Pending Grade</span><strong style={{color:"#f59e0b"}}>{pendingGrade}</strong></div>
      </div>

      <div className="ia-toolbar">
        <div className="ia-filters">
          <FiFilter style={{ color: "var(--text-secondary)" }} />
          <select className="ia-select" value={courseFilter} onChange={e => setCourseFilter(e.target.value)}>
            <option value="all">All Courses</option>
            {myCourses.map(c => <option key={c.id || c._id} value={c.id || c._id}>{c.title}</option>)}
          </select>
        </div>
        <button className="ia-create-btn" onClick={() => setShowCreate(true)}><FiPlus /> Create Assignment</button>
      </div>

      {loading ? (
        <p style={{ textAlign: "center", padding: 40 }}>Loading...</p>
      ) : filtered.length === 0 ? (
        <div className="ia-empty"><div className="ia-empty-icon"><FiFileText /></div><h3>No Assignments</h3><p>Create your first assignment to get started.</p></div>
      ) : (
        filtered.map(a => {
          const isExpanded = expandedId === a._id;
          const subs = a.submissions || [];
          const gradedSubs = subs.filter(s => s.score !== undefined && s.score !== null);
          const avgScore = gradedSubs.length ? Math.round(gradedSubs.reduce((sum, s) => sum + s.score, 0) / gradedSubs.length) : null;

          return (
            <div className="ia-card" key={a._id}>
              <div className="ia-card-header" onClick={() => setExpandedId(isExpanded ? null : a._id)}>
                <div className="ia-card-left">
                  <h3>{a.title}</h3>
                  <div className="ia-card-meta">
                    <span>📚 {a.course?.title}</span>
                    <span>📅 Due: {a.deadline ? new Date(a.deadline).toLocaleDateString() : "—"}</span>
                    <span>🏆 Max: {a.maxScore} pts</span>
                    <span><FiUsers style={{verticalAlign:"middle"}} /> {subs.length} submissions</span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {avgScore !== null && <span className="ia-badge" style={{ background: "#d1fae5", color: "#065f46" }}>Avg: {avgScore}%</span>}
                  <span style={{ fontSize: 20, color: "var(--text-secondary)" }}>{isExpanded ? <FiChevronUp /> : <FiChevronDown />}</span>
                </div>
              </div>

              {isExpanded && (
                <div className="ia-card-body">
                  {a.description && <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: "16px 0", lineHeight: 1.6 }}>{a.description}</p>}

                  {subs.length === 0 ? (
                    <p style={{ textAlign: "center", color: "var(--text-muted)", padding: 20 }}>No submissions yet.</p>
                  ) : (
                    <table className="ia-sub-table">
                      <thead><tr><th>Student</th><th>Submitted</th><th>Score</th><th>Action</th></tr></thead>
                      <tbody>
                        {subs.map((s, idx) => (
                          <tr key={idx}>
                            <td style={{ fontWeight: 600 }}>{s.student?.fullName || s.student || "Student"}</td>
                            <td>{new Date(s.submittedAt).toLocaleString()}</td>
                            <td>{s.score !== undefined && s.score !== null ? <span style={{ fontWeight: 700, color: "#10b981" }}>{s.score}/{a.maxScore}</span> : <span style={{ color: "#f59e0b" }}>Ungraded</span>}</td>
                            <td>
                              {s.score === undefined || s.score === null ? (
                                <button className="ia-grade-btn" onClick={() => { setGradeAssignmentId(a._id); setGradeData({ studentId: s.student?._id || s.student, score: "", feedback: "" }); }}>Grade</button>
                              ) : (
                                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>✓ Graded</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {gradeAssignmentId === a._id && gradeData.studentId && (
                    <div className="ia-grade-form">
                      <h4 style={{ margin: 0, fontSize: 15 }}>Grade Submission</h4>
                      <input className="ia-grade-input" type="number" placeholder={`Score (0-${a.maxScore})`} value={gradeData.score} onChange={e => setGradeData({ ...gradeData, score: e.target.value })} max={a.maxScore} min={0} />
                      <textarea className="ia-grade-input" style={{ height: 60, resize: "none" }} placeholder="Feedback (optional)" value={gradeData.feedback} onChange={e => setGradeData({ ...gradeData, feedback: e.target.value })} />
                      <div style={{ display: "flex", gap: 12 }}>
                        <button className="btn btn--primary" disabled={grading || gradeData.score === ""} onClick={() => handleGrade(a._id)}>{grading ? "Saving..." : "Submit Grade"}</button>
                        <button className="btn btn--outline" onClick={() => { setGradeAssignmentId(null); setGradeData({ studentId: "", score: "", feedback: "" }); }}>Cancel</button>
                      </div>
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

export default InstructorAssignments;
