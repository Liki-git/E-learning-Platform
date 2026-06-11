import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/client";
import Toast from "../../components/Toast";

const StudentQuizzesPage = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [active, setActive] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);
  const [toast, setToast] = useState("");

  const load = () => api.get("/quizzes/my").then(({ data }) => setQuizzes(data.quizzes || []));
  useEffect(() => { load(); }, []);

  const openQuiz = async (id) => {
    const { data } = await api.get(`/quizzes/${id}`);
    setActive(data.quiz);
    setAnswers(Array(data.quiz.questions.length).fill(""));
    setResult(null);
  };

  const submit = async (e) => {
    e.preventDefault();
    const { data } = await api.post(`/quizzes/${active._id}/submit`, { answers: answers.map(Number) });
    setResult(data);
    setToast(data.passed ? "Quiz passed!" : "Quiz submitted");
    load();
  };

  return (
    <DashboardLayout title="Quizzes" subtitle="Take quizzes and track your scores">
      <Toast message={toast} onClose={() => setToast("")} />
      <div className="feature-grid">
        {quizzes.map((q) => (
          <article key={q._id} className="feature-card">
            <h3>{q.title}</h3>
            <p>{q.course?.title}</p>
            <p className="feature-card__meta">Passing score: {q.passingScore}%</p>
            {q.mySubmission && <p>Your best: {q.mySubmission.score}% {q.mySubmission.passed ? "✓ Passed" : ""}</p>}
            <button type="button" className="btn btn--primary btn--sm" onClick={() => openQuiz(q._id)}>Take quiz</button>
          </article>
        ))}
      </div>
      {active && (
        <div className="modal-overlay" onClick={() => setActive(null)}>
          <form className="modal-card modal-card--wide" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
            <h3>{active.title}</h3>
            {active.questions.map((q, qi) => (
              <fieldset key={qi} className="quiz-question">
                <legend>{qi + 1}. {q.question}</legend>
                {q.options.map((opt, oi) => (
                  <label key={oi}>
                    <input type="radio" name={`q-${qi}`} checked={Number(answers[qi]) === oi} onChange={() => {
                      const next = [...answers];
                      next[qi] = oi;
                      setAnswers(next);
                    }} required={answers[qi] === ""} />
                    {opt}
                  </label>
                ))}
              </fieldset>
            ))}
            {result && <p className="success-msg">Score: {result.score}% ({result.correctCount}/{result.totalQuestions} correct) — {result.passed ? "Passed" : "Not passed"}</p>}
            <button type="submit" className="btn btn--primary">Submit answers</button>
          </form>
        </div>
      )}
    </DashboardLayout>
  );
};

export default StudentQuizzesPage;
