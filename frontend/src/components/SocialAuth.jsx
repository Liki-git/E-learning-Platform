import { GoogleLogin } from "@react-oauth/google";

const SocialAuth = ({ label, onGoogleSuccess, onGoogleError }) => (
  <div className="social-auth">
    <div className="social-auth__divider">
      <span>{label}</span>
    </div>
    <div className="social-auth__google">
      <GoogleLogin
        onSuccess={onGoogleSuccess}
        onError={onGoogleError}
        width="100%"
        theme="outline"
        size="large"
        text="continue_with"
      />
    </div>
  </div>
);

export default SocialAuth;
