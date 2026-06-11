import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiLock, FiMail, FiArrowLeft } from "react-icons/fi";
import ForgotPasswordSide from "../components/ForgotPasswordSide";
import InputField from "../components/InputField";
import PageShell from "../components/PageShell";
import ThemeToggle from "../components/ThemeToggle";
import api from "../api/client";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      setLoading(true);
      await api.post("/auth/forgot-password", { email });
      navigate("/verify-otp", { state: { email } });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell className="page-shell--auth">
      <ThemeToggle className="theme-toggle--floating theme-toggle--bottom-right" />
      <main className="page forgot-page">
      <ForgotPasswordSide index={0} />
      <section className="forgot-form-side">
        <div className="forgot-form-panel">
          <h2 className="forgot-form-panel__title">
            <span className="forgot-lock-icon">
              <FiLock size={28} aria-hidden="true" />
            </span>
            Forgot Password ?
          </h2>
          <p className="forgot-form-panel__sub">No worries, we'll send you reset instructions</p>

          <div className="forgot-envelope-icon">
            <img src="/images/forgot-envelope.png" alt="" />
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <InputField
              label="Email"
              type="email"
              placeholder="eg:johndoe@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<FiMail size={18} aria-hidden="true" />}
              required
            />
            {error && <p className="error-msg">{error}</p>}
            <button type="submit" className="btn btn--primary btn--full" disabled={loading}>
              {loading ? "Sending..." : "Reset password"}
            </button>
          </form>

          <p className="forgot-form-panel__back">
            <Link to="/login" className="back-link">
              <FiArrowLeft size={16} aria-hidden="true" />
              <span>Back to <span className="back-link__highlight">Log in</span></span>
            </Link>
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

export default ForgotPasswordPage;
