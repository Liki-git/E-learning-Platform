import { useEffect, useRef, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import Toast from "../../components/Toast";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { resolveMediaUrl } from "../../utils/mediaUrl";

const SettingsPage = () => {
  const { user, updateUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const fileRef = useRef(null);
  const [form, setForm] = useState({ fullName: "", email: "", username: "", bio: "", profilePic: "" });
  const [pwdStep, setPwdStep] = useState("idle");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [toast, setToast] = useState("");
  const [err, setErr] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    api.get("/profile").then(({ data }) => {
      setForm({
        fullName: data.user.fullName,
        email: data.user.email,
        username: data.user.username,
        bio: data.user.bio || "",
        profilePic: data.user.profilePic || "",
      });
      if (data.user.themePreference) setTheme(data.user.themePreference);
    });
  }, [setTheme]);

  const saveProfile = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      const { data } = await api.patch("/profile", { ...form, themePreference: theme });
      updateUser(data.user);
      setToast("Profile saved successfully");
    } catch (error) {
      setErr(error.response?.data?.message || "Save failed");
    }
  };

  const handleThemeChange = async (value) => {
    setTheme(value, true);
    updateUser({ themePreference: value });
    try {
      await api.patch("/profile", { themePreference: value });
      setToast(`${value === "dark" ? "Dark" : "Light"} mode applied`);
    } catch {
      /* local theme still applied */
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setErr("");
    try {
      const body = new FormData();
      body.append("file", file);
      const { data } = await api.post("/uploads", body, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = data.url;
      setForm((prev) => ({ ...prev, profilePic: url }));
      const { data: profileData } = await api.patch("/profile", { profilePic: url });
      updateUser(profileData.user);
      setToast("Profile picture updated");
    } catch (error) {
      setErr(error.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const sendPasswordOtp = async () => {
    setErr("");
    try {
      await api.post("/profile/password/send-otp");
      setPwdStep("otp");
      setToast("OTP sent to your email");
    } catch (error) {
      setErr(error.response?.data?.message || "Failed to send OTP");
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    setErr("");
    if (newPassword !== confirmPassword) {
      setErr("Passwords do not match");
      return;
    }
    try {
      await api.patch("/profile/password/reset", {
        otp,
        password: newPassword,
        confirmPassword,
      });
      setToast("Password updated successfully");
      setPwdStep("idle");
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setErr(error.response?.data?.message || "Password update failed");
    }
  };

  const avatar =
    resolveMediaUrl(form.profilePic) ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(form.fullName || user?.fullName || "U")}&background=2e7d32&color=fff`;

  return (
    <DashboardLayout title="Settings" subtitle="Manage your account and profile">
      <Toast message={toast} onClose={() => setToast("")} />
      {err && <p className="error-msg">{err}</p>}

      <form className="settings-form" onSubmit={saveProfile}>
        <h3>Profile</h3>
        <div className="settings-avatar-row">
          <img src={avatar} alt="Profile" className="settings-avatar" />
          <div>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleAvatarUpload} />
            <button type="button" className="btn btn--outline btn--sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? "Uploading..." : "Upload photo"}
            </button>
            <p className="settings-hint">JPG or PNG, max 50MB</p>
          </div>
        </div>
        <label>Full name<input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></label>
        <label>Email<input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
        <label>Username<input required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></label>
        <label>Bio<textarea rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></label>
        <button type="submit" className="btn btn--primary">Save profile</button>
      </form>

      <form className="settings-form" onSubmit={(e) => e.preventDefault()}>
        <h3>Appearance</h3>
        <div className="theme-settings">
          <label className={`theme-option${theme === "light" ? " active" : ""}`}>
            <input type="radio" name="theme" value="light" checked={theme === "light"} onChange={() => handleThemeChange("light")} />
            Light mode
          </label>
          <label className={`theme-option${theme === "dark" ? " active" : ""}`}>
            <input type="radio" name="theme" value="dark" checked={theme === "dark"} onChange={() => handleThemeChange("dark")} />
            Dark mode
          </label>
        </div>
      </form>

      <form className="settings-form" onSubmit={resetPassword}>
        <h3>Change password</h3>
        <p className="settings-hint">We will send a one-time code to your email, just like forgot password.</p>
        {pwdStep === "idle" ? (
          <button type="button" className="btn btn--outline" onClick={sendPasswordOtp}>
            Send OTP to {user?.email}
          </button>
        ) : (
          <>
            <label>OTP from email<input required value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="6-digit code" maxLength={6} /></label>
            <label>New password<input type="password" required minLength={6} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /></label>
            <label>Confirm new password<input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} /></label>
            <div className="settings-form__actions">
              <button type="submit" className="btn btn--primary">Update password</button>
              <button type="button" className="btn btn--outline" onClick={sendPasswordOtp}>Resend OTP</button>
            </div>
          </>
        )}
      </form>
    </DashboardLayout>
  );
};

export default SettingsPage;
