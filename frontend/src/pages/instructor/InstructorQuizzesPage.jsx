import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/client";
import Toast from "../../components/Toast";

const emptyQ = () => ({ question: "", options: ["", "", "", ""], correctIndex: 0 });

const InstructorQuizzesPage = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState("");
  const [title, setTitle] = useState("");
  const [passingScore, setPassingScore] = useState(70);
  const [questions, setQuestions] = useState([emptyQ()]);
  const [toast, setToast] = useState("");

  useEffect(() => {
    api.get("/quizzes/my").then(({ data }) => setQuizzes(data.quizzes || []));
    api.get("/courses").then(({ data }) => setCourses(data.courses || []));
  }, []);

  const create = async (e) => {
    e.preventDefault();
    await api.post("/quizzes", { courseId, title, passingScore, questions });
    setToast("Quiz published");
    setTitle("");
    setQuestions([emptyQ()]);
    const { data } = await api.get("/quizzes/my");
    setQuizzes(data.quizzes || []);
  };

  return (
    <DashboardLayout title="Quizzes" subtitle="Create and manage course quizzes">
      <Toast message={toast} onClose={() => setToast("")} />
      <form className="feature-form feature-form--wide" onSubmit={create}>
        <h3>Create quiz</h3>
        <select value={courseId} onChange={(e) => setCourseId(e.target.value)} required>
          <option value="">Select course</option>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
        <input placeholder="Quiz title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <input type="number" value={passingScore} onChange={(e) => setPassingScore(e.target.value)} placeholder="Passing %" />
        {questions.map((q, qi) => (
          <div key={qi} className="quiz-builder">
            <input placeholder={`Question ${qi + 1}`} value={q.question} onChange={(e) => {
              const next = [...questions];
              next[qi].question = e.target.value;
              setQuestions(next);
            }} required />
            {q.options.map((opt, oi) => (
              <div key={oi} className="quiz-builder__opt">
                <input value={opt} onChange={(e) => {
                  const next = [...questions];
                  next[qi].options[oi] = e.target.value;
                  setQuestions(next);
                }} required />
                <label><input type="radio" name={`correct-${qi}`} checked={q.correctIndex === oi} onChange={() => {
                  const next = [...questions];
                  next[qi].correctIndex = oi;
                  setQuestions(next);
                }} /> Correct</label>
              </div>
            ))}
          </div>
        ))}
        <button type="button" className="btn btn--outline btn--sm" onClick={() => setQuestions([...questions, emptyQ()])}>Add question</button>
        <button type="submit" className="btn btn--primary">Publish quiz</button>
      </form>

      <div className="feature-grid">
        {quizzes.map((q) => (
          <article key={q._id} className="feature-card">
            <h3>{q.title}</h3>
            <p>{q.course?.title} · {q.questions?.length} questions · Pass {q.passingScore}%</p>
            <p>{q.submissions?.length || 0} submission(s)</p>
          </article>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default InstructorQuizzesPage;
