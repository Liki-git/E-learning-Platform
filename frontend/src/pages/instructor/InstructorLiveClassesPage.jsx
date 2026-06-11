import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/client";
import Toast from "../../components/Toast";

const InstructorLiveClassesPage = () => {
  const [classes, setClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({ courseId: "", title: "", description: "", meetingUrl: "", scheduledAt: "", duration: 60 });
  const [toast, setToast] = useState("");

  const load = () => api.get("/live-classes/my").then(({ data }) => setClasses(data.classes || []));
  useEffect(() => {
    load();
    api.get("/courses").then(({ data }) => setCourses(data.courses || []));
  }, []);

  const create = async (e) => {
    e.preventDefault();
    await api.post("/live-classes", form);
    setToast("Live class scheduled");
    setForm({ courseId: "", title: "", description: "", meetingUrl: "", scheduledAt: "", duration: 60 });
    load();
  };

  const cancel = async (id) => {
    await api.delete(`/live-classes/${id}`);
    load();
  };

  return (
    <DashboardLayout title="Live Classes" subtitle="Schedule and manage live sessions">
      <Toast message={toast} onClose={() => setToast("")} />
      <form className="feature-form feature-form--wide" onSubmit={create}>
        <h3>Schedule live class</h3>
        <select value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })} required>
          <option value="">Select course</option>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
        <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <input placeholder="Meeting URL (Zoom/Meet)" value={form.meetingUrl} onChange={(e) => setForm({ ...form, meetingUrl: e.target.value })} required />
        <input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} required />
        <input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="Duration (min)" />
        <button type="submit" className="btn btn--primary">Schedule</button>
      </form>
      <div className="feature-grid">
        {classes.map((c) => (
          <article key={c._id} className="feature-card">
            <h3>{c.title}</h3>
            <p>{c.course?.title}</p>
            <p className="feature-card__meta">{new Date(c.scheduledAt).toLocaleString()}</p>
            <a href={c.meetingUrl} target="_blank" rel="noreferrer" className="btn btn--outline btn--sm">Open link</a>
            <button type="button" className="btn btn--outline btn--sm" onClick={() => cancel(c._id)}>Cancel</button>
          </article>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default InstructorLiveClassesPage;
