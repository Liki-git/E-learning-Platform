import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/client";
import { FiHelpCircle, FiFilter, FiSend, FiMessageCircle, FiAlertCircle, FiChevronDown, FiChevronUp } from "react-icons/fi";

const StudentQA = () => {
  const [questions, setQuestions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [expandedId, setExpandedId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [showAsk, setShowAsk] = useState(false);
  const [askCourse, setAskCourse] = useState("");
  const [askQuestion, setAskQuestion] = useState("");
  const [asking, setAsking] = useState(false);

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

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!askCourse || !askQuestion.trim()) return;
    setAsking(true);
    setError("");
    try {
      await api.post(`/qa/course/${askCourse}`, { question: askQuestion.trim() });
      setShowAsk(false);
      setAskCourse("");
      setAskQuestion("");
      fetchData();
    } catch (err) { setError(err.response?.data?.message || "Failed to post question."); }
    finally { setAsking(false); }
  };

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

  const totalQuestions = questions.length;
  const answeredCount = questions.filter(q => q.replies?.length > 0).length;

  return (
    <DashboardLayout title="Q&A" subtitle="Ask questions to your course instructors">
      <style>{`
        .sqa-stats { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; margin-bottom: 28px; }
        .sqa-stat { background: var(--bg-elevated); border: 1px solid var(--border-color); border-radius: 14px; padding: 20px; display: flex; flex-direction: column; gap: 6px; }
        .sqa-stat span { font-size: 13px; color: var(--text-muted); }
        .sqa-stat strong { font-size: 1.75rem; }
        .sqa-toolbar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 24px; }
        .sqa-filters { display: flex; gap: 12px; align-items: center; }
        .sqa-select { padding: 10px 14px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--bg-elevated); color: var(--text-primary); font-size: 14px; min-width: 160px; }
        .sqa-ask-btn { background: #10b981; color: white; border: none; padding: 10px 20px; border-radius: 10px; font-weight: 600; font-size: 14px; cursor: pointer; display: flex; align-items: center; gap: 8px; }
        .sqa-ask-btn:hover { background: #059669; }
        .sqa-card { background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 16px; margin-bottom: 16px; overflow: hidden; }
        .sqa-card-header { padding: 20px 24px; cursor: pointer; display: flex; justify-content: space-between; align-items: flex-start; }
        .sqa-card-header:hover { background: var(--bg-body); }
        .sqa-card-left h3 { font-size: 15px; font-weight: 700; color: var(--text-primary); margin: 0 0 6px; }
        .sqa-card-meta { font-size: 13px; color: var(--text-secondary); display: flex; gap: 16px; flex-wrap: wrap; }
        .sqa-reply-count { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 99px; font-size: 12px; font-weight: 700; background: #dbeafe; color: #1d4ed8; }
        .sqa-card-body { padding: 0 24px 20px; border-top: 1px solid var(--border-color); }
        .sqa-thread { display: flex; flex-direction: column; gap: 12px; margin-top: 16px; }
        .sqa-reply { padding: 14px 18px; border-radius: 12px; }
        .sqa-reply.student { background: var(--bg-body); border-left: 3px solid #3b82f6; }
        .sqa-reply.instructor { background: #f0fdf4; border-left: 3px solid #10b981; }
        [data-theme="dark"] .sqa-reply.instructor { background: #064e3b; }
        .sqa-reply-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
        .sqa-reply-name { font-size: 13px; font-weight: 700; }
        .sqa-reply-role { font-size: 11px; padding: 2px 8px; border-radius: 99px; font-weight: 600; }
        .sqa-reply-time { font-size: 11px; color: var(--text-muted); }
        .sqa-reply-text { font-size: 14px; color: var(--text-primary); line-height: 1.5; }
        .sqa-reply-form { display: flex; gap: 10px; margin-top: 16px; }
        .sqa-reply-input { flex: 1; padding: 10px 14px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--bg-body); color: var(--text-primary); font-size: 14px; }
        .sqa-send-btn { background: #10b981; color: white; border: none; border-radius: 10px; padding: 10px 16px; cursor: pointer; font-size: 16px; display: flex; align-items: center; }
        .sqa-send-btn:hover { background: #059669; }
        .sqa-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 9999; display: flex; align-items: center; justify-content: center; }
        .sqa-modal { background: var(--bg-surface); border-radius: 16px; padding: 32px; width: 90%; max-width: 500px; }
        .sqa-modal h2 { margin: 0 0 20px; font-size: 18px; }
        .sqa-modal-field { width: 100%; padding: 10px 14px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--bg-body); color: var(--text-primary); font-size: 14px; margin-bottom: 14px; font-family: inherit; }
        .sqa-empty { text-align: center; padding: 60px 20px; color: var(--text-secondary); }
        .sqa-empty-icon { font-size: 48px; color: var(--text-muted); margin-bottom: 16px; }
        .sqa-error { background: #fef2f2; border: 1px solid #fee2e2; color: #991b1b; padding: 12px 16px; border-radius: 10px; margin-bottom: 16px; font-size: 13px; display: flex; align-items: center; gap: 8px; }
      `}</style>

      {error && <div className="sqa-error"><FiAlertCircle /> {error}</div>}

      {showAsk && (
        <div className="sqa-modal-overlay" onClick={() => setShowAsk(false)}>
          <div className="sqa-modal" onClick={e => e.stopPropagation()}>
            <h2>Ask a Question</h2>
            <form onSubmit={handleAsk}>
              <select className="sqa-modal-field" value={askCourse} onChange={e => setAskCourse(e.target.value)}>
                <option value="">Select Course...</option>
                {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
              </select>
              <textarea className="sqa-modal-field" style={{ height: 120, resize: "none" }} placeholder="Type your question..." value={askQuestion} onChange={e => setAskQuestion(e.target.value)} />
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button type="button" className="btn btn--outline" onClick={() => setShowAsk(false)}>Cancel</button>
                <button type="submit" className="btn btn--primary" disabled={asking || !askCourse || !askQuestion.trim()}>{asking ? "Posting..." : "Post Question"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="sqa-stats">
        <div className="sqa-stat"><span>Questions Asked</span><strong style={{color:"var(--text-primary)"}}>{totalQuestions}</strong></div>
        <div className="sqa-stat"><span>Answered</span><strong style={{color:"#10b981"}}>{answeredCount}</strong></div>
        <div className="sqa-stat"><span>Pending</span><strong style={{color:"#f59e0b"}}>{totalQuestions - answeredCount}</strong></div>
      </div>

      <div className="sqa-toolbar">
        <div className="sqa-filters">
          <FiFilter style={{ color: "var(--text-secondary)" }} />
          <select className="sqa-select" value={courseFilter} onChange={e => setCourseFilter(e.target.value)}>
            <option value="all">All Courses</option>
            {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
          </select>
        </div>
        <button className="sqa-ask-btn" onClick={() => setShowAsk(true)}><FiHelpCircle /> Ask Question</button>
      </div>

      {loading ? (
        <p style={{ textAlign: "center", padding: 40 }}>Loading Q&A...</p>
      ) : filtered.length === 0 ? (
        <div className="sqa-empty">
          <div className="sqa-empty-icon"><FiHelpCircle /></div>
          <h3>No Questions Yet</h3>
          <p>Ask a question about any of your enrolled courses.</p>
        </div>
      ) : (
        filtered.map(q => {
          const isExpanded = expandedId === q._id;
          return (
            <div className="sqa-card" key={q._id}>
              <div className="sqa-card-header" onClick={() => setExpandedId(isExpanded ? null : q._id)}>
                <div className="sqa-card-left">
                  <h3>{q.question}</h3>
                  <div className="sqa-card-meta">
                    <span>📚 {q.course?.title || "Course"}</span>
                    <span>👤 {q.studentName}</span>
                    <span>📅 {new Date(q.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span className="sqa-reply-count"><FiMessageCircle /> {q.replies?.length || 0}</span>
                  <span style={{ fontSize: 20, color: "var(--text-secondary)" }}>{isExpanded ? <FiChevronUp /> : <FiChevronDown />}</span>
                </div>
              </div>

              {isExpanded && (
                <div className="sqa-card-body">
                  <div className="sqa-thread">
                    {(q.replies || []).map((r, idx) => (
                      <div key={idx} className={`sqa-reply ${r.userRole === "instructor" ? "instructor" : "student"}`}>
                        <div className="sqa-reply-header">
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span className="sqa-reply-name">{r.userName}</span>
                            <span className="sqa-reply-role" style={{
                              background: r.userRole === "instructor" ? "#d1fae5" : "#dbeafe",
                              color: r.userRole === "instructor" ? "#065f46" : "#1e40af"
                            }}>{r.userRole}</span>
                          </div>
                          <span className="sqa-reply-time">{new Date(r.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="sqa-reply-text">{r.message}</div>
                      </div>
                    ))}
                  </div>
                  <div className="sqa-reply-form">
                    <input className="sqa-reply-input" placeholder="Write a follow-up..." value={expandedId === q._id ? replyText : ""} onChange={e => setReplyText(e.target.value)} />
                    <button className="sqa-send-btn" disabled={sending || !replyText.trim()} onClick={() => handleReply(q._id)}><FiSend /></button>
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

export default StudentQA;
