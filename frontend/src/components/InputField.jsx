import { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";

const InputField = ({
  label,
  type = "text",
  icon,
  placeholder,
  value,
  onChange,
  name,
  required = false,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;

  return (
    <div className="field-group">
      {label && <label className="field-label">{label}</label>}
      <div className="field-input-wrap">
        {icon && <span className="field-icon">{icon}</span>}
        <input
          className="field-input"
          type={inputType}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
        />
        {isPassword && (
          <button
            type="button"
            className="field-toggle"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <FiEyeOff size={20} aria-hidden="true" /> : <FiEye size={20} aria-hidden="true" />}
          </button>
        )}
      </div>
    </div>
  );
};

export default InputField;
