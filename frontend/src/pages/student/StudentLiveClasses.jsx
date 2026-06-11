import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/client";
import { FiVideo, FiFilter, FiExternalLink, FiClock, FiCalendar, FiAlertCircle } from "react-icons/fi";

const StudentLiveClasses = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [tab, setTab] = useState("upcoming");

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get("/live-classes/my");
        setClasses(data.classes || []);
      } catch (err) { setError(err.response?.data?.message || err.message || "Failed to load live classes."); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const courses = [...new Map(classes.map(c => [c.course?._id, c.course?.title])).entries()].filter(([id]) => id);
  const now = new Date();

  const filtered = classes
    .filter(c => courseFilter === "all" || c.course?._id === courseFilter)
    .filter(c => {
      const classEnd = new Date(new Date(c.scheduledAt).getTime() + (c.duration || 60) * 60000);
      return tab === "upcoming" ? classEnd >= now : classEnd < now;
    })
    .sort((a, b) => tab === "upcoming"
      ? new Date(a.scheduledAt) - new Date(b.scheduledAt)
      : new Date(b.scheduledAt) - new Date(a.scheduledAt)
    );

  const upcomingCount = classes.filter(c => new Date(new Date(c.scheduledAt).getTime() + (c.duration || 60) * 60000) >= now).length;
  const pastCount = classes.length - upcomingCount;
  const isLiveNow = (c) => {
    const start = new Date(c.scheduledAt);
    const end = new Date(start.getTime() + (c.duration || 60) * 60000);
    return now >= start && now <= end;
  };

  return (
    <DashboardLayout title="Live Classes" subtitle="Join scheduled sessions and view past classes">
      <style>{`
        .slc-stats { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; margin-bottom: 28px; }
        .slc-stat { background: var(--bg-elevated); border: 1px solid var(--border-color); border-radius: 14px; padding: 20px; display: flex; flex-direction: column; gap: 6px; }
        .slc-stat span { font-size: 13px; color: var(--text-muted); }
        .slc-stat strong { font-size: 1.75rem; }
        .slc-tabs { display: flex; gap: 8px; margin-bottom: 20px; }
        .slc-tab { padding: 10px 20px; border-radius: 10px; border: 1.5px solid var(--border-color); background: var(--bg-surface); color: var(--text-secondary); font-weight: 600; font-size: 14px; cursor: pointer; transition: all 0.2s; }
        .slc-tab.active { background: #10b981; color: white; border-color: #10b981; }
        .slc-filters { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 24px; align-items: center; }
        .slc-select { padding: 10px 14px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--bg-elevated); color: var(--text-primary); font-size: 14px; min-width: 160px; }
        .slc-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 20px; }
        .slc-card { background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 16px; padding: 24px; transition: box-shadow 0.2s, transform 0.2s; position: relative; overflow: hidden; }
        .slc-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.08); transform: translateY(-2px); }
        .slc-card-live { border-color: #10b981; }
        .slc-live-pulse { position: absolute; top: 16px; right: 16px; display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; color: #ef4444; }
        .slc-live-dot { width: 8px; height: 8px; border-radius: 50%; background: #ef4444; animation: slcPulse 1.5s infinite; }
        @keyframes slcPulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.3); } }
        .slc-card h3 { font-size: 17px; font-weight: 700; color: var(--text-primary); margin: 0 0 8px; }
        .slc-card-meta { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
        .slc-card-meta span { font-size: 13px; color: var(--text-secondary); display: flex; align-items: center; gap: 8px; }
        .slc-card-desc { font-size: 14px; color: var(--text-secondary); line-height: 1.5; margin-bottom: 16px; }
        .slc-join-btn { background: #10b981; color: white; border: none; padding: 10px 20px; border-radius: 10px; font-weight: 600; font-size: 14px; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; text-decoration: none; transition: background 0.2s; }
        .slc-join-btn:hover { background: #059669; }
        .slc-join-btn.past { background: var(--bg-body); color: var(--text-secondary); border: 1px solid var(--border-color); }
        .slc-empty { text-align: center; padding: 60px 20px; color: var(--text-secondary); }
        .slc-empty-icon { font-size: 48px; color: var(--text-muted); margin-bottom: 16px; }
        .slc-error { background: #fef2f2; border: 1px solid #fee2e2; color: #991b1b; padding: 12px 16px; border-radius: 10px; margin-bottom: 16px; font-size: 13px; display: flex; align-items: center; gap: 8px; }
      `}</style>

      {error && <div className="slc-error"><FiAlertCircle /> {error}</div>}

      <div className="slc-stats">
        <div className="slc-stat"><span>Upcoming</span><strong style={{color:"#3b82f6"}}>{upcomingCount}</strong></div>
        <div className="slc-stat"><span>Completed</span><strong style={{color:"#10b981"}}>{pastCount}</strong></div>
        <div className="slc-stat"><span>Total</span><strong style={{color:"var(--text-primary)"}}>{classes.length}</strong></div>
      </div>

      <div className="slc-tabs">
        <button className={`slc-tab ${tab === "upcoming" ? "active" : ""}`} onClick={() => setTab("upcoming")}>Upcoming ({upcomingCount})</button>
        <button className={`slc-tab ${tab === "past" ? "active" : ""}`} onClick={() => setTab("past")}>Past ({pastCount})</button>
      </div>

      <div className="slc-filters">
        <FiFilter style={{ color: "var(--text-secondary)" }} />
        <select className="slc-select" value={courseFilter} onChange={e => setCourseFilter(e.target.value)}>
          <option value="all">All Courses</option>
          {courses.map(([id, title]) => <option key={id} value={id}>{title}</option>)}
        </select>
      </div>

      {loading ? (
        <p style={{ textAlign: "center", padding: "40px" }}>Loading live classes...</p>
      ) : filtered.length === 0 ? (
        <div className="slc-empty">
          <div className="slc-empty-icon"><FiVideo /></div>
          <h3>No {tab === "upcoming" ? "Upcoming" : "Past"} Classes</h3>
          <p>{tab === "upcoming" ? "When your instructors schedule live sessions, they'll appear here." : "No completed sessions yet."}</p>
        </div>
      ) : (
        <div className="slc-grid">
          {filtered.map(c => {
            const live = isLiveNow(c);
            return (
              <div className={`slc-card ${live ? "slc-card-live" : ""}`} key={c._id}>
                {live && <div className="slc-live-pulse"><span className="slc-live-dot" /> LIVE NOW</div>}
                <h3>{c.title}</h3>
                <div className="slc-card-meta">
                  <span>📚 {c.course?.title || "Course"}</span>
                  <span><FiCalendar /> {new Date(c.scheduledAt).toLocaleDateString()} at {new Date(c.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span><FiClock /> {c.duration || 60} minutes</span>
                  {c.instructor?.fullName && <span>👨‍🏫 {c.instructor.fullName}</span>}
                </div>
                {c.description && <div className="slc-card-desc">{c.description}</div>}
                {tab === "upcoming" ? (
                  <a href={c.meetingUrl} target="_blank" rel="noopener noreferrer" className="slc-join-btn">
                    <FiExternalLink /> {live ? "Join Now" : "Join When Live"}
                  </a>
                ) : (
                  <span className="slc-join-btn past"><FiClock /> Session Ended</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
};

export default StudentLiveClasses;
