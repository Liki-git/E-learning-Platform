import { Link, useLocation } from "react-router-dom";
import { FiBell } from "react-icons/fi";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";
import ProfileDropdown from "./ProfileDropdown";
import NotificationBell from "./NotificationBell";
import { useAuth } from "../context/AuthContext";
import { getRoleHome } from "../utils/roleRedirect";

const guestLinks = [
  { to: "/home", label: "Home", hash: "" },
  { to: "/courses", label: "Courses", hash: "" },
  { to: "/home#pricing", label: "Prices", hash: "#pricing" },
  { to: "/home#contact", label: "Contact", hash: "#contact" },
];

const AppNavbar = ({ active = "" }) => {
  const { user } = useAuth();
  const location = useLocation();
  const isActive = (key) => {
    if (key === "/home") {
      return location.pathname === "/home" && !location.hash;
    }
    return active === key || location.pathname === key;
  };

  return (
    <nav className="navbar">
      <div className="navbar__logo-large"><Logo size="nav" /></div>
      <ul className="navbar__links">
        {!user ? (
          guestLinks.map((link) => (
            <li key={link.label}>
              <Link to={link.to} className={location.hash === link.hash || (link.hash === "" && location.pathname === "/home" && !location.hash) ? "active" : ""}>
                {link.label}
              </Link>
            </li>
          ))
        ) : (
          <>
            <li><Link to="/home" className={isActive("/home") ? "active" : ""}>Home</Link></li>
            <li><Link to="/courses" className={isActive("/courses") ? "active" : ""}>Courses</Link></li>
            <li><Link to="/home#pricing" className={location.hash === "#pricing" ? "active" : ""}>Prices</Link></li>
            {user.role === "student" && (
              <li><Link to="/student/my-learning" className={isActive("/student/my-learning") ? "active" : ""}>My Learnings</Link></li>
            )}
            {user.role === "instructor" && (
              <li><Link to="/instructor/dashboard" className={isActive("/instructor/dashboard") ? "active" : ""}>Instructor</Link></li>
            )}
            {user.role === "admin" && (
              <li><Link to="/admin/dashboard" className={isActive("/admin/dashboard") ? "active" : ""}>Admin</Link></li>
            )}
            <li><Link to="/home#contact" className={location.hash === "#contact" ? "active" : ""}>Contact</Link></li>
          </>
        )}
      </ul>
      <div className="navbar__actions">
        <ThemeToggle />
        {user ? (
          <>
            <NotificationBell />
            <ProfileDropdown />
          </>
        ) : (
          <>
            <button type="button" className="icon-btn" aria-label="Notifications"><FiBell size={14} aria-hidden="true" /></button>
            <Link to="/login" className="btn btn--outline btn--sm">Login</Link>
            <Link to="/signup" className="btn btn--primary btn--sm">Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default AppNavbar;
