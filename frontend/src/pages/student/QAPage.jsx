import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/client";
import Toast from "../../components/Toast";

const StudentQAPage = () => {
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState("");
  const [questions, setQuestions] = useState([]);
  const [newQ, setNewQ] = useState("");
  const [replyText, setReplyText] = useState({});
  const [toast, setToast] = useState("");

  useEffect(() => {
    api.get("/enrollments/my").then(({ data }) => {
      const list = (data.enrollments || []).filter((e) => e.status !== "wishlist").map((e) => e.course).filter(Boolean);
      setCourses(list);
      if (list[0]) setCourseId(list[0].id);
    });
  }, []);

  useEffect(() => {
    if (!courseId) return;
    api.get(`/qa/course/${courseId}`).then(({ data }) => setQuestions(data.questions || []));
  }, [courseId]);

  const ask = async (e) => {
    e.preventDefault();
    await api.post(`/qa/course/${courseId}`, { question: newQ });
    setNewQ("");
    setToast("Question posted");
    const { data } = await api.get(`/qa/course/${courseId}`);
    setQuestions(data.questions || []);
  };

  const reply = async (id) => {
    await api.post(`/qa/${id}/reply`, { message: replyText[id] });
    setReplyText({ ...replyText, [id]: "" });
    const { data } = await api.get(`/qa/course/${courseId}`);
    setQuestions(data.questions || []);
  };

  return (
    <DashboardLayout title="Q&A" subtitle="Ask questions and join discussions">
      <Toast message={toast} onClose={() => setToast("")} />
      <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className="feature-select">
        {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
      </select>
      <form className="feature-form" onSubmit={ask}>
        <textarea rows={3} placeholder="Ask a question..." value={newQ} onChange={(e) => setNewQ(e.target.value)} required />
        <button type="submit" className="btn btn--primary btn--sm">Post question</button>
      </form>
      <div className="qa-list">
        {questions.map((q) => (
          <article key={q._id} className="qa-thread">
            <h4>{q.studentName}: {q.question}</h4>
            <time>{new Date(q.createdAt).toLocaleString()}</time>
            {(q.replies || []).map((r, i) => (
              <div key={i} className="qa-reply"><strong>{r.userName} ({r.userRole})</strong><p>{r.message}</p></div>
            ))}
            <div className="qa-reply-form">
              <input value={replyText[q._id] || ""} onChange={(e) => setReplyText({ ...replyText, [q._id]: e.target.value })} placeholder="Add a reply..." />
              <button type="button" className="btn btn--outline btn--sm" onClick={() => reply(q._id)}>Reply</button>
            </div>
          </article>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default StudentQAPage;
