import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/client";
import { FiTrendingUp, FiCalendar, FiBookOpen, FiUser } from "react-icons/fi";

const AdminEnrollments = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/dashboard/admin")
      .then(({ data }) => {
        setEnrollments(data.recentEnrollments || []);
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to load enrollment history.");
        setLoading(false);
      });
  }, []);

  return (
    <DashboardLayout title="Recent Enrollments" subtitle="Monitor real-time student registration and course purchases across the platform">
      <div className="enr-container">
        <style>{`
          .enr-card {
            background: var(--bg-surface, #ffffff);
            border: 1px solid var(--border-color, #e5e7eb);
            border-radius: 16px;
            padding: 24px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
            margin-top: 20px;
          }
          .enr-table {
            width: 100%;
            border-collapse: collapse;
            text-align: left;
          }
          .enr-table th {
            padding: 14px 16px;
            border-bottom: 2px solid var(--border-color, #e5e7eb);
            color: var(--text-secondary);
            font-size: 13px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .enr-table td {
            padding: 16px;
            border-bottom: 1px solid var(--border-color, #e5e7eb);
            color: var(--text-primary);
            font-size: 14px;
          }
          .enr-table tr:last-child td {
            border-bottom: none;
          }
          .enr-student {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .enr-student-avatar {
            width: 38px;
            height: 38px;
            border-radius: 50%;
            object-fit: cover;
            background: #e5e7eb;
          }
          .enr-student-info strong {
            display: block;
            font-size: 14px;
            color: var(--text-primary);
          }
          .enr-student-info span {
            display: block;
            font-size: 11px;
            color: var(--text-secondary);
          }
          .enr-badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 600;
            background: #dcfce7;
            color: #166534;
          }
          .enr-empty {
            text-align: center;
            padding: 48px 0;
            color: var(--text-secondary);
          }
          .enr-empty-icon {
            font-size: 40px;
            margin-bottom: 12px;
            color: var(--text-muted);
          }
        `}</style>

        {loading ? (
          <div className="enr-card" style={{ textAlign: "center", padding: "40px 0" }}>
            <p>Loading enrollment data...</p>
          </div>
        ) : error ? (
          <div className="enr-card" style={{ color: "#ef4444" }}>
            <p>{error}</p>
          </div>
        ) : (
          <div className="enr-card">
            {enrollments.length === 0 ? (
              <div className="enr-empty">
                <div className="enr-empty-icon"><FiBookOpen /></div>
                <p>No student enrollments recorded yet.</p>
              </div>
            ) : (
              <table className="enr-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Course Name</th>
                    <th>Status</th>
                    <th>Time Enrolled</th>
                  </tr>
                </thead>
                <tbody>
                  {enrollments.map((enr) => {
                    const avatar = enr.studentAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(enr.studentName)}&background=10b981&color=fff&size=80`;
                    return (
                      <tr key={enr.id}>
                        <td>
                          <div className="enr-student">
                            <img src={avatar} alt={enr.studentName} className="enr-student-avatar" />
                            <div className="enr-student-info">
                              <strong>{enr.studentName}</strong>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <FiBookOpen style={{ color: "#10b981" }} />
                            <span>{enr.courseName}</span>
                          </div>
                        </td>
                        <td>
                          <span className="enr-badge">Enrolled</span>
                        </td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-secondary)" }}>
                            <FiCalendar />
                            <span>{enr.timeAgo || "Just now"}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminEnrollments;
