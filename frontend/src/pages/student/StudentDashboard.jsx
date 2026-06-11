import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiBook, FiClock, FiAward, FiZap, FiCalendar } from "react-icons/fi";
import DashboardLayout from "../../components/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/client";

const StudentDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState("This Month");
  const [yearFilter, setYearFilter] = useState("This Year");

  const load = () => {
    api.get("/dashboard/student").then(({ data: res }) => {
      setData(res);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <DashboardLayout title="Student Dashboard" subtitle="Loading your progress...">
        <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text-secondary)" }}>
          <div className="spinner" style={{ border: "4px solid #f3f4f6", borderTop: "4px solid #10b981", borderRadius: "50%", width: "40px", height: "40px", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
          <p>Loading your dashboard...</p>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      </DashboardLayout>
    );
  }

  const { stats, recentCourses, progressChart, quizPerformance, upcomingDeadlines, recentCertificates } = data || {};

  // Custom SVG Line Chart coordinates calculation for Learning Progress
  const svgWidth = 500;
  const svgHeight = 160;
  const paddingX = 40;
  const paddingY = 20;

  const points = progressChart && progressChart.length > 0 ? progressChart : [
    { month: "Jan", hours: 9 },
    { month: "Feb", hours: 18 },
    { month: "Mar", hours: 22 },
    { month: "Apr", hours: 30 },
    { month: "May", hours: 27 },
    { month: "Jun", hours: 36 },
  ];

  const maxVal = Math.max(...points.map(p => p.hours), 36);
  const chartWidth = svgWidth - paddingX * 2;
  const chartHeight = svgHeight - paddingY * 2;

  const coordinates = points.map((p, idx) => {
    const x = paddingX + (idx * chartWidth) / (points.length - 1);
    const y = paddingY + chartHeight - (p.hours / maxVal) * chartHeight;
    return { x, y, label: p.month, val: p.hours };
  });

  // Curved line path generation using cubic bezier control points
  let linePath = "";
  if (coordinates.length > 0) {
    linePath = `M ${coordinates[0].x} ${coordinates[0].y}`;
    for (let i = 0; i < coordinates.length - 1; i++) {
      const curr = coordinates[i];
      const next = coordinates[i + 1];
      const cpX1 = curr.x + chartWidth / (points.length - 1) / 2;
      const cpY1 = curr.y;
      const cpX2 = next.x - chartWidth / (points.length - 1) / 2;
      const cpY2 = next.y;
      linePath += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${next.x} ${next.y}`;
    }
  }

  const areaPath = coordinates.length > 0
    ? `${linePath} L ${coordinates[coordinates.length - 1].x} ${paddingY + chartHeight} L ${coordinates[0].x} ${paddingY + chartHeight} Z`
    : "";

  return (
    <DashboardLayout>
      {/* Component Styles */}
      <style>{`
        .student-welcome-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .student-welcome-text h2 {
          font-size: 26px;
          font-weight: 800;
          color: var(--text-primary, #111827);
          margin-bottom: 4px;
        }
        .student-welcome-text p {
          font-size: 14px;
          color: var(--text-secondary, #6b7280);
        }
        .filter-select {
          padding: 6px 14px;
          border-radius: 8px;
          border: 1px solid var(--border-color, #e5e7eb);
          background: var(--bg-surface, #ffffff);
          font-size: 13px;
          color: var(--text-primary);
          cursor: pointer;
          outline: none;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }
        .student-stats-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 32px;
        }
        .student-stat-card {
          background: var(--bg-surface, #ffffff);
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 16px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02);
        }
        .student-stat-icon-wrap {
          width: 52px;
          height: 52px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }
        .student-stat-card:nth-child(1) .student-stat-icon-wrap { background: #ecfdf5; color: #10b981; }
        .student-stat-card:nth-child(2) .student-stat-icon-wrap { background: #eff6ff; color: #3b82f6; }
        .student-stat-card:nth-child(3) .student-stat-icon-wrap { background: #f0fdf4; color: #22c55e; }
        .student-stat-card:nth-child(4) .student-stat-icon-wrap { background: #fff7ed; color: #f97316; }

        .student-stat-info {
          display: flex;
          flex-direction: column;
        }
        .student-stat-info strong {
          font-size: 24px;
          font-weight: 700;
          color: var(--text-primary);
        }
        .student-stat-info span {
          font-size: 12px;
          color: var(--text-secondary);
          margin-top: 2px;
        }
        .student-stat-info small {
          font-size: 11px;
          color: var(--text-muted, #9ca3af);
          margin-top: 4px;
          font-weight: 500;
        }

        /* Chart section */
        .student-charts-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 32px;
        }
        .student-chart-box {
          background: var(--bg-surface, #ffffff);
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
        }
        .chart-box-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .chart-box-header h3 {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary);
        }

        /* Custom Bar Chart styling */
        .quiz-bars-container {
          display: flex;
          justify-content: space-around;
          align-items: flex-end;
          height: 180px;
          padding-top: 10px;
          border-bottom: 1px solid var(--border-color, #e5e7eb);
          margin-bottom: 10px;
        }
        .quiz-bar-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 50px;
        }
        .quiz-bar-fill {
          width: 32px;
          background: #4caf50;
          border-radius: 6px 6px 0 0;
          transition: height 0.6s ease;
          position: relative;
        }
        .quiz-bar-fill:hover {
          background: #388e3c;
        }
        .quiz-bar-fill::after {
          content: attr(data-score) '%';
          position: absolute;
          top: -20px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 10px;
          font-weight: 600;
          color: var(--text-primary);
        }
        .quiz-bar-label {
          font-size: 12px;
          color: var(--text-secondary);
          margin-top: 8px;
          font-weight: 500;
        }

        /* Split columns */
        .student-bottom-grid {
          display: grid;
          grid-template-columns: 1.6fr 1fr;
          gap: 24px;
          align-items: start;
        }
        .panel-container {
          background: var(--bg-surface, #ffffff);
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
        }
        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .panel-header h3 {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .continue-course-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 12px;
          margin-bottom: 12px;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .continue-course-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.04);
        }
        .continue-course-image {
          width: 70px;
          height: 70px;
          border-radius: 8px;
          object-fit: cover;
        }
        .continue-course-details {
          flex: 1;
        }
        .continue-course-details h4 {
          font-size: 15px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 4px;
        }
        .continue-course-details p {
          font-size: 12px;
          color: var(--text-secondary);
          margin-bottom: 8px;
        }
        .progress-bar-wrap {
          background: var(--bg-body, #f3f4f6);
          height: 6px;
          border-radius: 4px;
          overflow: hidden;
          width: 80%;
          display: flex;
        }
        .progress-bar-fill {
          background: #4caf50;
          height: 100%;
          border-radius: 4px;
        }

        /* Deadlines list */
        .deadline-list {
          list-style: none;
          padding: 0;
          margin: 0 0 24px 0;
        }
        .deadline-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px;
          background: var(--bg-body, #f9fafb);
          border-radius: 10px;
          margin-bottom: 8px;
          border: 1px solid var(--border-color, #e5e7eb);
        }
        .deadline-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .deadline-icon {
          color: #10b981;
          font-size: 18px;
          display: flex;
        }
        .deadline-text strong {
          display: block;
          font-size: 13px;
          color: var(--text-primary);
        }
        .deadline-text span {
          font-size: 11px;
          color: var(--text-secondary);
        }
        .deadline-date {
          font-size: 12px;
          font-weight: 600;
          color: #059669;
        }

        /* Certificate item */
        .cert-item-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: var(--bg-body, #f9fafb);
          border-radius: 10px;
          margin-bottom: 8px;
          border: 1px solid var(--border-color, #e5e7eb);
        }
        .cert-icon-box {
          font-size: 20px;
          color: #f59e0b;
          display: flex;
        }
        .cert-meta-info strong {
          display: block;
          font-size: 13px;
          color: var(--text-primary);
        }
        .cert-meta-info span {
          font-size: 11px;
          color: var(--text-secondary);
        }

        @media (max-width: 900px) {
          .student-stats-row { grid-template-columns: repeat(2, 1fr); }
          .student-charts-grid { grid-template-columns: 1fr; }
          .student-bottom-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 500px) {
          .student-stats-row { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* Welcome Greeting Row */}
      <div className="student-welcome-row">
        <div className="student-welcome-text">
          <h2>Welcome back, {user?.fullName?.split(" ")[0] || "Learner"}! 👋</h2>
          <p>Continue your learning journey</p>
        </div>
        <select
          value={timeFilter}
          onChange={(e) => setTimeFilter(e.target.value)}
          className="filter-select"
        >
          <option>This Month</option>
          <option>Last Month</option>
          <option>All Time</option>
        </select>
      </div>

      {/* 4 Cards Grid */}
      <div className="student-stats-row">
        <article className="student-stat-card">
          <div className="student-stat-icon-wrap"><FiBook /></div>
          <div className="student-stat-info">
            <strong>{stats?.coursesEnrolled || 0}</strong>
            <span>Courses Enrolled</span>
            <small>↑ {stats?.enrolledThisMonth || 0} this month</small>
          </div>
        </article>

        <article className="student-stat-card">
          <div className="student-stat-icon-wrap"><FiClock /></div>
          <div className="student-stat-info">
            <strong>{stats?.learningHours || 0}h</strong>
            <span>Learning Time</span>
            <small>↑ {stats?.hoursThisMonth || 1.8}h this month</small>
          </div>
        </article>

        <article className="student-stat-card">
          <div className="student-stat-icon-wrap"><FiAward /></div>
          <div className="student-stat-info">
            <strong>{stats?.certificates || 0}</strong>
            <span>Certificates</span>
            <small>↑ {stats?.certsThisMonth || 0} this month</small>
          </div>
        </article>

        <article className="student-stat-card">
          <div className="student-stat-icon-wrap"><FiZap /></div>
          <div className="student-stat-info">
            <strong>{stats?.learningStreak || 0}</strong>
            <span>Day Streak</span>
            <small>↑ Keep it up!</small>
          </div>
        </article>
      </div>

      {/* Chart Section */}
      <div className="student-charts-grid">
        {/* Learning Progress (SVG Line Chart) */}
        <section className="student-chart-box">
          <div className="chart-box-header">
            <h3>Learning Progress</h3>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="filter-select"
            >
              <option>This Year</option>
              <option>Last Year</option>
            </select>
          </div>

          <div style={{ position: "relative", width: "100%", height: "180px" }}>
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} width="100%" height="100%">
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((r, i) => {
                const y = paddingY + r * chartHeight;
                const gridVal = Math.round(maxVal - r * maxVal);
                return (
                  <g key={i}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={svgWidth - paddingX}
                      y2={y}
                      stroke="var(--border-color, #e5e7eb)"
                      strokeWidth="1"
                      strokeDasharray="4"
                    />
                    <text
                      x={paddingX - 10}
                      y={y + 4}
                      fill="var(--text-secondary, #6b7280)"
                      fontSize="10"
                      textAnchor="end"
                      fontWeight="500"
                    >
                      {gridVal}
                    </text>
                  </g>
                );
              })}

              {/* Gradient Area Fill */}
              {areaPath && (
                <path d={areaPath} fill="url(#chartGrad)" />
              )}

              {/* Curved Line */}
              {linePath && (
                <path
                  d={linePath}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Data Dots */}
              {coordinates.map((coord, idx) => (
                <g key={idx}>
                  <circle
                    cx={coord.x}
                    cy={coord.y}
                    r="5"
                    fill="#ffffff"
                    stroke="#10b981"
                    strokeWidth="2.5"
                  />
                  {/* Label under chart */}
                  <text
                    x={coord.x}
                    y={svgHeight - 4}
                    fill="var(--text-secondary, #6b7280)"
                    fontSize="11"
                    textAnchor="middle"
                    fontWeight="500"
                  >
                    {coord.label}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </section>

        {/* Quiz Performance (CSS Bar Chart) */}
        <section className="student-chart-box">
          <div className="chart-box-header">
            <h3>Quiz Performance</h3>
            <select className="filter-select"><option>This Month</option></select>
          </div>

          <div className="quiz-bars-container">
            {quizPerformance?.map((q) => (
              <div key={q.subject} className="quiz-bar-col">
                <div
                  className="quiz-bar-fill"
                  style={{ height: `${q.score}%` }}
                  data-score={q.score}
                />
                <span className="quiz-bar-label">{q.subject}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Bottom Sections Grid */}
      <div className="student-bottom-grid">
        {/* Left Column: Continue Learning */}
        <section className="panel-container">
          <div className="panel-header">
            <h3>Continue Learning</h3>
            <Link to="/courses" className="btn btn--outline btn--sm" style={{ padding: "6px 14px" }}>
              View all courses →
            </Link>
          </div>

          {recentCourses?.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <p className="dash-empty" style={{ margin: "0 0 16px" }}>No active courses.</p>
              <Link to="/courses" className="btn btn--primary btn--sm">Browse Catalog</Link>
            </div>
          ) : (
            <div>
              {recentCourses.map((c) => {
                const coverImg = c.image || `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=400`;
                return (
                  <div key={c.id} className="continue-course-card">
                    <img src={coverImg} alt="" className="continue-course-image" />
                    <div className="continue-course-details">
                      <h4>{c.title}</h4>
                      <p style={{ margin: "2px 0 6px" }}>
                        <span style={{ textTransform: "capitalize", fontWeight: "600" }}>{c.category}</span>
                        {" · "}{c.nextLesson}
                      </p>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div className="progress-bar-wrap">
                          <div className="progress-bar-fill" style={{ width: `${c.progress}%` }} />
                        </div>
                        <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-primary)" }}>{c.progress}%</span>
                      </div>
                    </div>

                    {c.paymentStatus === "paid" || c.paymentStatus === "free" ? (
                      <Link to={`/student/learn/${c.id}`} className="btn btn--primary btn--sm">
                        Continue
                      </Link>
                    ) : (
                      <Link to={`/student/pay/${c.id}`} className="btn btn--outline btn--sm">
                        Pay
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Right Column: Deadlines & Certificates stack */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Upcoming Deadlines */}
          <section className="panel-container" style={{ paddingBottom: "16px" }}>
            <div className="panel-header" style={{ marginBottom: "16px" }}>
              <h3>Upcoming Deadlines</h3>
            </div>
            <ul className="deadline-list">
              {upcomingDeadlines?.map((d, i) => (
                <li key={i} className="deadline-item">
                  <div className="deadline-info">
                    <span className="deadline-icon"><FiCalendar /></span>
                    <div className="deadline-text">
                      <strong>{d.title}</strong>
                      <span>{d.course}</span>
                    </div>
                  </div>
                  <span className="deadline-date">{d.date}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Recent Certificates */}
          <section className="panel-container">
            <div className="panel-header" style={{ marginBottom: "16px" }}>
              <h3>Recent Certificates</h3>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {recentCertificates?.map((c, i) => (
                <div key={i} className="cert-item-row">
                  <span className="cert-icon-box"><FiAward /></span>
                  <div className="cert-meta-info">
                    <strong>{c.course}</strong>
                    <span>Lisha Academy - {c.issuedAt}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
