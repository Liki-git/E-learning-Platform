import { FiUser, FiBookOpen, FiShield } from "react-icons/fi";

const roles = [
  {
    id: "student",
    label: "Student",
    icon: <FiUser aria-hidden="true" />,
  },
  {
    id: "instructor",
    label: "Instructor",
    icon: <FiBookOpen aria-hidden="true" />,
  },
  {
    id: "admin",
    label: "Admin",
    icon: <FiShield aria-hidden="true" />,
  },
];

const RoleSelector = ({ role, onChange }) => (
  <div className="role-picker">
    {roles.map((item) => (
      <button
        key={item.id}
        type="button"
        className={`role-btn${role === item.id ? " active" : ""}`}
        onClick={() => onChange(item.id)}
      >
        <span className="role-btn__icon">{item.icon}</span>
        <span>{item.label}</span>
      </button>
    ))}
  </div>
);

export default RoleSelector;
