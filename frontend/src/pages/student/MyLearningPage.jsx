import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import Toast from "../../components/Toast";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { courseImageUrl } from "../../utils/mediaUrl";

const MyLearningPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "progress";
  const [enrollments, setEnrollments] = useState([]);
  const [profile, setProfile] = useState(null);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [reminderForm, setReminderForm] = useState({ time: "09:00", message: "Time to start learning!" });
  const [reminderErr, setReminderErr] = useState("");
  const [toast, setToast] = useState("");
  const { user, updateUser } = useAuth();

  const loadProfile = useCallback(() => {
    api.get("/profile").then(({ data }) => {
      setProfile(data.user);
      updateUser({
        learningStreak: data.user.learningStreak,
        attendanceDates: data.user.attendanceDates,
      });
    });
  }, [updateUser]);

  useEffect(() => {
    api.get("/enrollments/my").then(({ data }) => setEnrollments(data.enrollments || []));
    loadProfile();
    const interval = setInterval(loadProfile, 15000);
    const onFocus = () => loadProfile();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [loadProfile]);

  const inProgress = enrollments.filter((e) => e.status === "active" || e.status === "enrolled");
  const completed = enrollments.filter((e) => e.status === "completed");

  const attendance = profile?.attendanceDates || user?.attendanceDates || [];
  const streak = profile?.learningStreak ?? user?.learningStreak ?? 0;

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = now.toLocaleString("default", { month: "long", year: "numeric" });

  const setTab = (t) => setSearchParams({ tab: t });
  const list = tab === "completed" ? completed : tab === "certificates" ? completed : inProgress;

  const openReminder = (day) => {
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setSelectedDate(key);
    setReminderOpen(true);
    setReminderErr("");
  };

  const saveReminder = async (e) => {
    e.preventDefault();
    setReminderErr("");
    try {
      await api.post("/reminders", {
        date: selectedDate,
        time: reminderForm.time,
        message: reminderForm.message,
      });
      setReminderOpen(false);
      setToast("Reminder set! You will get an email and notification at the scheduled time.");
    } catch (error) {
      setReminderErr(error.response?.data?.message || "Could not set reminder");
    }
  };

  return (
    <DashboardLayout title="My Learnings" subtitle="Track progress, streaks, and certificates" contentClassName="my-learning-page-bg">
      <Toast message={toast} onClose={() => setToast("")} />
      <div className="my-learning-grid my-learning-grid--calendar-right">
        <div className="learning-main">
          <div className="learning-tabs">
            <button type="button" className={tab === "progress" ? "active" : ""} onClick={() => setTab("progress")}>In Progress</button>
            <button type="button" className={tab === "completed" ? "active" : ""} onClick={() => setTab("completed")}>Completed</button>
            <button type="button" className={tab === "certificates" ? "active" : ""} onClick={() => setTab("certificates")}>Certificates</button>
          </div>

          {list.length === 0 ? (
            <p className="dash-empty">
              Nothing here yet. <Link to="/courses">Browse courses</Link>
            </p>
          ) : (
            <div className="learning-course-list">
              {list.map((e) => (
                <article key={e.id} className="learning-course-item">
                  <img src={courseImageUrl(e.course?.image)} alt="" />
                  <div>
                    <h3>{e.course?.title}</h3>
                    <p>{e.course?.instructorName} · {e.progress}% complete</p>
                    <div className="progress-bar"><div style={{ width: `${e.progress}%` }} /></div>
                  </div>
                  {tab === "certificates" ? (
                    <span className="badge badge--published">Certificate earned</span>
                  ) : (
                    <Link to={`/student/learn/${e.course?.id}`} className="btn btn--primary btn--sm">Continue</Link>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>

        <aside className="learning-sidebar">
          <div className="streak-card">
            <span className="streak-card__flame" aria-hidden="true">🔥</span>
            <div className="streak-card__info">
              <strong>{streak} day streak</strong>
              <span>Keep learning daily!</span>
            </div>
          </div>
          <div className="calendar-card">
            <h3>{monthName}</h3>
            <p className="calendar-hint">Click a date to set a learning reminder</p>
            <div className="calendar-grid">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                <span key={d} className="calendar-grid__head">{d}</span>
              ))}
              {Array.from({ length: firstDay }).map((_, i) => (
                <span key={`e-${i}`} className="calendar-grid__empty" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const active = attendance.includes(key);
                const isToday = day === now.getDate();
                return (
                  <button
                    key={day}
                    type="button"
                    className={`calendar-grid__day${active ? " attended" : ""}${isToday ? " today" : ""}`}
                    onClick={() => openReminder(day)}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>
      </div>

      {reminderOpen && (
        <div className="modal-overlay" onClick={() => setReminderOpen(false)} role="presentation">
          <div className="modal-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="reminder-title">
            <h3 id="reminder-title">Set learning reminder</h3>
            <p>Date: <strong>{selectedDate}</strong></p>
            <form onSubmit={saveReminder}>
              <label>
                Time
                <input type="time" required value={reminderForm.time} onChange={(e) => setReminderForm({ ...reminderForm, time: e.target.value })} />
              </label>
              <label>
                Note
                <textarea
                  rows={3}
                  value={reminderForm.message}
                  onChange={(e) => setReminderForm({ ...reminderForm, message: e.target.value })}
                />
              </label>
              {reminderErr && <p className="error-msg">{reminderErr}</p>}
              <div className="settings-form__actions">
                <button type="submit" className="btn btn--primary">Save reminder</button>
                <button type="button" className="btn btn--outline" onClick={() => setReminderOpen(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default MyLearningPage;
