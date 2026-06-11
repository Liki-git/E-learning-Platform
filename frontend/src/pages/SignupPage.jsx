import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiUser, FiMail, FiLock } from "react-icons/fi";
import InputField from "../components/InputField";
import RoleSelector from "../components/RoleSelector";
import SocialAuth from "../components/SocialAuth";
import Logo from "../components/Logo";
import PageShell from "../components/PageShell";
import ThemeToggle from "../components/ThemeToggle";
import ThemeImage from "../components/ThemeImage";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { getPostAuthHome } from "../utils/postAuthRedirect";

const SignupPage = () => {
  const [formData, setFormData] = useState({
    role: "student",
    fullName: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!agreed) {
      setError("Please agree to Terms of Use and Privacy Policy");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      const { data } = await api.post("/auth/signup", {
        ...formData,
        fullName: formData.username,
      });
      login(data);
      navigate(getPostAuthHome());
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setError("");
      const { data } = await api.post("/auth/google", {
        credential: credentialResponse.credential,
        role: formData.role,
      });
      login(data);
      navigate(getPostAuthHome());
    } catch (err) {
      setError(err.response?.data?.message || "Google signup failed");
    }
  };

  return (
    <PageShell className="page-shell--auth">
      <ThemeToggle className="theme-toggle--floating theme-toggle--bottom-right" />
      <main className="page signup-page">
      <section className="signup-left">
        <div className="auth-panel auth-panel--signup">
          <h2 className="auth-panel__title auth-panel__title--signup">
            <span className="auth-panel__title-icon">
              <FiUser size={26} aria-hidden="true" />
            </span>
            Create Your Account!
          </h2>

          <RoleSelector
            role={formData.role}
            onChange={(value) => setFormData((prev) => ({ ...prev, role: value }))}
          />

          <form className="auth-form" onSubmit={handleSubmit}>
            <InputField
              label="Username"
              name="username"
              placeholder="Enter your full name"
              value={formData.username}
              onChange={handleChange}
              icon={<FiUser size={18} aria-hidden="true" />}
              required
            />
            <InputField
              label="Email address"
              name="email"
              type="email"
              placeholder="Enter your email address"
              value={formData.email}
              onChange={handleChange}
              icon={<FiMail size={18} aria-hidden="true" />}
              required
            />
            <InputField
              label="Password"
              name="password"
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              icon={<FiLock size={18} aria-hidden="true" />}
              required
            />
            <InputField
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              placeholder="Re-enter your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              icon={<FiLock size={18} aria-hidden="true" />}
              required
            />

            <label className="checkbox-label checkbox-label--terms">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
              I agree to our <Link to="/">Terms of Use</Link> and <Link to="/">Privacy Policy</Link>
            </label>

            {error && (
              <p className="error-msg">
                {error}
                {(error.includes("already exists") || error.includes("logging in")) && (
                  <> <Link to="/login" className="link-green">Log in here</Link></>
                )}
              </p>
            )}

            <button type="submit" className="btn btn--primary btn--full" disabled={loading}>
              {loading ? "Creating..." : "Create Account"}
            </button>
          </form>

          <SocialAuth
            label="or sign up with"
            onGoogleSuccess={handleGoogleSuccess}
            onGoogleError={() => setError("Google Sign-Up failed")}
          />

          <p className="auth-panel__footer">
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </div>
      </section>

      <section className="signup-right">
        <div className="signup-right__header">
          <Logo size="lg" />
        </div>
        <div className="signup-illustration">
          <ThemeImage name="signup" lightSrc="/images/signup-illustration.png" alt="Students learning together" />
        </div>
        <h2 className="signup-right__title">Distance Learning Programs</h2>
        <p className="signup-right__sub">Attend live and recorded classes at your own convenience.</p>
        <p className="signup-right__mission">
          To provide smart, simple, and accessible online learning for everyone.
        </p>
        <div className="signup-features-box">
          <div className="signup-features-box__item">
            <span className="check-icon">✓</span> 500+ courses
          </div>
          <div className="signup-features-box__item">
            <span className="check-icon">✓</span> AI Insights
          </div>
          <div className="signup-features-box__item">
            <span className="check-icon">✓</span> 5 year access
          </div>
          <div className="signup-features-box__item">
            <span className="check-icon">✓</span> Unlimited Practice Sets
          </div>
        </div>
      </section>
      </main>
    </PageShell>
  );
};

export default SignupPage;
