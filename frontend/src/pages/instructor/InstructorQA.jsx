import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/client";
import { FiHelpCircle, FiFilter, FiSend, FiMessageCircle, FiAlertCircle, FiChevronDown, FiChevronUp } from "react-icons/fi";

const InstructorQA = () => {
  const [questions, setQuestions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [expandedId, setExpandedId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

  const fetchData = async () => {
    try {
      const { data } = await api.get("/qa/my");
      setQuestions(data.questions || []);
      setCourses(data.courses || []);
    } catch (err) { setError(err.response?.data?.message || err.message || "Failed to load Q&A."); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = questions
    .filter(q => courseFilter === "all" || q.course?._id === courseFilter)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const handleReply = async (questionId) => {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      await api.post(`/qa/${questionId}/reply`, { message: replyText.trim() });
      setReplyText("");
      fetchData();
    } catch (err) { setError(err.response?.data?.message || err.message || "Failed to send reply."); }
    finally { setSending(false); }
  };

  const totalQ = questions.length;
  const answeredByMe = questions.filter(q => q.replies?.some(r => r.userRole === "instructor")).length;
  const unanswered = totalQ - answeredByMe;

  return (
    <DashboardLayout title="Q&A" subtitle="Answer student questions about your courses">
      <style>{`
        .iqa-stats { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; margin-bottom: 28px; }
        .iqa-stat { background: var(--bg-elevated); border: 1px solid var(--border-color); border-radius: 14px; padding: 20px; display: flex; flex-direction: column; gap: 6px; }
        .iqa-stat span { font-size: 13px; color: var(--text-muted); }
        .iqa-stat strong { font-size: 1.75rem; }
        .iqa-toolbar { display: flex; gap: 12px; margin-bottom: 24px; align-items: center; flex-wrap: wrap; }
        .iqa-select { padding: 10px 14px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--bg-elevated); color: var(--text-primary); font-size: 14px; min-width: 160px; }
        .iqa-card { background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 16px; margin-bottom: 16px; overflow: hidden; }
        .iqa-card.unanswered { border-left: 4px solid #f59e0b; }
        .iqa-card.answered { border-left: 4px solid #10b981; }
        .iqa-card-header { padding: 20px 24px; cursor: pointer; display: flex; justify-content: space-between; align-items: flex-start; }
        .iqa-card-header:hover { background: var(--bg-body); }
        .iqa-card-left h3 { font-size: 15px; font-weight: 700; color: var(--text-primary); margin: 0 0 6px; }
        .iqa-card-meta { font-size: 13px; color: var(--text-secondary); display: flex; gap: 16px; flex-wrap: wrap; }
        .iqa-reply-count { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 99px; font-size: 12px; font-weight: 700; }
        .iqa-card-body { padding: 0 24px 20px; border-top: 1px solid var(--border-color); }
        .iqa-thread { display: flex; flex-direction: column; gap: 12px; margin-top: 16px; }
        .iqa-reply { padding: 14px 18px; border-radius: 12px; }
        .iqa-reply.student-reply { background: var(--bg-body); border-left: 3px solid #3b82f6; }
        .iqa-reply.instructor-reply { background: #f0fdf4; border-left: 3px solid #10b981; }
        [data-theme="dark"] .iqa-reply.instructor-reply { background: #064e3b; }
        .iqa-reply-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
        .iqa-reply-name { font-size: 13px; font-weight: 700; }
        .iqa-reply-role { font-size: 11px; padding: 2px 8px; border-radius: 99px; font-weight: 600; }
        .iqa-reply-time { font-size: 11px; color: var(--text-muted); }
        .iqa-reply-text { font-size: 14px; color: var(--text-primary); line-height: 1.5; }
        .iqa-reply-form { display: flex; gap: 10px; margin-top: 16px; }
        .iqa-reply-input { flex: 1; padding: 10px 14px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--bg-body); color: var(--text-primary); font-size: 14px; }
        .iqa-send-btn { background: #10b981; color: white; border: none; border-radius: 10px; padding: 10px 16px; cursor: pointer; font-size: 16px; display: flex; align-items: center; }
        .iqa-send-btn:hover { background: #059669; }
        .iqa-empty { text-align: center; padding: 60px 20px; color: var(--text-secondary); }
        .iqa-empty-icon { font-size: 48px; color: var(--text-muted); margin-bottom: 16px; }
        .iqa-error { background: #fef2f2; border: 1px solid #fee2e2; color: #991b1b; padding: 12px 16px; border-radius: 10px; margin-bottom: 16px; font-size: 13px; display: flex; align-items: center; gap: 8px; }
      `}</style>

      {error && <div className="iqa-error"><FiAlertCircle /> {error}</div>}

      <div className="iqa-stats">
        <div className="iqa-stat"><span>Total Questions</span><strong style={{color:"var(--text-primary)"}}>{totalQ}</strong></div>
        <div className="iqa-stat"><span>Answered</span><strong style={{color:"#10b981"}}>{answeredByMe}</strong></div>
        <div className="iqa-stat"><span>Unanswered</span><strong style={{color:"#f59e0b"}}>{unanswered}</strong></div>
      </div>

      <div className="iqa-toolbar">
        <FiFilter style={{ color: "var(--text-secondary)" }} />
        <select className="iqa-select" value={courseFilter} onChange={e => setCourseFilter(e.target.value)}>
          <option value="all">All Courses</option>
          {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
        </select>
      </div>

      {loading ? <p style={{ textAlign: "center", padding: 40 }}>Loading...</p>
      : filtered.length === 0 ? (
        <div className="iqa-empty"><div className="iqa-empty-icon"><FiHelpCircle /></div><h3>No Questions</h3><p>Student questions will appear here.</p></div>
      ) : (
        filtered.map(q => {
          const isExpanded = expandedId === q._id;
          const hasInstructorReply = q.replies?.some(r => r.userRole === "instructor");
          return (
            <div className={`iqa-card ${hasInstructorReply ? "answered" : "unanswered"}`} key={q._id}>
              <div className="iqa-card-header" onClick={() => setExpandedId(isExpanded ? null : q._id)}>
                <div className="iqa-card-left">
                  <h3>{q.question}</h3>
                  <div className="iqa-card-meta">
                    <span>📚 {q.course?.title}</span>
                    <span>👤 {q.studentName}</span>
                    <span>📅 {new Date(q.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span className="iqa-reply-count" style={{ background: hasInstructorReply ? "#d1fae5" : "#fef3c7", color: hasInstructorReply ? "#065f46" : "#92400e" }}>
                    <FiMessageCircle /> {q.replies?.length || 0}
                  </span>
                  <span style={{ fontSize: 20, color: "var(--text-secondary)" }}>{isExpanded ? <FiChevronUp /> : <FiChevronDown />}</span>
                </div>
              </div>
              {isExpanded && (
                <div className="iqa-card-body">
                  <div className="iqa-thread">
                    {(q.replies || []).map((r, idx) => (
                      <div key={idx} className={`iqa-reply ${r.userRole === "instructor" ? "instructor-reply" : "student-reply"}`}>
                        <div className="iqa-reply-header">
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span className="iqa-reply-name">{r.userName}</span>
                            <span className="iqa-reply-role" style={{ background: r.userRole === "instructor" ? "#d1fae5" : "#dbeafe", color: r.userRole === "instructor" ? "#065f46" : "#1e40af" }}>{r.userRole}</span>
                          </div>
                          <span className="iqa-reply-time">{new Date(r.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="iqa-reply-text">{r.message}</div>
                      </div>
                    ))}
                  </div>
                  <div className="iqa-reply-form">
                    <input className="iqa-reply-input" placeholder="Write your answer..." value={expandedId === q._id ? replyText : ""} onChange={e => setReplyText(e.target.value)} />
                    <button className="iqa-send-btn" disabled={sending || !replyText.trim()} onClick={() => handleReply(q._id)}><FiSend /></button>
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </DashboardLayout>
  );
};

export default InstructorQA;
