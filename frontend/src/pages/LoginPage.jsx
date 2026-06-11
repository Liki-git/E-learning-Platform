import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiMail, FiLock, FiStar } from "react-icons/fi";
import Logo from "../components/Logo";
import InputField from "../components/InputField";
import RoleSelector from "../components/RoleSelector";
import SocialAuth from "../components/SocialAuth";
import PageShell from "../components/PageShell";
import ThemeToggle from "../components/ThemeToggle";
import ThemeImage from "../components/ThemeImage";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { getPostAuthHome } from "../utils/postAuthRedirect";

const LoginPage = () => {
  const [role, setRole] = useState("student");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      setLoading(true);
      const { data } = await api.post("/auth/login", { identifier, password, role });
      login(data);
      navigate(getPostAuthHome());
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setError("");
      const { data } = await api.post("/auth/google", {
        credential: credentialResponse.credential,
        role,
      });
      login(data);
      navigate(getPostAuthHome());
    } catch (err) {
      setError(err.response?.data?.message || "Google login failed");
    }
  };

  return (
    <PageShell className="page-shell--auth">
      <ThemeToggle className="theme-toggle--floating theme-toggle--bottom-right" />
      <main className="page login-page">
      <section className="login-left">
        <Logo size="lg" />

        <div className="login-left__content">
          <div className="login-left__copy">
            <h1 className="login-hero-title">
              <span>Learn Without</span>
              <span>Limits</span>
            </h1>
            <p className="login-hero-sub">Learn, Teach, Grow - All in One Platform.</p>

            <ul className="login-features">
              <li>
                <span className="login-features__icon">
                  <svg viewBox="0 0 24 24" width="31" height="31" fill="currentColor" aria-hidden="true">
                    <path d="M3 5.5A3.5 3.5 0 016.5 2H11v17H6.5A3.5 3.5 0 003 22V5.5z" />
                    <path d="M13 2h4.5A3.5 3.5 0 0121 5.5V22a3.5 3.5 0 00-3.5-3H13V2z" />
                  </svg>
                </span>
                <div>
                  <strong>Interactive Learning</strong>
                  <span>Engaging content for every learner</span>
                </div>
              </li>
              <li>
                <span className="login-features__icon">
                  <svg viewBox="0 0 24 24" width="31" height="31" fill="currentColor" aria-hidden="true">
                    <path d="M3 20h18v2H3zM5 11h3v7H5zM11 7h3v11h-3zM17 3h3v15h-3z" />
                    <path d="M4 14.5l5-4.8 3 2.8 6.6-7.4 1.5 1.3-8 9-3-2.8-4.7 4.5z" />
                  </svg>
                </span>
                <div>
                  <strong>Track Progress</strong>
                  <span>Monitor your learning progress</span>
                </div>
              </li>
              <li>
                <span className="login-features__icon">
                  <svg viewBox="0 0 24 24" width="31" height="31" fill="currentColor" aria-hidden="true">
                    <path d="M4 3h12v11H4zM6 5v7h8V5z" />
                    <path d="M17 7h3v14l-4-2.3-4 2.3v-5h5z" />
                  </svg>
                </span>
                <div>
                  <strong>Earn Certificates</strong>
                  <span>Showcase your skills and achievements</span>
                </div>
              </li>
              <li>
                <span className="login-features__icon">
                  <svg viewBox="0 0 24 24" width="31" height="31" fill="currentColor" aria-hidden="true">
                    <circle cx="12" cy="6" r="4" />
                    <path d="M4 21a8 8 0 0116 0z" />
                  </svg>
                </span>
                <div>
                  <strong>Learn Anywhere</strong>
                  <span>Access courses anywhere and anytime</span>
                </div>
              </li>
            </ul>
          </div>

          <div className="login-illustration">
            <ThemeImage name="login" lightSrc="/images/login-illustration.png" alt="Online learning illustration" />
          </div>
        </div>

        <div className="login-social-proof">
          <p>
            Join 10,000+ learners
            <br />
            growing everyday
          </p>
          <div className="login-social-proof__row">
            <img src="/images/avatars-row.png" alt="Learners" className="login-avatars-img" />
            <strong>+10K</strong>
          </div>
        </div>

        <footer className="login-footer-links">
          <span>By continuing, you agree to our</span>
          <span>
            <Link to="/">Terms of Use</Link> and <Link to="/">Privacy Policy</Link>
          </span>
        </footer>
      </section>

      <section className="login-right">
        <div className="auth-panel">
          <h2 className="auth-panel__title">
            <span className="wave" aria-hidden="true">
              <FiStar size={28} />
            </span>
            Welcome back!
          </h2>
          <RoleSelector role={role} onChange={setRole} />

          <form className="auth-form" onSubmit={handleSubmit}>
            <InputField
              label="Email or Username"
              placeholder="Enter your email or username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              icon={<FiMail size={18} aria-hidden="true" />}
              required
            />
            <InputField
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<FiLock size={18} aria-hidden="true" />}
              required
            />

            <div className="auth-form__row">
              <label className="checkbox-label">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                Remember me
              </label>
              <Link to="/forgot-password" className="link-green">
                Forgot Password?
              </Link>
            </div>

            {error && <p className="error-msg">{error}</p>}

            <button type="submit" className="btn btn--primary btn--full" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <SocialAuth
            label="or continue with"
            onGoogleSuccess={handleGoogleSuccess}
            onGoogleError={() => setError("Google Sign-In failed")}
          />

          <p className="auth-panel__footer">
            Don&apos;t have an account? <Link to="/signup">Sign Up</Link>
          </p>
        </div>
      </section>
      </main>
    </PageShell>
  );
};

export default LoginPage;
