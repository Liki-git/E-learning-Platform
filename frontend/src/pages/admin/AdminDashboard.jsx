import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiUsers, FiAward, FiBook, FiTrendingUp, FiDollarSign, FiMonitor, FiVideo, FiCheckSquare, FiMessageSquare, FiShield } from "react-icons/fi";
import DashboardLayout from "../../components/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/client";

const AdminDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [growthFilter, setGrowthFilter] = useState("This Year");
  const [revFilter, setRevFilter] = useState("This Year");

  const load = () => {
    api.get("/dashboard/admin").then(({ data: res }) => {
      setData(res);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <DashboardLayout title="Admin Dashboard" subtitle="Gathering stats...">
        <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text-secondary)" }}>
          <div className="spinner" style={{ border: "4px solid #f3f4f6", borderTop: "4px solid #10b981", borderRadius: "50%", width: "40px", height: "40px", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
          <p>Loading platform administration metrics...</p>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      </DashboardLayout>
    );
  }

  const { stats, growthChart, revenueChart, topSellingCourses, recentEnrollments, systemAlerts } = data || {};

  // Custom SVG Dual-Line Chart coordinates for Platform Growth
  const svgWidth = 500;
  const svgHeight = 180;
  const paddingX = 50;
  const paddingY = 20;

  const points = growthChart && growthChart.length > 0 ? growthChart : [
    { month: "Jan", users: 8000, enrollments: 5000 },
    { month: "Feb", users: 11000, enrollments: 6800 },
    { month: "Mar", users: 14000, enrollments: 8200 },
    { month: "Apr", users: 16000, enrollments: 10500 },
    { month: "May", users: 19000, enrollments: 12500 },
    { month: "Jun", users: 22000, enrollments: 16000 },
  ];

  const maxVal = Math.max(...points.map(p => Math.max(p.users, p.enrollments)), 20000);
  const chartWidth = svgWidth - paddingX * 2;
  const chartHeight = svgHeight - paddingY * 2;

  // Convert points to coordinates for two separate lines
  const userCoords = points.map((p, idx) => {
    const x = paddingX + (idx * chartWidth) / (points.length - 1);
    const y = paddingY + chartHeight - (p.users / maxVal) * chartHeight;
    return { x, y, label: p.month, val: p.users };
  });

  const enrollmentCoords = points.map((p, idx) => {
    const x = paddingX + (idx * chartWidth) / (points.length - 1);
    const y = paddingY + chartHeight - (p.enrollments / maxVal) * chartHeight;
    return { x, y, label: p.month, val: p.enrollments };
  });

  // Line paths generation
  const getLinePath = (coords) => {
    if (coords.length === 0) return "";
    let path = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const curr = coords[i];
      const next = coords[i + 1];
      const cpX1 = curr.x + chartWidth / (points.length - 1) / 2;
      const cpY1 = curr.y;
      const cpX2 = next.x - chartWidth / (points.length - 1) / 2;
      const cpY2 = next.y;
      path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${next.x} ${next.y}`;
    }
    return path;
  };

  const userPath = getLinePath(userCoords);
  const userArea = userCoords.length > 0
    ? `${userPath} L ${userCoords[userCoords.length - 1].x} ${paddingY + chartHeight} L ${userCoords[0].x} ${paddingY + chartHeight} Z`
    : "";

  const enrollmentPath = getLinePath(enrollmentCoords);

  return (
    <DashboardLayout>
      {/* CSS Styles */}
      <style>{`
        .admin-welcome-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .admin-welcome-text h2 {
          font-size: 26px;
          font-weight: 800;
          color: var(--text-primary);
          margin-bottom: 4px;
        }
        .admin-welcome-text p {
          font-size: 14px;
          color: var(--text-secondary);
        }
        .admin-stats-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 16px;
          margin-bottom: 32px;
        }
        .admin-stat-card {
          background: var(--bg-surface, #ffffff);
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 16px;
          padding: 18px;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
        }
        .admin-stat-icon-wrap {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
        }
        .admin-stat-card:nth-child(1) .admin-stat-icon-wrap { background: #ecfdf5; color: #10b981; }
        .admin-stat-card:nth-child(2) .admin-stat-icon-wrap { background: #e0f2fe; color: #0284c7; }
        .admin-stat-card:nth-child(3) .admin-stat-icon-wrap { background: #f0fdf4; color: #22c55e; }
        .admin-stat-card:nth-child(4) .admin-stat-icon-wrap { background: #fdf2f8; color: #db2777; }
        .admin-stat-card:nth-child(5) .admin-stat-icon-wrap { background: #fef3c7; color: #d97706; }

        .admin-stat-info {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .admin-stat-info span.title-label {
          font-size: 11px;
          color: var(--text-secondary);
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
        }
        .admin-stat-info strong {
          font-size: 20px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 1px 0;
        }
        .admin-stat-info span.pct-sub {
          font-size: 10px;
          color: #10b981;
          font-weight: 600;
        }

        /* Charts section */
        .admin-charts-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 32px;
        }
        .admin-chart-box {
          background: var(--bg-surface, #ffffff);
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
        }
        .admin-chart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .admin-chart-header h3 {
          font-size: 15px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .chart-legends-wrap {
          display: flex;
          gap: 16px;
          margin-bottom: 12px;
          font-size: 11px;
        }
        .chart-legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 500;
        }
        .legend-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        /* Custom Bar Chart styling */
        .revenue-bars-wrap {
          display: flex;
          justify-content: space-around;
          align-items: flex-end;
          height: 160px;
          padding-top: 10px;
          border-bottom: 1px solid var(--border-color, #e5e7eb);
          margin-bottom: 10px;
        }
        .rev-bar-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 50px;
        }
        .rev-bar-fill {
          width: 28px;
          background: #4caf50;
          border-radius: 4px 4px 0 0;
          transition: height 0.6s ease;
          position: relative;
        }
        .rev-bar-fill:hover {
          background: #388e3c;
        }
        .rev-bar-label {
          font-size: 11px;
          color: var(--text-secondary);
          margin-top: 8px;
          font-weight: 500;
        }

        /* 3 Columns Section */
        .admin-triple-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          margin-bottom: 32px;
        }
        .admin-panel {
          background: var(--bg-surface, #ffffff);
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
        }
        .admin-panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .admin-panel-header h3 {
          font-size: 15px;
          font-weight: 700;
          color: var(--text-primary);
        }

        /* Top selling course list */
        .top-selling-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 0;
          border-bottom: 1px solid var(--border-color, #f3f4f6);
        }
        .top-selling-row:last-child {
          border-bottom: none;
        }
        .top-selling-icon {
          width: 44px;
          height: 44px;
          border-radius: 8px;
          object-fit: cover;
        }
        .top-selling-info {
          flex: 1;
          min-width: 0;
        }
        .top-selling-info strong {
          display: block;
          font-size: 13px;
          color: var(--text-primary);
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
        }
        .top-selling-info span {
          font-size: 11px;
          color: var(--text-secondary);
        }
        .top-selling-value {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
        }

        /* Recent enrollment row */
        .recent-enr-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 0;
          border-bottom: 1px solid var(--border-color, #f3f4f6);
        }
        .recent-enr-row:last-child {
          border-bottom: none;
        }
        .recent-enr-row img {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          object-fit: cover;
        }
        .recent-enr-details {
          flex: 1;
          min-width: 0;
        }
        .recent-enr-details strong {
          display: block;
          font-size: 13px;
          color: var(--text-primary);
        }
        .recent-enr-details span {
          font-size: 11px;
          color: var(--text-secondary);
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
          display: block;
        }
        .recent-enr-time {
          font-size: 10px;
          color: var(--text-muted);
          white-space: nowrap;
        }

        /* System Alert Row */
        .system-alert-row {
          display: flex;
          gap: 12px;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 8px;
          font-size: 12px;
        }
        .system-alert-row.error { background: #fef2f2; border: 1px solid #fee2e2; color: #991b1b; }
        .system-alert-row.warn { background: #fffbeb; border: 1px solid #fef3c7; color: #92400e; }
        .system-alert-row.info { background: #f0fdf4; border: 1px solid #dcfce7; color: #166534; }
        .alert-text-box {
          flex: 1;
        }
        .alert-text-box strong {
          display: block;
          font-size: 12px;
        }
        .alert-text-box p {
          font-size: 11px;
          margin-top: 2px;
          opacity: 0.9;
        }
        .alert-time {
          font-size: 10px;
          opacity: 0.8;
          white-space: nowrap;
        }

        /* Footer Metrics Banner */
        .admin-footer-banner {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          background: var(--bg-surface, #ffffff);
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 16px;
          padding: 16px;
          margin-top: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
        }
        .footer-metric-col {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          border-right: 1px solid var(--border-color, #e5e7eb);
        }
        .footer-metric-col:last-child {
          border-right: none;
        }
        .footer-metric-icon {
          font-size: 20px;
          color: var(--text-secondary);
        }
        .footer-metric-vals {
          display: flex;
          flex-direction: column;
        }
        .footer-metric-vals span {
          font-size: 10px;
          color: var(--text-secondary);
        }
        .footer-metric-vals strong {
          font-size: 14px;
          font-weight: 700;
          color: var(--text-primary);
        }

        @media (max-width: 1024px) {
          .admin-stats-grid { grid-template-columns: repeat(3, 1fr); }
          .admin-triple-grid { grid-template-columns: 1fr; }
          .admin-footer-banner { grid-template-columns: repeat(3, 1fr); gap: 16px; }
          .footer-metric-col:nth-child(3) { border-right: none; }
        }
        @media (max-width: 768px) {
          .admin-stats-grid { grid-template-columns: repeat(2, 1fr); }
          .admin-charts-grid { grid-template-columns: 1fr; }
          .admin-footer-banner { grid-template-columns: 1fr; gap: 12px; }
          .footer-metric-col { border-right: none; border-bottom: 1px solid var(--border-color); padding-bottom: 8px; }
          .footer-metric-col:last-child { border-bottom: none; padding-bottom: 0; }
        }
        @media (max-width: 480px) {
          .admin-stats-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* Greeting Title Section */}
      <div className="admin-welcome-row">
        <div className="admin-welcome-text">
          <h2>Welcome back, {user?.fullName?.split(" ")[0] || "Admin"}! 👋</h2>
          <p>Here's what happening on your platform today.</p>
        </div>
      </div>

      {/* 5 Cards Grid */}
      <div className="admin-stats-grid">
        <article className="admin-stat-card">
          <div className="admin-stat-icon-wrap"><FiUsers /></div>
          <div className="admin-stat-info">
            <span className="title-label">Total Instructors</span>
            <strong>{stats?.totalInstructors?.toLocaleString() || "565"}</strong>
            <span className="pct-sub">+ 12.5% this month</span>
          </div>
        </article>

        <article className="admin-stat-card">
          <div className="admin-stat-icon-wrap"><FiUsers /></div>
          <div className="admin-stat-info">
            <span className="title-label">Total Students</span>
            <strong>{stats?.totalStudents?.toLocaleString() || "20,456"}</strong>
            <span className="pct-sub">+ 15.0% this month</span>
          </div>
        </article>

        <article className="admin-stat-card">
          <div className="admin-stat-icon-wrap"><FiBook /></div>
          <div className="admin-stat-info">
            <span className="title-label">Total Courses</span>
            <strong>{stats?.totalCourses?.toLocaleString() || "1,653"}</strong>
            <span className="pct-sub">↑ 8.2% this month</span>
          </div>
        </article>

        <article className="admin-stat-card">
          <div className="admin-stat-icon-wrap"><FiTrendingUp /></div>
          <div className="admin-stat-info">
            <span className="title-label">Total Enrollments</span>
            <strong>{stats?.totalEnrollments?.toLocaleString() || "20,456"}</strong>
            <span className="pct-sub">↑ 17.2% this month</span>
          </div>
        </article>

        <article className="admin-stat-card">
          <div className="admin-stat-icon-wrap"><FiDollarSign /></div>
          <div className="admin-stat-info">
            <span className="title-label">Total Revenue</span>
            <strong>₹{stats?.platformRevenue?.toLocaleString() || "98,341"}</strong>
            <span className="pct-sub">↑ 14.6% this month</span>
          </div>
        </article>
      </div>

      {/* Charts Row */}
      <div className="admin-charts-grid">
        {/* Platform Growth (Two Lines area chart) */}
        <section className="admin-chart-box">
          <div className="admin-chart-header">
            <h3>Platform Growth</h3>
            <select
              value={growthFilter}
              onChange={(e) => setGrowthFilter(e.target.value)}
              className="filter-select"
            >
              <option>This Year</option>
              <option>Last Year</option>
            </select>
          </div>

          <div className="chart-legends-wrap">
            <div className="chart-legend-item">
              <span className="legend-indicator" style={{ background: "#10b981" }} />
              <span style={{ color: "var(--text-secondary)" }}>Users</span>
            </div>
            <div className="chart-legend-item">
              <span className="legend-indicator" style={{ background: "#3b82f6" }} />
              <span style={{ color: "var(--text-secondary)" }}>Enrollments</span>
            </div>
          </div>

          <div style={{ position: "relative", width: "100%", height: "160px" }}>
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} width="100%" height="100%">
              <defs>
                <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
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
                      fontSize="9"
                      textAnchor="end"
                      fontWeight="500"
                    >
                      {gridVal >= 1000 ? `${(gridVal / 1000).toFixed(0)}K` : gridVal}
                    </text>
                  </g>
                );
              })}

              {/* Users Gradient Area */}
              {userArea && <path d={userArea} fill="url(#userGrad)" />}

              {/* Enrollments Path */}
              {enrollmentPath && (
                <path
                  d={enrollmentPath}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2.5"
                  strokeDasharray="3 3"
                  strokeLinecap="round"
                />
              )}

              {/* Users Path */}
              {userPath && (
                <path
                  d={userPath}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Users Dots */}
              {userCoords.map((coord, idx) => (
                <g key={idx}>
                  <circle
                    cx={coord.x}
                    cy={coord.y}
                    r="4.5"
                    fill="#ffffff"
                    stroke="#10b981"
                    strokeWidth="2.5"
                  />
                  <text
                    x={coord.x}
                    y={svgHeight - 4}
                    fill="var(--text-secondary, #6b7280)"
                    fontSize="10"
                    textAnchor="middle"
                    fontWeight="500"
                  >
                    {coord.label}
                  </text>
                </g>
              ))}

              {/* Enrollment Dots */}
              {enrollmentCoords.map((coord, idx) => (
                <circle
                  key={idx}
                  cx={coord.x}
                  cy={coord.y}
                  r="3.5"
                  fill="#ffffff"
                  stroke="#3b82f6"
                  strokeWidth="2"
                />
              ))}
            </svg>
          </div>
        </section>

        {/* Revenue Overview (Bar Chart) */}
        <section className="admin-chart-box">
          <div className="admin-chart-header">
            <h3>Revenue Overview</h3>
            <select
              value={revFilter}
              onChange={(e) => setRevFilter(e.target.value)}
              className="filter-select"
            >
              <option>This Year</option>
              <option>Last Year</option>
            </select>
          </div>

          <div className="revenue-bars-wrap">
            {revenueChart?.map((r) => {
              const maxValInBars = Math.max(...revenueChart.map(x => x.revenue), 1000);
              const barHeightPct = (r.revenue / maxValInBars) * 100;
              return (
                <div key={r.month} className="rev-bar-col">
                  <div
                    className="rev-bar-fill"
                    style={{ height: `${barHeightPct}%` }}
                    title={`₹${r.revenue}`}
                  />
                  <span className="rev-bar-label">{r.month}</span>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Bottom Grid: Top Selling, Recent Enrollments, System Alerts */}
      <div className="admin-triple-grid">
        {/* Top Selling Course */}
        <section className="admin-panel">
          <div className="admin-panel-header">
            <h3>Top Selling Course</h3>
            <Link to="/admin/courses" className="link-green" style={{ fontSize: "12px" }}>
              View all
            </Link>
          </div>

          <div>
            {topSellingCourses?.length === 0 ? (
              <p className="dash-empty" style={{ fontSize: "13px" }}>No courses sold yet.</p>
            ) : (
              topSellingCourses.map((c, idx) => {
                const cover = c.image || `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=400`;
                return (
                  <div key={idx} className="top-selling-row">
                    <img src={cover} alt="" className="top-selling-icon" />
                    <div className="top-selling-info">
                      <strong>{c.title}</strong>
                      <span>{c.enrollments?.toLocaleString() || 0} enrollments</span>
                    </div>
                    <span className="top-selling-value">₹{c.revenue?.toLocaleString() || 0}</span>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Recent Enrollments */}
        <section className="admin-panel">
          <div className="admin-panel-header">
            <h3>Recent Enrollments</h3>
            <Link to="/admin/users" className="link-green" style={{ fontSize: "12px" }}>
              View all
            </Link>
          </div>

          <div>
            {recentEnrollments?.length === 0 ? (
              <p className="dash-empty" style={{ fontSize: "13px" }}>No enrollments yet.</p>
            ) : (
              recentEnrollments.map((re) => {
                const avatar = re.studentAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(re.studentName)}&background=2563eb&color=fff`;
                return (
                  <div key={re.id} className="recent-enr-row">
                    <img src={avatar} alt="" />
                    <div className="recent-enr-details">
                      <strong>{re.studentName}</strong>
                      <span>{re.courseName}</span>
                    </div>
                    <span className="recent-enr-time">{re.timeAgo}</span>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* System Alerts */}
        <section className="admin-panel">
          <div className="admin-panel-header">
            <h3>System Alerts</h3>
            <span className="link-green" style={{ fontSize: "12px", cursor: "pointer" }}>
              View all
            </span>
          </div>

          <div>
            {systemAlerts?.map((a) => (
              <div key={a.id} className={`system-alert-row ${a.type}`}>
                <div className="alert-text-box">
                  <strong>{a.title}</strong>
                  <p>{a.message}</p>
                </div>
                <span className="alert-time">{a.time}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Footer Metrics Banner */}
      <footer className="admin-footer-banner">
        <div className="footer-metric-col">
          <span className="footer-metric-icon"><FiMonitor /></span>
          <div className="footer-metric-vals">
            <span>Active Sessions</span>
            <strong>{stats?.activeSessions?.toLocaleString() || "2,345"}</strong>
          </div>
        </div>

        <div className="footer-metric-col">
          <span className="footer-metric-icon"><FiVideo /></span>
          <div className="footer-metric-vals">
            <span>Live Classes</span>
            <strong>{stats?.liveClasses || 36}</strong>
          </div>
        </div>

        <div className="footer-metric-col">
          <span className="footer-metric-icon"><FiCheckSquare /></span>
          <div className="footer-metric-vals">
            <span>Pending Approvals</span>
            <strong>{stats?.pendingCourseApprovals || 23}</strong>
          </div>
        </div>

        <div className="footer-metric-col">
          <span className="footer-metric-icon"><FiMessageSquare /></span>
          <div className="footer-metric-vals">
            <span>Open Tickets</span>
            <strong>{stats?.openTickets || 18}</strong>
          </div>
        </div>

        <div className="footer-metric-col">
          <span className="footer-metric-icon"><FiShield /></span>
          <div className="footer-metric-vals">
            <span>System Uptime</span>
            <strong>{stats?.systemUptime || "99.9%"}</strong>
          </div>
        </div>
      </footer>
    </DashboardLayout>
  );
};

export default AdminDashboard;
