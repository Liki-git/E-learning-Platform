import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/client";

const StudentLiveClassesPage = () => {
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    api.get("/live-classes/my").then(({ data }) => setClasses(data.classes || []));
  }, []);

  return (
    <DashboardLayout title="Live Classes" subtitle="Join scheduled webinars and live sessions">
      <div className="feature-grid">
        {classes.length === 0 ? <p className="dash-empty">No live classes scheduled.</p> : classes.map((c) => {
          const when = new Date(c.scheduledAt);
          const isLive = Math.abs(Date.now() - when.getTime()) < (c.duration || 60) * 60000;
          return (
            <article key={c._id} className="feature-card">
              <span className="feature-card__tag">{c.course?.title}</span>
              <h3>{c.title}</h3>
              <p>{c.description}</p>
              <p className="feature-card__meta">{when.toLocaleString()} · {c.duration} min · {c.instructor?.fullName || "Instructor"}</p>
              {isLive && <span className="badge badge--published">Live now</span>}
              <a href={c.meetingUrl} target="_blank" rel="noreferrer" className="btn btn--primary btn--sm">Join class</a>
            </article>
          );
        })}
      </div>
    </DashboardLayout>
  );
};

export default StudentLiveClassesPage;
