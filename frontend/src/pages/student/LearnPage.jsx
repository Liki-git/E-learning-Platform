import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/client";
import Toast from "../../components/Toast";
import { useAuth } from "../../context/AuthContext";

const LearnPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);
  const [progress, setProgress] = useState(0);
  const [tab, setTab] = useState("lessons");
  const [assignments, setAssignments] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [newQ, setNewQ] = useState("");
  const [replyText, setReplyText] = useState({});
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState([]);
  const [quizResult, setQuizResult] = useState(null);
  const [submitContent, setSubmitContent] = useState("");
  const [activeAssignment, setActiveAssignment] = useState(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    api.get(`/courses/${id}`).then(({ data }) => {
      setCourse(data.course);
      const first = data.course.modules?.[0]?.lessons?.[0];
      setActiveLesson(first || null);
      setProgress(data.enrollment?.progress || 0);
    });
  }, [id]);

  useEffect(() => {
    if (!id) return;
    api.get("/assignments/my").then(({ data }) => {
      setAssignments((data.assignments || []).filter((a) => String(a.course?._id || a.course) === String(id)));
    });
    api.get("/quizzes/my").then(({ data }) => {
      setQuizzes((data.quizzes || []).filter((q) => String(q.course?._id || q.course) === String(id)));
    });
    api.get(`/qa/course/${id}`).then(({ data }) => setQuestions(data.questions || [])).catch(() => setQuestions([]));
  }, [id]);

  const markComplete = async (lesson) => {
    const totalLessons = course.modules.reduce((s, m) => s + m.lessons.length, 0);
    const completed = (progress / 100) * totalLessons + 1;
    const newProgress = Math.min(100, Math.round((completed / totalLessons) * 100));
    setProgress(newProgress);
    await api.patch(`/enrollments/${id}/progress`, {
      lessonId: lesson._id || lesson.title,
      progress: newProgress,
      hours: (lesson.duration || 10) / 60,
    });
    if (newProgress >= 100) {
      setToast("Course completed! Certificate issued — check your dashboard and email.");
    }
  };

  const openQuiz = async (quizId) => {
    const { data } = await api.get(`/quizzes/${quizId}`);
    setActiveQuiz(data.quiz);
    setQuizAnswers(Array(data.quiz.questions.length).fill(""));
    setQuizResult(null);
  };

  const submitQuiz = async (e) => {
    e.preventDefault();
    const { data } = await api.post(`/quizzes/${activeQuiz._id}/submit`, { answers: quizAnswers.map(Number) });
    setQuizResult(data);
    setToast(data.passed ? "Quiz passed!" : "Quiz submitted");
    const { data: list } = await api.get("/quizzes/my");
    setQuizzes((list.quizzes || []).filter((q) => String(q.course?._id || q.course) === String(id)));
  };

  const submitAssignment = async (e) => {
    e.preventDefault();
    await api.post(`/assignments/${activeAssignment._id}/submit`, { content: submitContent });
    setToast("Assignment submitted!");
    setActiveAssignment(null);
    setSubmitContent("");
    const { data } = await api.get("/assignments/my");
    setAssignments((data.assignments || []).filter((a) => String(a.course?._id || a.course) === String(id)));
  };

  const askQuestion = async (e) => {
    e.preventDefault();
    await api.post(`/qa/course/${id}`, { question: newQ });
    setNewQ("");
    const { data } = await api.get(`/qa/course/${id}`);
    setQuestions(data.questions || []);
    setToast("Question posted");
  };

  const replyToQuestion = async (qId) => {
    await api.post(`/qa/${qId}/reply`, { message: replyText[qId] });
    setReplyText({ ...replyText, [qId]: "" });
    const { data } = await api.get(`/qa/course/${id}`);
    setQuestions(data.questions || []);
  };

  if (!course) return <DashboardLayout title="Learning"><p>Loading...</p></DashboardLayout>;

  return (
    <DashboardLayout title={`Learning: ${course.title}`}>
      <Toast message={toast} onClose={() => setToast("")} />
      <div className="learn-tabs">
        {["lessons", "assignments", "quizzes", "qa"].map((t) => (
          <button key={t} type="button" className={tab === t ? "active" : ""} onClick={() => setTab(t)}>
            {t === "lessons" ? "Lessons" : t === "qa" ? "Q&A" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
        <Link to="/student/assignments" className="learn-tabs__link">All assignments →</Link>
      </div>

      {tab === "lessons" && (
        <div className="learn-layout">
          <div className="learn-player">
            <div className="learn-player__screen">
              {activeLesson?.type === "video" && (
                <div className="video-placeholder">
                  <p>▶ {activeLesson.title}</p>
                  <span>Video lecture player — connect CDN/YouTube/Vimeo URL in production</span>
                </div>
              )}
              {activeLesson?.type === "pdf" && (
                <div className="video-placeholder"><p>📄 {activeLesson.title}</p><span>PDF viewer</span></div>
              )}
              {activeLesson?.type === "quiz" && (
                <div className="video-placeholder"><p>📝 {activeLesson.title}</p><span>Open the Quizzes tab to take course quizzes</span></div>
              )}
              {!activeLesson && <p>Select a lesson to begin</p>}
            </div>
            {activeLesson && (
              <button type="button" className="btn btn--primary" onClick={() => markComplete(activeLesson)}>
                Mark lesson complete
              </button>
            )}
            <div className="progress-bar progress-bar--lg"><div style={{ width: `${progress}%` }} /></div>
            <span>{progress}% course complete</span>
          </div>
          <aside className="learn-sidebar">
            <h3>Curriculum</h3>
            {course.modules?.map((mod) => (
              <div key={mod._id || mod.title}>
                <h4>{mod.title}</h4>
                <ul>
                  {mod.lessons?.map((lesson) => (
                    <li key={lesson._id || lesson.title}>
                      <button
                        type="button"
                        className={activeLesson === lesson ? "active" : ""}
                        onClick={() => setActiveLesson(lesson)}
                      >
                        {lesson.title}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </aside>
        </div>
      )}

      {tab === "assignments" && (
        <div className="feature-grid">
          {assignments.length === 0 ? <p className="dash-empty">No assignments for this course.</p> : assignments.map((a) => {
            const mine = a.submissions?.find((s) => String(s.student) === String(user?.id));
            return (
              <article key={a._id} className="feature-card">
                <h3>{a.title}</h3>
                <p>{a.description}</p>
                <p className="feature-card__meta">Due: {new Date(a.deadline).toLocaleString()}</p>
                {mine?.score != null && <p className="success-msg">Graded: {mine.score}/{a.maxScore}</p>}
                <button type="button" className="btn btn--primary btn--sm" onClick={() => { setActiveAssignment(a); setSubmitContent(mine?.content || ""); }}>Submit</button>
              </article>
            );
          })}
        </div>
      )}

      {tab === "quizzes" && (
        <div className="feature-grid">
          {quizzes.length === 0 ? <p className="dash-empty">No quizzes for this course.</p> : quizzes.map((q) => (
            <article key={q._id} className="feature-card">
              <h3>{q.title}</h3>
              <p className="feature-card__meta">Passing: {q.passingScore}%</p>
              {q.mySubmission && <p>Best score: {q.mySubmission.score}%</p>}
              <button type="button" className="btn btn--primary btn--sm" onClick={() => openQuiz(q._id)}>Take quiz</button>
            </article>
          ))}
        </div>
      )}

      {tab === "qa" && (
        <div className="learn-qa">
          <form className="feature-form" onSubmit={askQuestion}>
            <textarea rows={3} placeholder="Ask a question about this course..." value={newQ} onChange={(e) => setNewQ(e.target.value)} required />
            <button type="submit" className="btn btn--primary btn--sm">Post question</button>
          </form>
          <div className="qa-list">
            {questions.map((q) => (
              <article key={q._id} className="qa-thread">
                <h4>{q.studentName}: {q.question}</h4>
                {(q.replies || []).map((r, i) => (
                  <div key={i} className="qa-reply"><strong>{r.userName}</strong><p>{r.message}</p></div>
                ))}
                <div className="qa-reply-form">
                  <input value={replyText[q._id] || ""} onChange={(e) => setReplyText({ ...replyText, [q._id]: e.target.value })} placeholder="Reply..." />
                  <button type="button" className="btn btn--outline btn--sm" onClick={() => replyToQuestion(q._id)}>Reply</button>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {activeAssignment && (
        <div className="modal-overlay" onClick={() => setActiveAssignment(null)}>
          <form className="modal-card" onClick={(e) => e.stopPropagation()} onSubmit={submitAssignment}>
            <h3>{activeAssignment.title}</h3>
            <textarea rows={5} value={submitContent} onChange={(e) => setSubmitContent(e.target.value)} required />
            <button type="submit" className="btn btn--primary">Submit</button>
          </form>
        </div>
      )}

      {activeQuiz && (
        <div className="modal-overlay" onClick={() => setActiveQuiz(null)}>
          <form className="modal-card modal-card--wide" onClick={(e) => e.stopPropagation()} onSubmit={submitQuiz}>
            <h3>{activeQuiz.title}</h3>
            {activeQuiz.questions.map((q, qi) => (
              <fieldset key={qi} className="quiz-question">
                <legend>{qi + 1}. {q.question}</legend>
                {q.options.map((opt, oi) => (
                  <label key={oi}>
                    <input type="radio" name={`q-${qi}`} checked={Number(quizAnswers[qi]) === oi} onChange={() => {
                      const next = [...quizAnswers];
                      next[qi] = oi;
                      setQuizAnswers(next);
                    }} />
                    {opt}
                  </label>
                ))}
              </fieldset>
            ))}
            {quizResult && <p className="success-msg">Score: {quizResult.score}% — {quizResult.passed ? "Passed" : "Not passed"}</p>}
            <button type="submit" className="btn btn--primary">Submit answers</button>
          </form>
        </div>
      )}
    </DashboardLayout>
  );
};

export default LearnPage;
