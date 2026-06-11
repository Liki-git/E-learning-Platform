import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const RoleRoute = ({ children, roles }) => {
  const token = localStorage.getItem("token");
  const { user } = useAuth();

  if (!token) return <Navigate to="/login" replace />;
  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/home" replace />;
  }
  return children;
};

export default RoleRoute;
