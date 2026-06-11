import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/client";
import { FiHelpCircle, FiFilter, FiPlus, FiUsers, FiAlertCircle, FiChevronDown, FiChevronUp, FiX, FiTrash2 } from "react-icons/fi";

const InstructorQuizzes = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [myCourses, setMyCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [expandedId, setExpandedId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ courseId: "", title: "", passingScore: 70 });
  const [questions, setQuestions] = useState([{ question: "", options: ["", "", "", ""], correctIndex: 0 }]);
  const [creating, setCreating] = useState(false);

  const fetchData = async () => {
    try {
      const [qRes, cRes] = await Promise.all([api.get("/quizzes/my"), api.get("/courses?status=")]);
      setQuizzes(qRes.data.quizzes || []);
      setMyCourses((cRes.data.courses || cRes.data || []));
    } catch (err) { setError(err.response?.data?.message || err.message || "Failed to load data."); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = quizzes
    .filter(q => courseFilter === "all" || q.course?._id === courseFilter)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const totalSubmissions = quizzes.reduce((s, q) => s + (q.submissions?.length || 0), 0);
  const passedCount = quizzes.reduce((s, q) => s + (q.submissions?.filter(sub => sub.passed).length || 0), 0);
  const avgScore = totalSubmissions
    ? Math.round(quizzes.reduce((s, q) => s + (q.submissions || []).reduce((ss, sub) => ss + sub.score, 0), 0) / totalSubmissions)
    : 0;

  const addQuestion = () => setQuestions([...questions, { question: "", options: ["", "", "", ""], correctIndex: 0 }]);
  const removeQuestion = (idx) => { if (questions.length > 1) setQuestions(questions.filter((_, i) => i !== idx)); };
  const updateQuestion = (idx, field, val) => {
    const updated = [...questions];
    updated[idx] = { ...updated[idx], [field]: val };
    setQuestions(updated);
  };
  const updateOption = (qIdx, oIdx, val) => {
    const updated = [...questions];
    updated[qIdx].options[oIdx] = val;
    setQuestions(updated);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.courseId || !form.title) { setError("Course and title required."); return; }
    if (questions.some(q => !q.question.trim() || q.options.some(o => !o.trim()))) { setError("Fill all question fields."); return; }
    setCreating(true);
    setError("");
    try {
      await api.post("/quizzes", { ...form, questions });
      setShowCreate(false);
      setForm({ courseId: "", title: "", passingScore: 70 });
      setQuestions([{ question: "", options: ["", "", "", ""], correctIndex: 0 }]);
      fetchData();
    } catch (err) { setError(err.response?.data?.message || "Failed to create."); }
    finally { setCreating(false); }
  };

  return (
    <DashboardLayout title="Quizzes" subtitle="Create quizzes and view student results">
      <style>{`
        .iq-stats { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; margin-bottom: 28px; }
        .iq-stat { background: var(--bg-elevated); border: 1px solid var(--border-color); border-radius: 14px; padding: 20px; display: flex; flex-direction: column; gap: 6px; }
        .iq-stat span { font-size: 13px; color: var(--text-muted); }
        .iq-stat strong { font-size: 1.75rem; }
        .iq-toolbar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 24px; }
        .iq-filters { display: flex; gap: 12px; align-items: center; }
        .iq-select { padding: 10px 14px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--bg-elevated); color: var(--text-primary); font-size: 14px; min-width: 160px; }
        .iq-create-btn { background: #10b981; color: white; border: none; padding: 10px 20px; border-radius: 10px; font-weight: 600; font-size: 14px; cursor: pointer; display: flex; align-items: center; gap: 8px; }
        .iq-create-btn:hover { background: #059669; }
        .iq-card { background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 16px; margin-bottom: 16px; overflow: hidden; }
        .iq-card-header { padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; }
        .iq-card-header:hover { background: var(--bg-body); }
        .iq-card-left h3 { font-size: 16px; font-weight: 700; margin: 0 0 4px; color: var(--text-primary); }
        .iq-card-meta { font-size: 13px; color: var(--text-secondary); display: flex; gap: 16px; flex-wrap: wrap; }
        .iq-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 99px; font-size: 12px; font-weight: 700; }
        .iq-card-body { padding: 0 24px 24px; border-top: 1px solid var(--border-color); }
        .iq-sub-table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        .iq-sub-table th, .iq-sub-table td { padding: 12px 16px; text-align: left; border-bottom: 1px solid var(--border-color); font-size: 14px; }
        .iq-sub-table th { font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; background: var(--bg-body); }
        .iq-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 9999; display: flex; align-items: center; justify-content: center; }
        .iq-modal { background: var(--bg-surface); border-radius: 16px; padding: 32px; width: 90%; max-width: 640px; max-height: 90vh; overflow-y: auto; }
        .iq-modal h2 { margin: 0 0 20px; font-size: 18px; display: flex; justify-content: space-between; }
        .iq-field { width: 100%; padding: 10px 14px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--bg-body); color: var(--text-primary); font-size: 14px; margin-bottom: 12px; font-family: inherit; }
        .iq-q-block { background: var(--bg-body); border-radius: 12px; padding: 20px; margin-bottom: 16px; position: relative; }
        .iq-q-block h4 { margin: 0 0 12px; font-size: 14px; color: var(--text-secondary); }
        .iq-q-remove { position: absolute; top: 12px; right: 12px; background: none; border: none; color: #ef4444; cursor: pointer; font-size: 16px; }
        .iq-opt-row { display: flex; gap: 8px; align-items: center; margin-bottom: 8px; }
        .iq-opt-row input[type="text"] { flex: 1; padding: 8px 12px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-surface); color: var(--text-primary); font-size: 13px; }
        .iq-opt-row input[type="radio"] { accent-color: #10b981; }
        .iq-add-q-btn { background: transparent; border: 1.5px dashed var(--border-color); border-radius: 10px; padding: 12px; width: 100%; color: var(--text-secondary); font-size: 14px; cursor: pointer; margin-bottom: 16px; }
        .iq-add-q-btn:hover { border-color: #10b981; color: #10b981; }
        .iq-empty { text-align: center; padding: 60px 20px; color: var(--text-secondary); }
        .iq-empty-icon { font-size: 48px; color: var(--text-muted); margin-bottom: 16px; }
        .iq-error { background: #fef2f2; border: 1px solid #fee2e2; color: #991b1b; padding: 12px 16px; border-radius: 10px; margin-bottom: 16px; font-size: 13px; display: flex; align-items: center; gap: 8px; }
      `}</style>

      {error && <div className="iq-error"><FiAlertCircle /> {error}</div>}

      {showCreate && (
        <div className="iq-modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="iq-modal" onClick={e => e.stopPropagation()}>
            <h2>Create Quiz <button onClick={() => setShowCreate(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "var(--text-secondary)" }}><FiX /></button></h2>
            <form onSubmit={handleCreate}>
              <select className="iq-field" value={form.courseId} onChange={e => setForm({ ...form, courseId: e.target.value })}>
                <option value="">Select Course...</option>
                {myCourses.map(c => <option key={c.id || c._id} value={c.id || c._id}>{c.title}</option>)}
              </select>
              <input className="iq-field" placeholder="Quiz Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              <input className="iq-field" type="number" placeholder="Passing Score (%)" value={form.passingScore} onChange={e => setForm({ ...form, passingScore: Number(e.target.value) })} />

              <h3 style={{ fontSize: 15, margin: "20px 0 12px" }}>Questions</h3>
              {questions.map((q, qIdx) => (
                <div className="iq-q-block" key={qIdx}>
                  <h4>Question {qIdx + 1}</h4>
                  {questions.length > 1 && <button type="button" className="iq-q-remove" onClick={() => removeQuestion(qIdx)}><FiTrash2 /></button>}
                  <input className="iq-field" placeholder="Enter question..." value={q.question} onChange={e => updateQuestion(qIdx, "question", e.target.value)} />
                  {q.options.map((opt, oIdx) => (
                    <div className="iq-opt-row" key={oIdx}>
                      <input type="radio" name={`correct_${qIdx}`} checked={q.correctIndex === oIdx} onChange={() => updateQuestion(qIdx, "correctIndex", oIdx)} />
                      <input type="text" placeholder={`Option ${oIdx + 1}`} value={opt} onChange={e => updateOption(qIdx, oIdx, e.target.value)} />
                    </div>
                  ))}
                  <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>Select the correct answer with the radio button</p>
                </div>
              ))}
              <button type="button" className="iq-add-q-btn" onClick={addQuestion}><FiPlus style={{ verticalAlign: "middle" }} /> Add Question</button>

              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button type="button" className="btn btn--outline" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn--primary" disabled={creating}>{creating ? "Creating..." : "Create Quiz"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="iq-stats">
        <div className="iq-stat"><span>Total Quizzes</span><strong style={{color:"var(--text-primary)"}}>{quizzes.length}</strong></div>
        <div className="iq-stat"><span>Submissions</span><strong style={{color:"#3b82f6"}}>{totalSubmissions}</strong></div>
        <div className="iq-stat"><span>Pass Rate</span><strong style={{color:"#10b981"}}>{totalSubmissions ? Math.round(passedCount / totalSubmissions * 100) : 0}%</strong></div>
        <div className="iq-stat"><span>Avg Score</span><strong style={{color:"#f59e0b"}}>{avgScore}%</strong></div>
      </div>

      <div className="iq-toolbar">
        <div className="iq-filters">
          <FiFilter style={{ color: "var(--text-secondary)" }} />
          <select className="iq-select" value={courseFilter} onChange={e => setCourseFilter(e.target.value)}>
            <option value="all">All Courses</option>
            {myCourses.map(c => <option key={c.id || c._id} value={c.id || c._id}>{c.title}</option>)}
          </select>
        </div>
        <button className="iq-create-btn" onClick={() => setShowCreate(true)}><FiPlus /> Create Quiz</button>
      </div>

      {loading ? (
        <p style={{ textAlign: "center", padding: 40 }}>Loading...</p>
      ) : filtered.length === 0 ? (
        <div className="iq-empty"><div className="iq-empty-icon"><FiHelpCircle /></div><h3>No Quizzes</h3><p>Create your first quiz.</p></div>
      ) : (
        filtered.map(q => {
          const isExpanded = expandedId === q._id;
          const subs = q.submissions || [];
          return (
            <div className="iq-card" key={q._id}>
              <div className="iq-card-header" onClick={() => setExpandedId(isExpanded ? null : q._id)}>
                <div className="iq-card-left">
                  <h3>{q.title}</h3>
                  <div className="iq-card-meta">
                    <span>📚 {q.course?.title}</span>
                    <span>❓ {q.questions?.length || 0} questions</span>
                    <span>🎯 Pass: {q.passingScore}%</span>
                    <span><FiUsers style={{verticalAlign:"middle"}} /> {subs.length} attempts</span>
                  </div>
                </div>
                <span style={{ fontSize: 20, color: "var(--text-secondary)" }}>{isExpanded ? <FiChevronUp /> : <FiChevronDown />}</span>
              </div>
              {isExpanded && (
                <div className="iq-card-body">
                  {subs.length === 0 ? (
                    <p style={{ textAlign: "center", color: "var(--text-muted)", padding: 20 }}>No submissions yet.</p>
                  ) : (
                    <table className="iq-sub-table">
                      <thead><tr><th>Student</th><th>Score</th><th>Status</th><th>Date</th></tr></thead>
                      <tbody>
                        {subs.map((s, idx) => (
                          <tr key={idx}>
                            <td style={{ fontWeight: 600 }}>{s.student?.fullName || s.student || "Student"}</td>
                            <td style={{ fontWeight: 700 }}>{s.score}%</td>
                            <td><span className="iq-badge" style={{ background: s.passed ? "#d1fae5" : "#fee2e2", color: s.passed ? "#065f46" : "#991b1b" }}>{s.passed ? "Passed" : "Failed"}</span></td>
                            <td>{new Date(s.submittedAt).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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

export default InstructorQuizzes;
