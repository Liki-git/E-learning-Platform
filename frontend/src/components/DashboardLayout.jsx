import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";
import NotificationBell from "./NotificationBell";
import ProfileDropdown from "./ProfileDropdown";
import { useAuth } from "../context/AuthContext";
import { 
  FiHome, FiGrid, FiUsers, FiBookOpen, FiVolume2, FiList, 
  FiMessageSquare, FiFileText, FiHelpCircle, FiVideo, FiStar, 
  FiLogOut, FiMenu, FiX, FiPlusCircle
} from "react-icons/fi";

const sidebarNav = {
  admin: [
    { to: "/home", label: "Home", icon: <FiHome /> },
    { to: "/admin/dashboard", label: "Dashboard", icon: <FiGrid /> },
    { to: "/admin/users", label: "Users", icon: <FiUsers /> },
    { to: "/admin/courses", label: "Manage Courses", icon: <FiBookOpen /> },
    { to: "/admin/announcements", label: "Announcements", icon: <FiVolume2 /> },
    { to: "/admin/enrollments", label: "Recent Enrollments", icon: <FiList /> },
    { to: "/admin/messages", label: "Messages", icon: <FiMessageSquare /> },
  ],
  instructor: [
    { to: "/home", label: "Home", icon: <FiHome /> },
    { to: "/instructor/dashboard", label: "Dashboard", icon: <FiGrid /> },
    { to: "/instructor/courses/new", label: "Create Course", icon: <FiPlusCircle /> },
    { to: "/instructor/courses", label: "Manage Courses", icon: <FiBookOpen /> },
    { to: "/instructor/assignments", label: "Assignments", icon: <FiFileText /> },
    { to: "/instructor/quizzes", label: "Quizzes", icon: <FiHelpCircle /> },
    { to: "/instructor/live-classes", label: "Live Classes", icon: <FiVideo /> },
    { to: "/instructor/qa", label: "Q&A", icon: <FiHelpCircle /> },
    { to: "/instructor/reviews", label: "Reviews", icon: <FiStar /> },
    { to: "/instructor/messages", label: "Messages", icon: <FiMessageSquare /> },
    { to: "/instructor/announcements", label: "Announcements", icon: <FiVolume2 /> },
  ],
  student: [
    { to: "/home", label: "Home", icon: <FiHome /> },
    { to: "/student/dashboard", label: "Dashboard", icon: <FiGrid /> },
    { to: "/student/my-learning", label: "My Courses", icon: <FiBookOpen /> },
    { to: "/student/assignments", label: "Assignments", icon: <FiFileText /> },
    { to: "/student/quizzes", label: "Quizzes", icon: <FiHelpCircle /> },
    { to: "/student/live-classes", label: "Live Classes", icon: <FiVideo /> },
    { to: "/student/qa", label: "Q&A", icon: <FiHelpCircle /> },
    { to: "/student/reviews", label: "Reviews", icon: <FiStar /> },
    { to: "/student/messages", label: "Messages", icon: <FiMessageSquare /> },
    { to: "/student/announcements", label: "Announcements", icon: <FiVolume2 /> },
  ],
};

const DashboardLayout = ({ children, title, subtitle, contentClassName }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const links = sidebarNav[user?.role] || sidebarNav.student;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const isActive = (link) => {
    return location.pathname === link.to;
  };

  return (
    <div className="dash-layout-container">
      <style>{`
        .dash-layout-container {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          background: var(--bg-body, #f9fafb);
          color: var(--text-primary, #111827);
          font-family: 'Inter', system-ui, sans-serif;
        }
        .dash-top-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 40px;
          background: var(--bg-surface, #ffffff);
          border-bottom: 1px solid var(--border-color, #e5e7eb);
          position: sticky;
          top: 0;
          height: 70px;
          z-index: 1000;
        }
        .dash-header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .sidebar-toggle-btn {
          display: none;
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-size: 24px;
          cursor: pointer;
        }
        .dash-sidebar {
          width: 260px;
          background: var(--bg-surface, #ffffff);
          border-right: 1px solid var(--border-color, #e5e7eb);
          position: fixed;
          top: 70px;
          bottom: 0;
          left: 0;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 24px 16px;
          overflow-y: auto;
          z-index: 900;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .dash-sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .dash-sidebar-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 16px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          color: var(--text-secondary, #4b5563);
          text-decoration: none;
          transition: all 0.2s ease;
        }
        .dash-sidebar-link:hover {
          background: var(--bg-body, #f3f4f6);
          color: var(--text-primary, #111827);
        }
        .dash-sidebar-link.active {
          background: #eafaf1;
          color: #16a34a;
          font-weight: 600;
        }
        [data-theme="dark"] .dash-sidebar-link.active {
          background: #14532d;
          color: #4ade80;
        }
        .dash-sidebar-link-icon {
          display: flex;
          align-items: center;
          font-size: 18px;
        }
        .dash-sidebar-bottom {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: auto;
        }
        .dash-sidebar-promo {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: 16px;
          border-radius: 12px;
          font-size: 13px;
          text-align: center;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }
        .dash-sidebar-promo p {
          margin: 0 0 10px 0;
          font-weight: 600;
          line-height: 1.4;
        }
        .dash-sidebar-promo-btn {
          background: white;
          color: #059669;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          width: 100%;
          transition: background 0.2s ease;
        }
        .dash-sidebar-promo-btn:hover {
          background: #f3f4f6;
        }
        .dash-sidebar-logout {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 10px 16px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          color: #ef4444;
          background: transparent;
          border: none;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s ease;
        }
        .dash-sidebar-logout:hover {
          background: #fef2f2;
        }
        [data-theme="dark"] .dash-sidebar-logout:hover {
          background: #450a0a;
        }
        .dash-main-container {
          flex: 1;
          margin-left: 260px;
          padding-top: 0;
          min-height: calc(100vh - 70px);
          display: flex;
          flex-direction: column;
        }
        .dash-content-area {
          flex: 1;
          padding: 32px 40px;
          width: 100%;
          max-width: 1280px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
        }
        .dash-header-section {
          margin-bottom: 24px;
        }
        .dash-header-section h1 {
          font-size: 28px;
          font-weight: 700;
          color: var(--text-primary, #111827);
          margin-bottom: 4px;
        }
        .dash-header-section p {
          font-size: 15px;
          color: var(--text-secondary, #6b7280);
        }
        .dash-sidebar-overlay {
          display: none;
          position: fixed;
          top: 70px;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(2px);
          z-index: 850;
        }
        .dash-top-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .dash-top-actions .profile-dropdown__trigger:hover {
          background: var(--bg-body, #f3f4f6);
        }

        @media (max-width: 900px) {
          .dash-top-header {
            padding: 12px 20px;
          }
          .sidebar-toggle-btn {
            display: block;
          }
          .dash-sidebar {
            transform: translateX(-100%);
          }
          .dash-sidebar.open {
            transform: translateX(0);
          }
          .dash-sidebar-overlay.open {
            display: block;
          }
          .dash-main-container {
            margin-left: 0;
          }
          .dash-content-area {
            padding: 20px 16px;
          }
        }
      `}</style>

      {/* Top Header */}
      <header className="dash-top-header">
        <div className="dash-header-left">
          <button 
            type="button" 
            className="sidebar-toggle-btn" 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle Navigation Sidebar"
          >
            {sidebarOpen ? <FiX /> : <FiMenu />}
          </button>
          <Link to="/home" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
            <Logo size="sm" />
          </Link>
        </div>

        {/* Header Tools */}
        <div className="dash-top-actions">
          <ThemeToggle />
          <NotificationBell />
          <ProfileDropdown />
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      <div 
        className={`dash-sidebar-overlay ${sidebarOpen ? "open" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sticky Sidebar Navigation */}
      <aside className={`dash-sidebar ${sidebarOpen ? "open" : ""}`}>
        <nav className="dash-sidebar-nav">
          {links.map((link, idx) => {
            const active = isActive(link);
            return (
              <Link
                key={idx}
                to={link.to}
                className={`dash-sidebar-link ${active ? "active" : ""}`}
                onClick={() => setSidebarOpen(false)}
              >
                <span className="dash-sidebar-link-icon">{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="dash-sidebar-bottom">
          {user?.role === "instructor" && (
            <div className="dash-sidebar-promo">
              <p>Go live with your class schedule now</p>
              <button 
                type="button" 
                className="dash-sidebar-promo-btn"
                onClick={() => {
                  setSidebarOpen(false);
                  navigate("/instructor/live-classes");
                }}
              >
                Go Live
              </button>
            </div>
          )}

          {user?.role === "student" && (
            <div className="dash-sidebar-promo">
              <p>Upgrade your skills, try Pro Learning</p>
              <button 
                type="button" 
                className="dash-sidebar-promo-btn"
                onClick={() => {
                  setSidebarOpen(false);
                  navigate("/home#pricing");
                }}
              >
                Try Pro
              </button>
            </div>
          )}

          <button 
            type="button" 
            className="dash-sidebar-logout" 
            onClick={handleLogout}
          >
            <span className="dash-sidebar-link-icon"><FiLogOut /></span>
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="dash-main-container">
        <main className="dash-content-area">
          {title && (
            <div className="dash-header-section">
              <h1>{title}</h1>
              {subtitle && <p>{subtitle}</p>}
            </div>
          )}
          <div className={`dash-page-content ${contentClassName || ""}`}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
