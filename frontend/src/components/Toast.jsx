import { useEffect } from "react";
import { FiCheckCircle, FiX } from "react-icons/fi";

const Toast = ({ message, type = "success", onClose, duration = 3500 }) => {
  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  return (
    <div className={`toast toast--${type}`} role="status">
      <FiCheckCircle size={20} aria-hidden="true" />
      <span>{message}</span>
      <button type="button" className="toast__close" onClick={onClose} aria-label="Close">
        <FiX size={16} />
      </button>
    </div>
  );
};

export default Toast;
