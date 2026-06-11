import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/client";

const MyCourses = () => {
  const [enrollments, setEnrollments] = useState([]);

  useEffect(() => {
    api.get("/enrollments/my").then(({ data }) => setEnrollments(data.enrollments.filter((e) => e.status !== "wishlist")));
  }, []);

  return (
    <DashboardLayout title="My Courses">
      {enrollments.length === 0 ? (
        <p className="dash-empty">No enrollments yet. <Link to="/courses">Browse courses</Link></p>
      ) : (
        <div className="catalog-grid">
          {enrollments.map((e) => (
            <article key={e.id} className="catalog-card">
              <img src={e.course?.image} alt={e.course?.title} />
              <div className="catalog-card__body">
                <h3>{e.course?.title}</h3>
                <div className="progress-bar"><div style={{ width: `${e.progress}%` }} /></div>
                <span>{e.progress}% · {e.paymentStatus}</span>
                {e.paymentStatus === "paid" || e.paymentStatus === "free" ? (
                  <Link to={`/student/learn/${e.course?.id}`} className="btn btn--primary btn--full">Continue</Link>
                ) : (
                  <Link to={`/student/pay/${e.course?.id}`} className="btn btn--outline btn--full">Pay to unlock</Link>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default MyCourses;
