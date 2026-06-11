import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/client";

const InstructorCourses = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("newest");

  const load = () => {
    api.get("/courses", { params: { status: "" } }).then(({ data }) => setCourses(data.courses));
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (id) => {
    await api.post(`/courses/${id}/submit`);
    load();
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    await api.delete(`/courses/${deletingId}`);
    setDeletingId(null);
    load();
  };

  const categories = useMemo(() => {
    return [...new Set(courses.map((c) => c.category).filter(Boolean))];
  }, [courses]);

  const filteredCourses = useMemo(() => {
    let list = [...courses];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.title?.toLowerCase().includes(q) ||
          c.category?.toLowerCase().includes(q)
      );
    }
    if (category) {
      list = list.filter((c) => c.category === category);
    }
    if (status) {
      list = list.filter((c) => c.status === status);
    }
    list.sort((a, b) => {
      if (sort === "title-asc") return (a.title || "").localeCompare(b.title || "");
      if (sort === "title-desc") return (b.title || "").localeCompare(a.title || "");
      if (sort === "price-asc") return (a.price || 0) - (b.price || 0);
      if (sort === "price-desc") return (b.price || 0) - (a.price || 0);
      if (sort === "students-desc") return (b.enrollments || 0) - (a.enrollments || 0);
      if (sort === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
      return new Date(b.createdAt) - new Date(a.createdAt); // newest
    });
    return list;
  }, [courses, search, category, status, sort]);

  return (
    <DashboardLayout title="Course Management">
      <div className="dash-section__head">
        <p>Create, edit, and submit courses for admin approval.</p>
        <Link to="/instructor/courses/new" className="btn btn--primary">+ New course</Link>
      </div>

      <div className="catalog-toolbar" style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "20px", marginTop: "10px" }}>
        <input
          type="search"
          placeholder="Search course title or category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: "1 1 200px" }}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ flex: "1 1 150px" }}>
          <option value="">All categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ flex: "1 1 150px" }}>
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="pending">Pending</option>
          <option value="published">Published</option>
          <option value="rejected">Rejected</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} style={{ flex: "1 1 150px" }}>
          <option value="newest">Recently created</option>
          <option value="oldest">Oldest created</option>
          <option value="title-asc">Title: A-Z</option>
          <option value="title-desc">Title: Z-A</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="students-desc">Students: Most to Least</option>
        </select>
      </div>

      <div className="dash-table-wrap">
        <table className="dash-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Price</th>
              <th>Students</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCourses.length === 0 ? (
              <tr>
                <td colSpan="6" className="dash-empty" style={{ textAlign: "center", padding: "32px 0", color: "var(--text-muted)" }}>
                  No courses found matching your criteria.
                </td>
              </tr>
            ) : (
              filteredCourses.map((c) => (
                <tr key={c.id}>
                  <td>
                    <button
                      type="button"
                      onClick={() => setSelectedCourse(c)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--green-700, #388e3c)",
                        fontWeight: "600",
                        cursor: "pointer",
                        padding: 0,
                        textAlign: "left",
                        textDecoration: "underline",
                      }}
                    >
                      {c.title}
                    </button>
                  </td>
                  <td>{c.category}</td>
                  <td>{c.price === 0 ? "Free" : `₹${c.price}`}</td>
                  <td>{c.enrollments !== undefined ? c.enrollments : 0}</td>
                  <td>
                    <span className={`badge badge--${c.status}`}>{c.status}</span>
                  </td>
                  <td className="dash-actions">
                    <Link to={`/instructor/courses/${c.id}/edit`}>Edit</Link>
                    {c.status === "draft" && (
                      <button type="button" className="btn btn--primary btn--sm" onClick={() => submit(c.id)}>
                        Submit
                      </button>
                    )}
                    <button type="button" className="btn btn--outline btn--sm" onClick={() => setDeletingId(c.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Course Detail, Materials, and History Modal */}
      {selectedCourse && (
        <div className="modal-overlay" onClick={() => setSelectedCourse(null)} role="presentation">
          <div className="modal-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="course-title" style={{ maxWidth: "500px", width: "95%" }}>
            <h3 id="course-title">{selectedCourse.title}</h3>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "4px" }}>{selectedCourse.description}</p>
            
            <div style={{ margin: "16px 0", fontSize: "13px" }}>
              <p><strong>Category:</strong> {selectedCourse.category}</p>
              <p><strong>Level:</strong> {selectedCourse.level}</p>
              <p><strong>Price:</strong> {selectedCourse.price === 0 ? "Free" : `₹${selectedCourse.price}`}</p>
              <p><strong>Students Enrolled:</strong> {selectedCourse.enrollments || 0}</p>
            </div>

            <hr style={{ border: "none", borderTop: "1px solid var(--border-color)", margin: "12px 0" }} />

            <h4 style={{ fontSize: "14px", fontWeight: "600" }}>Materials & Videos</h4>
            {selectedCourse.modules && selectedCourse.modules.length > 0 ? (
              <div style={{ marginTop: "8px", maxHeight: "180px", overflowY: "auto", border: "1px solid var(--border-color)", borderRadius: "6px", padding: "8px", background: "var(--bg-elevated)" }}>
                {selectedCourse.modules.map((mod, mi) => (
                  <div key={mod._id || mi} style={{ marginBottom: "10px" }}>
                    <strong style={{ display: "block", fontSize: "13px" }}>Module: {mod.title}</strong>
                    <ul style={{ listStyle: "circle", paddingLeft: "20px", marginTop: "2px" }}>
                      {mod.lessons?.map((lesson, li) => (
                        <li key={lesson._id || li} style={{ fontSize: "12px" }}>
                          {lesson.title} ({lesson.type})
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontStyle: "italic", fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>No modules or lessons created yet.</p>
            )}

            <hr style={{ border: "none", borderTop: "1px solid var(--border-color)", margin: "12px 0" }} />

            <h4 style={{ fontSize: "14px", fontWeight: "600" }}>Course Status History</h4>
            <div style={{ marginTop: "6px", fontSize: "12px", display: "flex", flexDirection: "column", gap: "4px" }}>
              <p>⏱️ <strong>Created on:</strong> {new Date(selectedCourse.createdAt).toLocaleString()}</p>
              {selectedCourse.status === "pending" && (
                <p>🟡 <strong>Submitted for Approval:</strong> {new Date(selectedCourse.updatedAt).toLocaleString()}</p>
              )}
              {selectedCourse.status === "published" && (
                <p>🟢 <strong>Approved & Published:</strong> {new Date(selectedCourse.updatedAt).toLocaleString()}</p>
              )}
              {selectedCourse.status === "rejected" && (
                <>
                  <p>🔴 <strong>Rejected on:</strong> {new Date(selectedCourse.updatedAt).toLocaleString()}</p>
                  <p style={{ color: "var(--error)", paddingLeft: "16px" }}><strong>Reason:</strong> "{selectedCourse.rejectionReason || "Does not meet standards"}"</p>
                </>
              )}
            </div>

            <div className="settings-form__actions" style={{ marginTop: "20px", justifyContent: "flex-end" }}>
              <button type="button" className="btn btn--primary btn--sm" onClick={() => setSelectedCourse(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="modal-overlay" onClick={() => setDeletingId(null)} role="presentation">
          <div className="modal-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="delete-title">
            <h3 id="delete-title">Delete Course</h3>
            <p style={{ marginTop: "8px" }}>Are you sure you want to delete this course? This action cannot be undone.</p>
            <div className="settings-form__actions" style={{ marginTop: "20px" }}>
              <button
                type="button"
                className="btn btn--primary"
                style={{ backgroundColor: "var(--error, #b42318)" }}
                onClick={confirmDelete}
              >
                Delete Course
              </button>
              <button
                type="button"
                className="btn btn--outline"
                onClick={() => setDeletingId(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default InstructorCourses;
