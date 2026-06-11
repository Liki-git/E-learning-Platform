import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/client";
import Toast from "../../components/Toast";

const InstructorAssignmentsPage = () => {
  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({ courseId: "", title: "", description: "", deadline: "", maxScore: 100 });
  const [gradeForm, setGradeForm] = useState(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    api.get("/assignments/my").then(({ data }) => setAssignments(data.assignments || []));
    api.get("/courses").then(({ data }) => setCourses(data.courses || []));
  }, []);

  const create = async (e) => {
    e.preventDefault();
    await api.post("/assignments", form);
    setToast("Assignment created and students notified");
    setForm({ courseId: "", title: "", description: "", deadline: "", maxScore: 100 });
    const { data } = await api.get("/assignments/my");
    setAssignments(data.assignments || []);
  };

  const grade = async (e) => {
    e.preventDefault();
    await api.patch(`/assignments/${gradeForm.assignmentId}/grade`, {
      studentId: gradeForm.studentId,
      score: Number(gradeForm.score),
      feedback: gradeForm.feedback,
    });
    setToast("Submission graded");
    setGradeForm(null);
    const { data } = await api.get("/assignments/my");
    setAssignments(data.assignments || []);
  };

  return (
    <DashboardLayout title="Assignments" subtitle="Create and grade student submissions">
      <Toast message={toast} onClose={() => setToast("")} />
      <form className="feature-form feature-form--wide" onSubmit={create}>
        <h3>Create assignment</h3>
        <select value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })} required>
          <option value="">Select course</option>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
        <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <input type="datetime-local" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} required />
        <input type="number" placeholder="Max score" value={form.maxScore} onChange={(e) => setForm({ ...form, maxScore: e.target.value })} />
        <button type="submit" className="btn btn--primary">Publish assignment</button>
      </form>

      <div className="feature-grid">
        {assignments.map((a) => (
          <article key={a._id} className="feature-card">
            <h3>{a.title}</h3>
            <p>{a.course?.title} · Due {new Date(a.deadline).toLocaleString()}</p>
            <p>{a.submissions?.length || 0} submission(s)</p>
            {(a.submissions || []).map((s, i) => (
              <div key={i} className="feature-submission">
                <p>{s.content || s.fileUrl || "No content"}</p>
                <button type="button" className="btn btn--outline btn--sm" onClick={() => setGradeForm({
                  assignmentId: a._id,
                  studentId: s.student,
                  score: s.score ?? "",
                  feedback: s.feedback ?? "",
                })}>Grade</button>
              </div>
            ))}
          </article>
        ))}
      </div>

      {gradeForm && (
        <div className="modal-overlay" onClick={() => setGradeForm(null)}>
          <form className="modal-card" onClick={(e) => e.stopPropagation()} onSubmit={grade}>
            <h3>Grade submission</h3>
            <input type="number" value={gradeForm.score} onChange={(e) => setGradeForm({ ...gradeForm, score: e.target.value })} required />
            <textarea value={gradeForm.feedback} onChange={(e) => setGradeForm({ ...gradeForm, feedback: e.target.value })} placeholder="Feedback" />
            <button type="submit" className="btn btn--primary">Save grade</button>
          </form>
        </div>
      )}
    </DashboardLayout>
  );
};

export default InstructorAssignmentsPage;
