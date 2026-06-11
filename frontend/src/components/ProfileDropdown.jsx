import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiChevronDown } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { getRoleHome } from "../utils/roleRedirect";
import { resolveMediaUrl } from "../utils/mediaUrl";

const studentLinks = [
  { to: "/student/my-learning", label: "My Learnings" },
  { to: "/student/dashboard", label: "Dashboard" },
  { to: "/student/purchases", label: "My Purchase" },
  { to: "/student/wishlist", label: "Wishlist" },
  { to: "/student/my-learning?tab=certificates", label: "Accomplishments" },
  { to: "/student/profile", label: "Profile" },
  { to: "/student/settings", label: "Settings" },
  { to: "/home#contact", label: "Help Center" },
];

const instructorLinks = [
  { to: "/instructor/dashboard", label: "Dashboard" },
  { to: "/instructor/courses", label: "My Courses" },
  { to: "/instructor/courses/new", label: "Create Course" },
  { to: "/student/settings", label: "Settings" },
];

const adminLinks = [
  { to: "/admin/dashboard", label: "Dashboard" },
  { to: "/admin/users", label: "Users" },
  { to: "/admin/courses", label: "Manage Courses" },
  { to: "/student/settings", label: "Settings" },
];

const ProfileDropdown = () => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!user) return null;

  const avatar =
    resolveMediaUrl(user.profilePic) ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=2e7d32&color=fff`;
  const links =
    user.role === "student"
      ? studentLinks
      : user.role === "instructor"
      ? instructorLinks
      : adminLinks;

  return (
    <div className="profile-dropdown" ref={ref}>
      <button
        type="button"
        className="profile-dropdown__trigger"
        onClick={() => setOpen(!open)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "4px 8px",
          borderRadius: "8px",
          transition: "background 0.2s"
        }}
      >
        <img
          src={avatar}
          alt={user.fullName}
          className="profile-dropdown__avatar"
          style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover" }}
        />
        <div className="profile-dropdown__info-meta" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", textAlign: "left" }}>
          <span style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-primary)", lineHeight: "1.2" }}>
            {user.fullName}
          </span>
          <span style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "capitalize", marginTop: "2px" }}>
            {user.role}
          </span>
        </div>
        <FiChevronDown size={14} style={{ color: "var(--text-secondary)", marginLeft: "4px" }} aria-hidden="true" />
      </button>
      {open && (
        <div className="profile-dropdown__menu">
          <div className="profile-dropdown__header">
            <img src={avatar} alt="" />
            <div>
              <strong>{user.fullName}</strong>
              <span>{user.email}</span>
            </div>
          </div>
          <ul>
            {links.map((link) => (
              <li key={link.label}>
                <Link to={link.to} onClick={() => setOpen(false)}>{link.label}</Link>
              </li>
            ))}
          </ul>
          <div className="profile-dropdown__actions-box">
            <Link to="/home#pricing" className="btn btn--primary btn--sm" onClick={() => setOpen(false)}>
              Join for free
            </Link>
            <button
              type="button"
              className="btn btn--outline btn--sm"
              onClick={() => {
                logout();
                navigate("/login");
              }}
            >
              Log Out
            </button>
          </div>
          {user.role === "student" && (
            <div className="profile-dropdown__promo">
              <strong>Upgrade to Pro Learning</strong>
              <span>Access 500+ courses</span>
              <Link to="/home#pricing" onClick={() => setOpen(false)}>Learn more</Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;
