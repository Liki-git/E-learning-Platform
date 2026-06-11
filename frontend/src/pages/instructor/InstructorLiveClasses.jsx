import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/client";
import { FiVideo, FiFilter, FiPlus, FiTrash2, FiExternalLink, FiClock, FiCalendar, FiAlertCircle, FiX } from "react-icons/fi";

const InstructorLiveClasses = () => {
  const [classes, setClasses] = useState([]);
  const [myCourses, setMyCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [tab, setTab] = useState("upcoming");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ courseId: "", title: "", description: "", meetingUrl: "", scheduledAt: "", duration: 60 });
  const [creating, setCreating] = useState(false);

  const fetchData = async () => {
    try {
      const [lcRes, cRes] = await Promise.all([api.get("/live-classes/my"), api.get("/courses?status=")]);
      setClasses(lcRes.data.classes || []);
      setMyCourses((cRes.data.courses || cRes.data || []));
    } catch (err) { setError(err.response?.data?.message || err.message || "Failed to load live classes."); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const now = new Date();
  const filtered = classes
    .filter(c => courseFilter === "all" || c.course?._id === courseFilter)
    .filter(c => {
      const end = new Date(new Date(c.scheduledAt).getTime() + (c.duration || 60) * 60000);
      return tab === "upcoming" ? end >= now : end < now;
    })
    .sort((a, b) => tab === "upcoming" ? new Date(a.scheduledAt) - new Date(b.scheduledAt) : new Date(b.scheduledAt) - new Date(a.scheduledAt));

  const upcomingCount = classes.filter(c => new Date(new Date(c.scheduledAt).getTime() + (c.duration || 60) * 60000) >= now).length;
  const isLiveNow = (c) => { const s = new Date(c.scheduledAt); const e = new Date(s.getTime() + (c.duration || 60) * 60000); return now >= s && now <= e; };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.courseId || !form.title || !form.meetingUrl || !form.scheduledAt) { setError("All fields required."); return; }
    setCreating(true);
    setError("");
    try {
      await api.post("/live-classes", form);
      setShowCreate(false);
      setForm({ courseId: "", title: "", description: "", meetingUrl: "", scheduledAt: "", duration: 60 });
      fetchData();
    } catch (err) { setError(err.response?.data?.message || "Failed."); }
    finally { setCreating(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Cancel this live class?")) return;
    try { await api.delete(`/live-classes/${id}`); fetchData(); }
    catch (err) { setError(err.response?.data?.message || err.message || "Failed to cancel live class."); }
  };

  return (
    <DashboardLayout title="Live Classes" subtitle="Schedule and manage live sessions for your students">
      <style>{`
        .ilc-stats { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; margin-bottom: 28px; }
        .ilc-stat { background: var(--bg-elevated); border: 1px solid var(--border-color); border-radius: 14px; padding: 20px; display: flex; flex-direction: column; gap: 6px; }
        .ilc-stat span { font-size: 13px; color: var(--text-muted); }
        .ilc-stat strong { font-size: 1.75rem; }
        .ilc-toolbar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 20px; }
        .ilc-tabs { display: flex; gap: 8px; margin-bottom: 20px; }
        .ilc-tab { padding: 10px 20px; border-radius: 10px; border: 1.5px solid var(--border-color); background: var(--bg-surface); color: var(--text-secondary); font-weight: 600; font-size: 14px; cursor: pointer; }
        .ilc-tab.active { background: #10b981; color: white; border-color: #10b981; }
        .ilc-filters { display: flex; gap: 12px; align-items: center; }
        .ilc-select { padding: 10px 14px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--bg-elevated); color: var(--text-primary); font-size: 14px; min-width: 160px; }
        .ilc-create-btn { background: #10b981; color: white; border: none; padding: 10px 20px; border-radius: 10px; font-weight: 600; font-size: 14px; cursor: pointer; display: flex; align-items: center; gap: 8px; }
        .ilc-create-btn:hover { background: #059669; }
        .ilc-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 20px; }
        .ilc-card { background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 16px; padding: 24px; position: relative; transition: box-shadow 0.2s, transform 0.2s; }
        .ilc-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.08); transform: translateY(-2px); }
        .ilc-card-live { border-color: #10b981; }
        .ilc-live-pulse { position: absolute; top: 16px; right: 16px; display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; color: #ef4444; }
        .ilc-live-dot { width: 8px; height: 8px; border-radius: 50%; background: #ef4444; animation: ilcPulse 1.5s infinite; }
        @keyframes ilcPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        .ilc-card h3 { font-size: 17px; font-weight: 700; margin: 0 0 8px; color: var(--text-primary); }
        .ilc-card-meta { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
        .ilc-card-meta span { font-size: 13px; color: var(--text-secondary); display: flex; align-items: center; gap: 8px; }
        .ilc-card-actions { display: flex; gap: 10px; }
        .ilc-join-btn { background: #10b981; color: white; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 600; font-size: 13px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; text-decoration: none; }
        .ilc-join-btn:hover { background: #059669; }
        .ilc-del-btn { background: transparent; border: 1px solid #ef4444; color: #ef4444; padding: 8px 16px; border-radius: 8px; font-size: 13px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
        .ilc-del-btn:hover { background: #fef2f2; }
        .ilc-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 9999; display: flex; align-items: center; justify-content: center; }
        .ilc-modal { background: var(--bg-surface); border-radius: 16px; padding: 32px; width: 90%; max-width: 520px; }
        .ilc-modal h2 { margin: 0 0 20px; font-size: 18px; display: flex; justify-content: space-between; }
        .ilc-field { width: 100%; padding: 10px 14px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--bg-body); color: var(--text-primary); font-size: 14px; margin-bottom: 14px; font-family: inherit; }
        .ilc-empty { text-align: center; padding: 60px 20px; color: var(--text-secondary); }
        .ilc-empty-icon { font-size: 48px; color: var(--text-muted); margin-bottom: 16px; }
        .ilc-error { background: #fef2f2; border: 1px solid #fee2e2; color: #991b1b; padding: 12px 16px; border-radius: 10px; margin-bottom: 16px; font-size: 13px; display: flex; align-items: center; gap: 8px; }
      `}</style>

      {error && <div className="ilc-error"><FiAlertCircle /> {error}</div>}

      {showCreate && (
        <div className="ilc-modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="ilc-modal" onClick={e => e.stopPropagation()}>
            <h2>Schedule Live Class <button onClick={() => setShowCreate(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "var(--text-secondary)" }}><FiX /></button></h2>
            <form onSubmit={handleCreate}>
              <select className="ilc-field" value={form.courseId} onChange={e => setForm({ ...form, courseId: e.target.value })}>
                <option value="">Select Course...</option>
                {myCourses.map(c => <option key={c.id || c._id} value={c.id || c._id}>{c.title}</option>)}
              </select>
              <input className="ilc-field" placeholder="Session Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              <input className="ilc-field" placeholder="Meeting URL (Zoom, Meet, etc.)" value={form.meetingUrl} onChange={e => setForm({ ...form, meetingUrl: e.target.value })} />
              <textarea className="ilc-field" style={{ height: 60, resize: "none" }} placeholder="Description (optional)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              <input className="ilc-field" type="datetime-local" value={form.scheduledAt} onChange={e => setForm({ ...form, scheduledAt: e.target.value })} />
              <input className="ilc-field" type="number" placeholder="Duration (minutes)" value={form.duration} onChange={e => setForm({ ...form, duration: Number(e.target.value) })} />
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button type="button" className="btn btn--outline" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn--primary" disabled={creating}>{creating ? "Scheduling..." : "Schedule Class"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="ilc-stats">
        <div className="ilc-stat"><span>Upcoming</span><strong style={{color:"#3b82f6"}}>{upcomingCount}</strong></div>
        <div className="ilc-stat"><span>Completed</span><strong style={{color:"#10b981"}}>{classes.length - upcomingCount}</strong></div>
        <div className="ilc-stat"><span>Total Sessions</span><strong style={{color:"var(--text-primary)"}}>{classes.length}</strong></div>
      </div>

      <div className="ilc-toolbar">
        <div className="ilc-filters">
          <div className="ilc-tabs">
            <button className={`ilc-tab ${tab === "upcoming" ? "active" : ""}`} onClick={() => setTab("upcoming")}>Upcoming</button>
            <button className={`ilc-tab ${tab === "past" ? "active" : ""}`} onClick={() => setTab("past")}>Past</button>
          </div>
          <FiFilter style={{ color: "var(--text-secondary)" }} />
          <select className="ilc-select" value={courseFilter} onChange={e => setCourseFilter(e.target.value)}>
            <option value="all">All Courses</option>
            {myCourses.map(c => <option key={c.id || c._id} value={c.id || c._id}>{c.title}</option>)}
          </select>
        </div>
        <button className="ilc-create-btn" onClick={() => setShowCreate(true)}><FiPlus /> Schedule Class</button>
      </div>

      {loading ? <p style={{ textAlign: "center", padding: 40 }}>Loading...</p>
      : filtered.length === 0 ? (
        <div className="ilc-empty"><div className="ilc-empty-icon"><FiVideo /></div><h3>No {tab} Classes</h3></div>
      ) : (
        <div className="ilc-grid">
          {filtered.map(c => {
            const live = isLiveNow(c);
            return (
              <div className={`ilc-card ${live ? "ilc-card-live" : ""}`} key={c._id}>
                {live && <div className="ilc-live-pulse"><span className="ilc-live-dot" /> LIVE</div>}
                <h3>{c.title}</h3>
                <div className="ilc-card-meta">
                  <span>📚 {c.course?.title}</span>
                  <span><FiCalendar /> {new Date(c.scheduledAt).toLocaleDateString()} at {new Date(c.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span><FiClock /> {c.duration} min</span>
                </div>
                {c.description && <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16 }}>{c.description}</p>}
                <div className="ilc-card-actions">
                  <a href={c.meetingUrl} target="_blank" rel="noopener noreferrer" className="ilc-join-btn"><FiExternalLink /> {live ? "Join Now" : "Open Link"}</a>
                  {tab === "upcoming" && <button className="ilc-del-btn" onClick={() => handleDelete(c._id)}><FiTrash2 /> Cancel</button>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
};

export default InstructorLiveClasses;
