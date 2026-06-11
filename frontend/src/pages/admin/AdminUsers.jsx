import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/client";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [role, setRole] = useState("");
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const load = () => {
    api.get("/admin/users", { params: { role, search } }).then(({ data }) => setUsers(data.users));
  };

  useEffect(() => {
    load();
  }, [role, search]);

  const confirmDelete = async () => {
    if (!deletingId) return;
    await api.delete(`/admin/users/${deletingId}`);
    setDeletingId(null);
    load();
  };

  return (
    <DashboardLayout title="User Management">
      <div className="catalog-toolbar">
        <input
          type="search"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">All roles</option>
          <option value="student">Students</option>
          <option value="instructor">Instructors</option>
          <option value="admin">Admins</option>
        </select>
      </div>
      <div className="dash-table-wrap">
        <table className="dash-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Username</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id}>
                <td>{u.fullName}</td>
                <td>{u.email}</td>
                <td>{u.username}</td>
                <td>{u.role}</td>
                <td>
                  <button type="button" className="btn btn--outline btn--sm" onClick={() => setDeletingId(u._id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {deletingId && (
        <div className="modal-overlay" onClick={() => setDeletingId(null)} role="presentation">
          <div className="modal-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="delete-title">
            <h3 id="delete-title">Delete User</h3>
            <p style={{ marginTop: "8px" }}>Are you sure you want to delete this user? This action cannot be undone.</p>
            <div className="settings-form__actions" style={{ marginTop: "20px" }}>
              <button
                type="button"
                className="btn btn--primary"
                style={{ backgroundColor: "var(--error, #b42318)" }}
                onClick={confirmDelete}
              >
                Delete User
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

export default AdminUsers;
