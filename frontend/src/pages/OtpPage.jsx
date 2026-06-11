import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FiLock, FiMail } from "react-icons/fi";
import ForgotPasswordSide from "../components/ForgotPasswordSide";
import InputField from "../components/InputField";
import PageShell from "../components/PageShell";
import ThemeToggle from "../components/ThemeToggle";
import api from "../api/client";

const OtpPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || "";
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      setLoading(true);
      await api.post("/auth/verify-otp", { email, otp });
      navigate("/reset-password", { state: { email, otp } });
    } catch (err) {
      setError(err.response?.data?.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    setError("");
    try {
      setResending(true);
      await api.post("/auth/forgot-password", { email });
    } catch (err) {
      setError(err.response?.data?.message || "Resend failed");
    } finally {
      setResending(false);
    }
  };

  return (
    <PageShell className="page-shell--auth">
      <ThemeToggle className="theme-toggle--floating theme-toggle--bottom-right" />
      <main className="page forgot-page">
      <ForgotPasswordSide index={1} />
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
              label="Enter OTP"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              icon={<FiMail size={18} aria-hidden="true" />}
              required
            />
            <p className="otp-info">OTP has been sent to <strong>{email || "your email"}</strong>.</p>
            {error && <p className="error-msg">{error}</p>}
            {otp.trim().length > 0 ? (
              <button type="submit" className="btn btn--primary btn--full" disabled={loading || otp.trim().length < 6}>
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
            ) : (
              <>
                <p className="otp-resend-text">Not received?</p>
                <button type="button" className="btn btn--primary btn--full" onClick={resendOtp} disabled={resending || !email}>
                  {resending ? "Sending..." : "Resend OTP"}
                </button>
              </>
            )}
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

export default OtpPage;
