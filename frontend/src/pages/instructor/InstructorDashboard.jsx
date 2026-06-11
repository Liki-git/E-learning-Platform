import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiUsers, FiDollarSign, FiPlayCircle, FiStar, FiCalendar, FiMoreVertical } from "react-icons/fi";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/client";

const InstructorDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [revenueFilter, setRevenueFilter] = useState("This Year");
  const [distFilter, setDistFilter] = useState("This Month");

  const load = () => {
    api.get("/dashboard/instructor").then(({ data: res }) => {
      setData(res);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <DashboardLayout title="Instructor Dashboard" subtitle="Loading metrics...">
        <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text-secondary)" }}>
          <div className="spinner" style={{ border: "4px solid #f3f4f6", borderTop: "4px solid #10b981", borderRadius: "50%", width: "40px", height: "40px", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
          <p>Loading your instructor metrics...</p>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      </DashboardLayout>
    );
  }

  const { stats, revenueChart, studentDistribution, courses, upcomingDeadlines, recentReviews } = data || {};

  // Custom SVG Line Chart coordinates calculation for Revenue Overview
  const svgWidth = 500;
  const svgHeight = 180;
  const paddingX = 50;
  const paddingY = 20;

  const points = revenueChart && revenueChart.length > 0 ? revenueChart : [
    { month: "Jan", revenue: 2000 },
    { month: "Feb", revenue: 4500 },
    { month: "Mar", revenue: 6000 },
    { month: "Apr", revenue: 9500 },
    { month: "May", revenue: 8000 },
    { month: "Jun", revenue: 11000 },
  ];

  const maxRevenue = Math.max(...points.map(p => p.revenue), 10000);
  const chartWidth = svgWidth - paddingX * 2;
  const chartHeight = svgHeight - paddingY * 2;

  const coordinates = points.map((p, idx) => {
    const x = paddingX + (idx * chartWidth) / (points.length - 1);
    const y = paddingY + chartHeight - (p.revenue / maxRevenue) * chartHeight;
    return { x, y, label: p.month, val: p.revenue };
  });

  // Curved line path generation
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

  // Donut Chart logic for Student Distribution
  const distColors = ["#4caf50", "#00bcd4", "#ff9800", "#9c27b0"];
  const distributionList = studentDistribution && studentDistribution.length > 0 ? studentDistribution : [
    { course: "Machine Learning", count: 5644, percentage: 45 },
    { course: "Web Development", count: 3766, percentage: 30 },
    { course: "Cloud Computing", count: 3133, percentage: 25 },
  ];

  let accumulatedPercent = 0;
  const donutSlices = distributionList.map((d) => {
    const percentage = d.percentage || 0;
    const strokeLength = (percentage / 100) * 314.16;
    const strokeOffset = 314.16 - (accumulatedPercent / 100) * 314.16;
    accumulatedPercent += percentage;
    return {
      ...d,
      strokeLength,
      strokeOffset,
    };
  });

  return (
    <DashboardLayout>
      {/* Component CSS styles */}
      <style>{`
        .instructor-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .instructor-header-text h2 {
          font-size: 26px;
          font-weight: 800;
          color: var(--text-primary);
          margin-bottom: 4px;
        }
        .instructor-header-text p {
          font-size: 14px;
          color: var(--text-secondary);
        }
        .instructor-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 32px;
        }
        .inst-stat-card {
          background: var(--bg-surface, #ffffff);
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 16px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
        }
        .inst-stat-icon-box {
          width: 52px;
          height: 52px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }
        .inst-stat-card:nth-child(1) .inst-stat-icon-box { background: #eff6ff; color: #3b82f6; }
        .inst-stat-card:nth-child(2) .inst-stat-icon-box { background: #f0fdf4; color: #10b981; }
        .inst-stat-card:nth-child(3) .inst-stat-icon-box { background: #ecfdf5; color: #22c55e; }
        .inst-stat-card:nth-child(4) .inst-stat-icon-box { background: #fef3c7; color: #f59e0b; }

        .inst-stat-info {
          display: flex;
          flex-direction: column;
        }
        .inst-stat-info span.label-text {
          font-size: 12px;
          color: var(--text-secondary);
        }
        .inst-stat-info strong {
          font-size: 22px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 2px 0;
        }
        .inst-stat-info span.sub-text {
          font-size: 11px;
          color: var(--text-muted, #9ca3af);
          font-weight: 500;
        }

        /* Charts styling */
        .inst-charts-row {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 24px;
          margin-bottom: 32px;
        }
        .inst-chart-card {
          background: var(--bg-surface, #ffffff);
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
        }
        .inst-chart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .inst-chart-header h3 {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary);
        }

        /* Donut Chart Container */
        .donut-container {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 24px;
          margin-top: 10px;
        }
        .donut-graphic-wrap {
          position: relative;
          width: 130px;
          height: 130px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .donut-legend {
          display: flex;
          flex-direction: column;
          gap: 12px;
          flex: 1;
        }
        .donut-legend-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
        }
        .donut-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .donut-legend-text {
          display: flex;
          justify-content: space-between;
          width: 100%;
          color: var(--text-primary);
        }
        .donut-legend-text span.pct {
          font-weight: 600;
        }

        /* Bottom section */
        .inst-bottom-grid {
          display: grid;
          grid-template-columns: 1.6fr 1fr;
          gap: 24px;
          align-items: start;
        }
        .inst-panel {
          background: var(--bg-surface, #ffffff);
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
        }
        .inst-panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .inst-panel-header h3 {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary);
        }

        /* Table custom override */
        .inst-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        .inst-table th {
          padding: 12px 16px;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
          border-bottom: 1px solid var(--border-color);
        }
        .inst-table td {
          padding: 16px;
          font-size: 14px;
          color: var(--text-primary);
          border-bottom: 1px solid var(--border-color);
          vertical-align: middle;
        }
        .inst-table tr:last-child td {
          border-bottom: none;
        }

        /* Review card */
        .review-card-item {
          padding: 16px;
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 12px;
          background: var(--bg-body, #f9fafb);
          margin-bottom: 12px;
        }
        .review-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .review-user-info {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .review-user-info img {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          object-fit: cover;
        }
        .review-user-name strong {
          display: block;
          font-size: 13px;
          color: var(--text-primary);
        }
        .review-user-name span {
          font-size: 11px;
          color: var(--text-secondary);
        }
        .review-rating-stars {
          color: #f59e0b;
          font-size: 12px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 2px;
        }
        .review-comment-text {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.4;
        }

        /* Deadlines list */
        .deadline-list {
          list-style: none;
          padding: 0;
          margin: 0;
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

        @media (max-width: 990px) {
          .instructor-stats-grid { grid-template-columns: repeat(2, 1fr); }
          .inst-charts-row { grid-template-columns: 1fr; }
          .inst-bottom-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 600px) {
          .instructor-stats-grid { grid-template-columns: 1fr; }
          .donut-container { flex-direction: column; gap: 16px; }
        }
      `}</style>

      {/* Title & Action Button Row */}
      <div className="instructor-header-row">
        <div className="instructor-header-text">
          <h2>Instructor Dashboard</h2>
          <p>Manage your courses, track performance and engage with your students.</p>
        </div>
        <Link to="/instructor/courses/new" className="btn btn--primary" style={{ padding: "10px 20px" }}>
          + Create New Course
        </Link>
      </div>

      {/* 4 Cards Grid */}
      <div className="instructor-stats-grid">
        <article className="inst-stat-card">
          <div className="inst-stat-icon-box"><FiUsers /></div>
          <div className="inst-stat-info">
            <span className="label-text">Total Students</span>
            <strong>{stats?.totalStudents?.toLocaleString() || "12,543"}</strong>
            <span className="sub-text">↑ {stats?.studentsThisMonth || 12} this month</span>
          </div>
        </article>

        <article className="inst-stat-card">
          <div className="inst-stat-icon-box"><FiDollarSign /></div>
          <div className="inst-stat-info">
            <span className="label-text">Total Revenue</span>
            <strong>₹{stats?.revenue?.toLocaleString() || "82,543"}</strong>
            <span className="sub-text">↑ {stats?.revenueThisMonth || 18} this month</span>
          </div>
        </article>

        <article className="inst-stat-card">
          <div className="inst-stat-icon-box"><FiPlayCircle /></div>
          <div className="inst-stat-info">
            <span className="label-text">Active Courses</span>
            <strong>{stats?.activeCourses || 15}</strong>
            <span className="sub-text">{stats?.pendingCourses || 3} Pending Approval</span>
          </div>
        </article>

        <article className="inst-stat-card">
          <div className="inst-stat-icon-box"><FiStar /></div>
          <div className="inst-stat-info">
            <span className="label-text">Average Rating</span>
            <strong>{stats?.averageRating || 4.8}</strong>
            <span className="sub-text">↑ {stats?.ratingThisMonth || 0.3} this month</span>
          </div>
        </article>
      </div>

      {/* Graphs Grid */}
      <div className="inst-charts-row">
        {/* Revenue Overview (SVG Area Chart) */}
        <section className="inst-chart-card">
          <div className="inst-chart-header">
            <h3>Revenue Overview</h3>
            <select
              value={revenueFilter}
              onChange={(e) => setRevenueFilter(e.target.value)}
              className="filter-select"
            >
              <option>This Year</option>
              <option>Last Year</option>
            </select>
          </div>

          <div style={{ position: "relative", width: "100%", height: "180px" }}>
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} width="100%" height="100%">
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((r, i) => {
                const y = paddingY + r * chartHeight;
                const gridVal = Math.round(maxRevenue - r * maxRevenue);
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
                      {gridVal >= 1000 ? `₹${(gridVal / 1000).toFixed(1)}K` : `₹${gridVal}`}
                    </text>
                  </g>
                );
              })}

              {/* Gradient Area Fill */}
              {areaPath && (
                <path d={areaPath} fill="url(#revGrad)" />
              )}

              {/* Line path */}
              {linePath && (
                <path
                  d={linePath}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Dots */}
              {coordinates.map((coord, idx) => (
                <g key={idx}>
                  <circle
                    cx={coord.x}
                    cy={coord.y}
                    r="4"
                    fill="#ffffff"
                    stroke="#10b981"
                    strokeWidth="2"
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
            </svg>
          </div>
        </section>

        {/* Student Distribution (Donut Chart) */}
        <section className="inst-chart-card">
          <div className="inst-chart-header">
            <h3>Student Distribution</h3>
            <select
              value={distFilter}
              onChange={(e) => setDistFilter(e.target.value)}
              className="filter-select"
            >
              <option>This Month</option>
              <option>All Time</option>
            </select>
          </div>

          <div className="donut-container">
            <div className="donut-graphic-wrap">
              <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: "rotate(-90deg)" }}>
                {donutSlices.map((slice, idx) => (
                  <circle
                    key={idx}
                    cx="60"
                    cy="60"
                    r="50"
                    fill="transparent"
                    stroke={distColors[idx % distColors.length]}
                    strokeWidth="12"
                    strokeDasharray={`${slice.strokeLength} 314.16`}
                    strokeDashoffset={slice.strokeOffset}
                    style={{ transition: "stroke-dashoffset 0.6s ease" }}
                  />
                ))}
              </svg>
              {/* Centered Total Info */}
              <div style={{ position: "absolute", textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <span style={{ fontSize: "16px", fontWeight: "800", color: "var(--text-primary)" }}>
                  {stats?.totalStudents?.toLocaleString() || "12,543"}
                </span>
                <span style={{ fontSize: "9px", color: "var(--text-secondary)", marginTop: "2px" }}>
                  Total Students
                </span>
              </div>
            </div>

            {/* Donut Legend */}
            <div className="donut-legend">
              {donutSlices.map((slice, idx) => (
                <div key={idx} className="donut-legend-item">
                  <span className="donut-dot" style={{ background: distColors[idx % distColors.length] }} />
                  <div className="donut-legend-text">
                    <span style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", maxWidth: "100px" }}>{slice.course}</span>
                    <span className="pct">{slice.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Bottom Grid */}
      <div className="inst-bottom-grid">
        {/* Left Column: My Courses */}
        <section className="inst-panel" style={{ padding: "20px 0" }}>
          <div className="inst-panel-header" style={{ padding: "0 24px", marginBottom: "16px" }}>
            <h3>My Courses</h3>
            <Link to="/instructor/courses" className="link-green" style={{ fontSize: "13px" }}>
              View all courses →
            </Link>
          </div>

          {courses?.length === 0 ? (
            <p className="dash-empty" style={{ padding: "0 24px" }}>No courses created yet.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="inst-table">
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Students</th>
                    <th>Rating</th>
                    <th>Revenue</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((c) => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: "700" }}>{c.title}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <FiUsers style={{ color: "var(--text-secondary)" }} />
                          <span>{c.enrollments?.toLocaleString() || 0}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontWeight: "600", display: "flex", alignItems: "center", gap: "2px", color: "var(--text-primary)" }}>
                            ★ {c.rating ? c.rating.toFixed(1) : "0.0"}
                          </span>
                          <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                            ({c.reviewsCount || 0} reviews)
                          </span>
                        </div>
                      </td>
                      <td style={{ fontWeight: "600" }}>₹{c.revenue?.toLocaleString() || 0}</td>
                      <td>
                        <span className={`badge badge--${c.status}`}>{c.status}</span>
                      </td>
                      <td>
                        <Link to={`/instructor/courses/${c.id}/edit`} style={{ color: "var(--text-secondary)" }}>
                          <FiMoreVertical size={16} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Right Column: Deadlines & Recent Reviews */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Upcoming Deadlines */}
          <section className="inst-panel" style={{ paddingBottom: "16px" }}>
            <div className="inst-panel-header" style={{ marginBottom: "16px" }}>
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

          {/* Recent Reviews */}
          <section className="inst-panel">
            <div className="inst-panel-header" style={{ marginBottom: "16px" }}>
              <h3>Recent Reviews</h3>
              <Link to="/instructor/courses" className="link-green" style={{ fontSize: "13px" }}>
                View all →
              </Link>
            </div>
            <div>
              {recentReviews?.map((r) => {
                const avatar = r.studentAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(r.studentName)}&background=10b981&color=fff`;
                return (
                  <div key={r.id} className="review-card-item">
                    <div className="review-card-header">
                      <div className="review-user-info">
                        <img src={avatar} alt="" />
                        <div className="review-user-name">
                          <strong>{r.studentName}</strong>
                          <span>{r.courseName}</span>
                        </div>
                      </div>
                      <span className="review-rating-stars">
                        ★ {r.rating.toFixed(1)}
                        <span style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: "500", marginLeft: "4px" }}>
                          {r.timeAgo}
                        </span>
                      </span>
                    </div>
                    <p className="review-comment-text">"{r.comment}"</p>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default InstructorDashboard;
