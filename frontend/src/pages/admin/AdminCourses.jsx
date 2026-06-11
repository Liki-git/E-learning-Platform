import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/client";

const AdminCourses = () => {
  const [courses, setCourses] = useState([]);
  const [history, setHistory] = useState([]);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  // Pending approvals states
  const [pendingSearch, setPendingSearch] = useState("");
  const [pendingCategory, setPendingCategory] = useState("");
  const [pendingSort, setPendingSort] = useState("newest");

  // Managed history states
  const [historySearch, setHistorySearch] = useState("");
  const [historyCategory, setHistoryCategory] = useState("");
  const [historyStatus, setHistoryStatus] = useState("");
  const [historySort, setHistorySort] = useState("newest");

  const load = () => {
    api.get("/admin/courses/pending").then(({ data }) => setCourses(data.courses));
    api.get("/admin/courses/history").then(({ data }) => setHistory(data.courses));
  };

  useEffect(() => {
    load();
  }, []);

  const approve = async (id) => {
    await api.post(`/admin/courses/${id}/approve`);
    load();
  };

  const pendingCategories = useMemo(() => {
    return [...new Set(courses.map((c) => c.category).filter(Boolean))];
  }, [courses]);

  const filteredPending = useMemo(() => {
    let list = [...courses];
    if (pendingSearch.trim()) {
      const q = pendingSearch.toLowerCase();
      list = list.filter(
        (c) =>
          c.title?.toLowerCase().includes(q) ||
          c.category?.toLowerCase().includes(q) ||
          c.instructorName?.toLowerCase().includes(q) ||
          c.instructorEmail?.toLowerCase().includes(q)
      );
    }
    if (pendingCategory) {
      list = list.filter((c) => c.category === pendingCategory);
    }
    list.sort((a, b) => {
      if (pendingSort === "title-asc") return (a.title || "").localeCompare(b.title || "");
      if (pendingSort === "title-desc") return (b.title || "").localeCompare(a.title || "");
      if (pendingSort === "price-asc") return (a.price || 0) - (b.price || 0);
      if (pendingSort === "price-desc") return (b.price || 0) - (a.price || 0);
      if (pendingSort === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
      return new Date(b.createdAt) - new Date(a.createdAt); // newest first
    });
    return list;
  }, [courses, pendingSearch, pendingCategory, pendingSort]);

  const historyCategories = useMemo(() => {
    return [...new Set(history.map((c) => c.category).filter(Boolean))];
  }, [history]);

  const filteredHistory = useMemo(() => {
    let list = [...history];
    if (historySearch.trim()) {
      const q = historySearch.toLowerCase();
      list = list.filter(
        (c) =>
          c.title?.toLowerCase().includes(q) ||
          c.category?.toLowerCase().includes(q) ||
          c.instructorName?.toLowerCase().includes(q) ||
          c.instructorEmail?.toLowerCase().includes(q)
      );
    }
    if (historyCategory) {
      list = list.filter((c) => c.category === historyCategory);
    }
    if (historyStatus) {
      list = list.filter((c) => c.status === historyStatus);
    }
    list.sort((a, b) => {
      if (historySort === "title-asc") return (a.title || "").localeCompare(b.title || "");
      if (historySort === "title-desc") return (b.title || "").localeCompare(a.title || "");
      if (historySort === "price-asc") return (a.price || 0) - (b.price || 0);
      if (historySort === "price-desc") return (b.price || 0) - (a.price || 0);
      if (historySort === "oldest") return new Date(a.updatedAt) - new Date(b.updatedAt);
      return new Date(b.updatedAt) - new Date(a.updatedAt); // newest managed first
    });
    return list;
  }, [history, historySearch, historyCategory, historyStatus, historySort]);

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    const reason = rejectReason.trim() || "Does not meet standards";
    await api.post(`/admin/courses/${rejectingId}/reject`, { reason });
    setRejectingId(null);
    setRejectReason("");
    load();
  };

  return (
    <DashboardLayout title="Course Approval">
      <section className="dash-section">
        <h2>Pending Approvals</h2>
        {courses.length === 0 ? (
          <p className="dash-empty">No courses pending approval.</p>
        ) : (
          <>
            <div className="catalog-toolbar" style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "16px", marginTop: "10px" }}>
              <input
                type="search"
                placeholder="Search title, instructor, category..."
                value={pendingSearch}
                onChange={(e) => setPendingSearch(e.target.value)}
                style={{ flex: "1 1 200px" }}
              />
              <select value={pendingCategory} onChange={(e) => setPendingCategory(e.target.value)} style={{ flex: "1 1 150px" }}>
                <option value="">All categories</option>
                {pendingCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <select value={pendingSort} onChange={(e) => setPendingSort(e.target.value)} style={{ flex: "1 1 150px" }}>
                <option value="newest">Recently submitted</option>
                <option value="oldest">Oldest submitted</option>
                <option value="title-asc">Title: A-Z</option>
                <option value="title-desc">Title: Z-A</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>

            <div className="dash-table-wrap">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Instructor</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPending.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="dash-empty" style={{ textAlign: "center", padding: "24px 0", color: "var(--text-muted)" }}>
                        No pending courses match your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredPending.map((c) => (
                      <tr key={c.id}>
                        <td>{c.title}</td>
                        <td>
                          {c.instructorName}
                          <br />
                          <small>{c.instructorEmail}</small>
                        </td>
                        <td>{c.category}</td>
                        <td>{c.price === 0 ? "Free" : `₹${c.price}`}</td>
                        <td className="dash-actions">
                          <button
                            type="button"
                            className="btn btn--primary btn--sm"
                            onClick={() => approve(c.id)}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            className="btn btn--outline btn--sm"
                            onClick={() => setRejectingId(c.id)}
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <section className="dash-section" style={{ marginTop: "40px" }}>
        <h2>Managed Courses History</h2>
        {history.length === 0 ? (
          <p className="dash-empty">No courses managed yet.</p>
        ) : (
          <>
            <div className="catalog-toolbar" style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "16px", marginTop: "10px" }}>
              <input
                type="search"
                placeholder="Search title, instructor, category..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                style={{ flex: "1 1 200px" }}
              />
              <select value={historyCategory} onChange={(e) => setHistoryCategory(e.target.value)} style={{ flex: "1 1 150px" }}>
                <option value="">All categories</option>
                {historyCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <select value={historyStatus} onChange={(e) => setHistoryStatus(e.target.value)} style={{ flex: "1 1 150px" }}>
                <option value="">All statuses</option>
                <option value="published">Published</option>
                <option value="rejected">Rejected</option>
              </select>
              <select value={historySort} onChange={(e) => setHistorySort(e.target.value)} style={{ flex: "1 1 150px" }}>
                <option value="newest">Recently managed</option>
                <option value="oldest">Oldest managed</option>
                <option value="title-asc">Title: A-Z</option>
                <option value="title-desc">Title: Z-A</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>

            <div className="dash-table-wrap">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Instructor</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Rejection Reason</th>
                    <th>Date Managed</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="dash-empty" style={{ textAlign: "center", padding: "24px 0", color: "var(--text-muted)" }}>
                        No history matches your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredHistory.map((c) => (
                      <tr key={c.id}>
                        <td>{c.title}</td>
                        <td>
                          {c.instructorName}
                          <br />
                          <small>{c.instructorEmail}</small>
                        </td>
                        <td>{c.price === 0 ? "Free" : `₹${c.price}`}</td>
                        <td>
                          <span className={`badge badge--${c.status}`}>{c.status}</span>
                        </td>
                        <td>{c.rejectionReason || "-"}</td>
                        <td>{new Date(c.updatedAt).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {rejectingId && (
        <div className="modal-overlay" onClick={() => setRejectingId(null)} role="presentation">
          <div className="modal-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="reject-title">
            <h3 id="reject-title">Reject Course</h3>
            <p>Please provide the rejection reason for this course:</p>
            <form onSubmit={handleRejectSubmit} className="settings-form" style={{ border: "none", padding: 0, marginTop: "16px", background: "none" }}>
              <label style={{ padding: 0 }}>
                Reason
                <textarea
                  required
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Describe what needs to be improved..."
                />
              </label>
              <div className="settings-form__actions" style={{ marginTop: "16px" }}>
                <button type="submit" className="btn btn--primary">Reject Course</button>
                <button type="button" className="btn btn--outline" onClick={() => setRejectingId(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminCourses;
