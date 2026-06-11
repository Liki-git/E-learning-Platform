import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FiLock } from "react-icons/fi";
import ForgotPasswordSide from "../components/ForgotPasswordSide";
import InputField from "../components/InputField";
import PageShell from "../components/PageShell";
import ThemeToggle from "../components/ThemeToggle";
import api from "../api/client";

const ResetPasswordPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const email = location.state?.email || "";
  const otp = location.state?.otp || "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      setLoading(true);
      await api.post("/auth/reset-password", { email, otp, password, confirmPassword });
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Password reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell className="page-shell--auth">
      <ThemeToggle className="theme-toggle--floating theme-toggle--bottom-right" />
      <main className="page forgot-page">
      <ForgotPasswordSide index={2} />
      <section className="forgot-form-side">
        <div className="forgot-form-panel">
          <h2 className="forgot-form-panel__title">
            <span className="forgot-lock-icon">
              <FiLock size={28} aria-hidden="true" />
            </span>
            Forgot Password ?
          </h2>
          <p className="forgot-form-panel__sub">No worries, we&apos;ll send you reset instructions</p>

          <div className="forgot-envelope-icon">
            <img src="/images/forgot-envelope.png" alt="" />
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <InputField
              label="Enter new password"
              type="password"
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<FiLock size={18} aria-hidden="true" />}
              required
            />
            <InputField
              label="Re-enter password"
              type="password"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              icon={<FiLock size={18} aria-hidden="true" />}
              required
            />
            {error && <p className="error-msg">{error}</p>}
            <button type="submit" className="btn btn--primary btn--full" disabled={loading}>
              {loading ? "Resetting..." : "Reset password"}
            </button>
          </form>

          <p className="forgot-form-panel__back">
            <Link to="/login">← Back to log in</Link>
          </p>
        </div>
        <p className="forgot-page__signup">
          Don&apos;t have an account? <Link to="/signup">SignUp</Link>
        </p>
      </section>
      </main>
    </PageShell>
  );
};

export default ResetPasswordPage;
