import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/client";
import { FiHelpCircle, FiFilter, FiCheckCircle, FiXCircle, FiClock, FiAward, FiAlertCircle, FiChevronDown, FiChevronUp } from "react-icons/fi";

const StudentQuizzes = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedId, setExpandedId] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const fetchQuizzes = async () => {
    try {
      const { data } = await api.get("/quizzes/my");
      setQuizzes(data.quizzes || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load quizzes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchQuizzes(); }, []);

  const courses = [...new Map(quizzes.map(q => [q.course?._id, q.course?.title])).entries()].filter(([id]) => id);

  const getStatus = (q) => {
    if (q.mySubmission) return q.mySubmission.passed ? "passed" : "failed";
    return "not_taken";
  };

  const filtered = quizzes
    .filter(q => courseFilter === "all" || q.course?._id === courseFilter)
    .filter(q => statusFilter === "all" || getStatus(q) === statusFilter)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const handleSubmitQuiz = async (quizId) => {
    const quiz = quizzes.find(q => q._id === quizId);
    if (!quiz) return;
    const quizAnswers = quiz.questions.map((_, i) => answers[`${quizId}_${i}`] ?? -1);
    if (quizAnswers.some(a => a === -1)) {
      setError("Please answer all questions before submitting.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const { data } = await api.post(`/quizzes/${quizId}/submit`, { answers: quizAnswers });
      setResult({ quizId, ...data });
      setAnswers({});
      fetchQuizzes();
    } catch (err) {
      setError(err.response?.data?.message || "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const statusConfig = {
    not_taken: { icon: <FiClock />, color: "#f59e0b", bg: "#fef3c7", label: "Not Taken" },
    passed: { icon: <FiCheckCircle />, color: "#10b981", bg: "#d1fae5", label: "Passed" },
    failed: { icon: <FiXCircle />, color: "#ef4444", bg: "#fee2e2", label: "Failed" },
  };

  const totalQuizzes = quizzes.length;
  const takenCount = quizzes.filter(q => q.mySubmission).length;
  const passedCount = quizzes.filter(q => q.mySubmission?.passed).length;
  const avgScore = takenCount
    ? Math.round(quizzes.filter(q => q.mySubmission).reduce((s, q) => s + (q.mySubmission?.score || 0), 0) / takenCount)
    : 0;

  return (
    <DashboardLayout title="Quizzes" subtitle="Take quizzes and track your scores">
      <style>{`
        .sq-stats { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; margin-bottom: 28px; }
        .sq-stat { background: var(--bg-elevated, #fff); border: 1px solid var(--border-color, #e5e7eb); border-radius: 14px; padding: 20px; display: flex; flex-direction: column; gap: 6px; }
        .sq-stat span { font-size: 13px; color: var(--text-muted); }
        .sq-stat strong { font-size: 1.75rem; }
        .sq-filters { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 24px; align-items: center; }
        .sq-select { padding: 10px 14px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--bg-elevated); color: var(--text-primary); font-size: 14px; min-width: 160px; }
        .sq-card { background: var(--bg-surface, #fff); border: 1px solid var(--border-color); border-radius: 16px; margin-bottom: 16px; overflow: hidden; transition: box-shadow 0.2s; }
        .sq-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
        .sq-card-header { padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; }
        .sq-card-left h3 { font-size: 16px; font-weight: 700; margin: 0 0 4px; color: var(--text-primary); }
        .sq-card-meta { font-size: 13px; color: var(--text-secondary); display: flex; gap: 16px; }
        .sq-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 99px; font-size: 12px; font-weight: 700; }
        .sq-card-body { padding: 0 24px 24px; border-top: 1px solid var(--border-color); }
        .sq-question { background: var(--bg-body); border-radius: 12px; padding: 20px; margin-top: 16px; }
        .sq-question-text { font-size: 15px; font-weight: 600; color: var(--text-primary); margin-bottom: 14px; }
        .sq-question-num { font-size: 12px; color: #10b981; font-weight: 700; margin-bottom: 6px; }
        .sq-options { display: flex; flex-direction: column; gap: 8px; }
        .sq-option { display: flex; align-items: center; gap: 12px; padding: 10px 16px; border-radius: 10px; border: 1.5px solid var(--border-color); background: var(--bg-surface); cursor: pointer; font-size: 14px; color: var(--text-primary); transition: all 0.2s; }
        .sq-option:hover { border-color: #10b981; }
        .sq-option.selected { border-color: #10b981; background: #d1fae5; }
        [data-theme="dark"] .sq-option.selected { background: #064e3b; }
        .sq-option input { accent-color: #10b981; }
        .sq-submit-btn { margin-top: 20px; background: #10b981; color: white; border: none; padding: 12px 28px; border-radius: 10px; font-weight: 700; font-size: 15px; cursor: pointer; transition: background 0.2s; }
        .sq-submit-btn:hover { background: #059669; }
        .sq-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .sq-result-box { background: var(--bg-body); border-radius: 14px; padding: 24px; margin-top: 16px; text-align: center; }
        .sq-score-circle { width: 100px; height: 100px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 28px; font-weight: 800; }
        .sq-empty { text-align: center; padding: 60px 20px; color: var(--text-secondary); }
        .sq-empty-icon { font-size: 48px; color: var(--text-muted); margin-bottom: 16px; }
        .sq-error { background: #fef2f2; border: 1px solid #fee2e2; color: #991b1b; padding: 12px 16px; border-radius: 10px; margin-bottom: 16px; font-size: 13px; display: flex; align-items: center; gap: 8px; }
      `}</style>

      {error && <div className="sq-error"><FiAlertCircle /> {error}</div>}

      <div className="sq-stats">
        <div className="sq-stat"><span>Total Quizzes</span><strong style={{color:"var(--text-primary)"}}>{totalQuizzes}</strong></div>
        <div className="sq-stat"><span>Taken</span><strong style={{color:"#3b82f6"}}>{takenCount}</strong></div>
        <div className="sq-stat"><span>Passed</span><strong style={{color:"#10b981"}}>{passedCount}</strong></div>
        <div className="sq-stat"><span>Avg Score</span><strong style={{color:"#f59e0b"}}>{avgScore}%</strong></div>
      </div>

      <div className="sq-filters">
        <FiFilter style={{ color: "var(--text-secondary)" }} />
        <select className="sq-select" value={courseFilter} onChange={e => setCourseFilter(e.target.value)}>
          <option value="all">All Courses</option>
          {courses.map(([id, title]) => <option key={id} value={id}>{title}</option>)}
        </select>
        <select className="sq-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All Status</option>
          <option value="not_taken">Not Taken</option>
          <option value="passed">Passed</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {loading ? (
        <p style={{ textAlign: "center", padding: "40px" }}>Loading quizzes...</p>
      ) : filtered.length === 0 ? (
        <div className="sq-empty">
          <div className="sq-empty-icon"><FiHelpCircle /></div>
          <h3>No Quizzes Found</h3>
          <p>Quizzes from your enrolled courses will appear here.</p>
        </div>
      ) : (
        filtered.map(q => {
          const status = getStatus(q);
          const sc = statusConfig[status];
          const isExpanded = expandedId === q._id;
          const quizResult = result?.quizId === q._id ? result : null;

          return (
            <div className="sq-card" key={q._id}>
              <div className="sq-card-header" onClick={() => { setExpandedId(isExpanded ? null : q._id); setResult(null); }}>
                <div className="sq-card-left">
                  <h3>{q.title}</h3>
                  <div className="sq-card-meta">
                    <span>📚 {q.course?.title || "Course"}</span>
                    <span>❓ {q.questions?.length || 0} Questions</span>
                    <span>🎯 Pass: {q.passingScore}%</span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span className="sq-badge" style={{ background: sc.bg, color: sc.color }}>{sc.icon} {sc.label}</span>
                  <span style={{ fontSize: 20, color: "var(--text-secondary)" }}>{isExpanded ? <FiChevronUp /> : <FiChevronDown />}</span>
                </div>
              </div>

              {isExpanded && (
                <div className="sq-card-body">
                  {/* Show previous result */}
                  {q.mySubmission && !quizResult && (
                    <div className="sq-result-box">
                      <div className="sq-score-circle" style={{ background: q.mySubmission.passed ? "#d1fae5" : "#fee2e2", color: q.mySubmission.passed ? "#059669" : "#dc2626" }}>
                        {q.mySubmission.score}%
                      </div>
                      <p style={{ fontWeight: 700, fontSize: 16, color: q.mySubmission.passed ? "#059669" : "#dc2626" }}>
                        {q.mySubmission.passed ? "Passed! ✓" : "Not Passed ✗"}
                      </p>
                      <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 8 }}>
                        Taken on {new Date(q.mySubmission.submittedAt).toLocaleString()}
                      </p>
                      <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>You can retake this quiz to improve your score.</p>
                    </div>
                  )}

                  {/* Just-submitted result */}
                  {quizResult && (
                    <div className="sq-result-box">
                      <div className="sq-score-circle" style={{ background: quizResult.passed ? "#d1fae5" : "#fee2e2", color: quizResult.passed ? "#059669" : "#dc2626" }}>
                        {quizResult.score}%
                      </div>
                      <p style={{ fontWeight: 700, fontSize: 16, color: quizResult.passed ? "#059669" : "#dc2626" }}>
                        {quizResult.passed ? "Passed! 🎉" : "Not Passed"}
                      </p>
                      <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 8 }}>
                        {quizResult.correctCount} of {quizResult.totalQuestions} correct
                      </p>
                    </div>
                  )}

                  {/* Quiz questions */}
                  {!quizResult && (
                    <>
                      {(q.questions || []).map((question, qIdx) => (
                        <div className="sq-question" key={qIdx}>
                          <div className="sq-question-num">Question {qIdx + 1} of {q.questions.length}</div>
                          <div className="sq-question-text">{question.question}</div>
                          <div className="sq-options">
                            {(question.options || []).map((opt, oIdx) => (
                              <label
                                key={oIdx}
                                className={`sq-option ${answers[`${q._id}_${qIdx}`] === oIdx ? "selected" : ""}`}
                              >
                                <input
                                  type="radio"
                                  name={`q_${q._id}_${qIdx}`}
                                  checked={answers[`${q._id}_${qIdx}`] === oIdx}
                                  onChange={() => setAnswers({ ...answers, [`${q._id}_${qIdx}`]: oIdx })}
                                />
                                {opt}
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                      <button
                        className="sq-submit-btn"
                        disabled={submitting}
                        onClick={() => handleSubmitQuiz(q._id)}
                      >
                        {submitting ? "Submitting..." : "Submit Quiz"}
                      </button>
                    </>
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

export default StudentQuizzes;
