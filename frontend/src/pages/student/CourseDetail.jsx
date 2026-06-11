import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [newQ, setNewQ] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/courses/${id}`).then(({ data }) => {
      setCourse(data.course);
      setEnrollment(data.enrollment);
      setLoading(false);
    }).catch(() => setLoading(false));
    api.get(`/reviews/course/${id}`).then(({ data }) => setReviews(data.reviews || [])).catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!enrollment || enrollment.status === "wishlist") return;
    api.get(`/qa/course/${id}`).then(({ data }) => setQuestions(data.questions || [])).catch(() => {});
  }, [id, enrollment]);

  const handleEnroll = async () => {
    try {
      const { data } = await api.post(`/enrollments/${id}/enroll`);
      setEnrollment(data.enrollment);
      setMsg("Enrolled successfully!");
      if (course.price === 0) navigate(`/student/learn/${id}`);
      else navigate(`/student/pay/${id}`);
    } catch (err) {
      setMsg(err.response?.data?.message || "Enrollment failed");
    }
  };

  const handleWishlist = async () => {
    try {
      await api.post(`/enrollments/${id}/wishlist`);
      setMsg("Added to wishlist");
    } catch (err) {
      setMsg(err.response?.data?.message || "Failed");
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post("/reviews", { courseId: id, ...reviewForm });
      setMsg("Review submitted!");
      setReviews((prev) => {
        const without = prev.filter((r) => String(r.student) !== String(user?.id));
        return [data.review, ...without];
      });
      if (data.course) {
        setCourse((c) => ({ ...c, rating: data.course.rating, reviewCount: data.course.reviewCount }));
      } else {
        const courseRes = await api.get(`/courses/${id}`);
        setCourse(courseRes.data.course);
      }
      const reviewsRes = await api.get(`/reviews/course/${id}`);
      setReviews(reviewsRes.data.reviews || []);
      setReviewForm({ rating: 5, comment: "" });
    } catch (err) {
      setMsg(err.response?.data?.message || "Could not submit review");
    }
  };

  const askQuestion = async (e) => {
    e.preventDefault();
    await api.post(`/qa/course/${id}`, { question: newQ });
    setNewQ("");
    const { data } = await api.get(`/qa/course/${id}`);
    setQuestions(data.questions || []);
    setMsg("Question posted");
  };

  if (loading) return <DashboardLayout title="Course"><p className="course-detail-center">Loading...</p></DashboardLayout>;
  if (!course) return <DashboardLayout title="Course"><p className="course-detail-center">Course not found</p></DashboardLayout>;

  const isPaid = enrollment?.paymentStatus === "paid" || enrollment?.paymentStatus === "free";
  const isEnrolled = enrollment && enrollment.status !== "wishlist";
  const avatar = course.instructorAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(course.instructorName)}&background=2e7d32&color=fff&size=128`;

  return (
    <DashboardLayout title={course.title}>
      <div className="course-detail course-detail--centered">
        <div className="course-detail__card">
          <img src={course.image} alt={course.title} className="course-detail__image" />
          <span className="catalog-card__cat">{course.category} · {course.level}</span>
          <h2>{course.title}</h2>
          <p className="course-detail__desc">{course.description}</p>
          <div className="course-detail__instructor">
            <img src={avatar} alt={course.instructorName} />
            <div>
              <strong>{course.instructorName}</strong>
              <span>Instructor · ★ {course.rating} ({course.reviewCount} reviews)</span>
            </div>
          </div>
          <p className="course-detail__price">{course.price === 0 ? "Free" : `₹${course.price}`}</p>
          {msg && <p className="success-msg">{msg}</p>}
          <div className="course-detail__actions">
            {!isEnrolled && (
              <>
                <button type="button" className="btn btn--primary" onClick={handleEnroll}>Enroll now</button>
                <button type="button" className="btn btn--outline" onClick={handleWishlist}>Wishlist</button>
              </>
            )}
            {isEnrolled && !isPaid && (
              <Link to={`/student/pay/${id}`} className="btn btn--primary">Pay fees to start</Link>
            )}
            {isEnrolled && isPaid && (
              <Link to={`/student/learn/${id}`} className="btn btn--primary">Start learning</Link>
            )}
          </div>
        </div>

        <section className="course-detail__curriculum">
          <h3>Course curriculum ({course.lessons} lessons)</h3>
          {course.modules?.map((mod) => (
            <div key={mod._id || mod.title} className="module-block">
              <h4>{mod.title}</h4>
              <ul>
                {mod.lessons?.map((lesson) => (
                  <li key={lesson._id || lesson.title}>
                    {lesson.title} <span>({lesson.type})</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section className="course-detail__section">
          <h3>Student reviews</h3>
          <p className="course-detail__rating-summary">
            ★ {course.rating || 0} average · {course.reviewCount ?? reviews.length} review{(course.reviewCount ?? reviews.length) !== 1 ? "s" : ""}
          </p>
          {isEnrolled && isPaid && user?.role === "student" && (
            <form className="feature-form feature-form--inline" onSubmit={submitReview}>
              <select value={reviewForm.rating} onChange={(e) => setReviewForm({ ...reviewForm, rating: e.target.value })}>
                {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} stars</option>)}
              </select>
              <textarea rows={2} placeholder="Write your review..." value={reviewForm.comment} onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })} />
              <button type="submit" className="btn btn--primary btn--sm">Submit</button>
            </form>
          )}
          <div className="qa-list">
            {reviews.length === 0 ? <p className="dash-empty">No reviews yet.</p> : reviews.map((r) => (
              <article key={r._id} className="qa-thread">
                <h4>{r.studentName} — {"★".repeat(r.rating)}</h4>
                <p>{r.comment}</p>
                <time>{new Date(r.createdAt).toLocaleDateString()}</time>
              </article>
            ))}
          </div>
        </section>

        {isEnrolled && (
          <section className="course-detail__section">
            <h3>Q&A</h3>
            {isPaid && (
              <form className="feature-form" onSubmit={askQuestion}>
                <textarea rows={2} placeholder="Ask the instructor..." value={newQ} onChange={(e) => setNewQ(e.target.value)} required />
                <button type="submit" className="btn btn--primary btn--sm">Ask</button>
              </form>
            )}
            <div className="qa-list">
              {questions.length === 0 ? <p className="dash-empty">No questions yet.</p> : questions.map((q) => (
                <article key={q._id} className="qa-thread">
                  <h4>{q.studentName}: {q.question}</h4>
                  {(q.replies || []).map((r, i) => (
                    <div key={i} className="qa-reply"><strong>{r.userName}</strong><p>{r.message}</p></div>
                  ))}
                </article>
              ))}
            </div>
            {isPaid && <Link to="/student/qa" className="learn-tabs__link">Open full Q&A →</Link>}
          </section>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CourseDetail;
