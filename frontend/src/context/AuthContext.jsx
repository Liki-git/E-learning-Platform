import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/client";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    api.get("/profile")
      .then(({ data }) => {
        const fresh = data.user;
        localStorage.setItem("user", JSON.stringify(fresh));
        setUser(fresh);
        if (fresh.themePreference) {
          localStorage.setItem("theme", fresh.themePreference);
          document.documentElement.setAttribute("data-theme", fresh.themePreference);
        }
      })
      .catch(() => {});
  }, []);

  const login = (payload) => {
    localStorage.setItem("token", payload.token);
    localStorage.setItem("user", JSON.stringify(payload.user));
    setUser(payload.user);
    if (payload.user?.themePreference) {
      localStorage.setItem("theme", payload.user.themePreference);
      document.documentElement.setAttribute("data-theme", payload.user.themePreference);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const updateUser = (userData) => {
    const updated = { ...user, ...userData };
    localStorage.setItem("user", JSON.stringify(updated));
    setUser(updated);
    if (userData.themePreference) {
      localStorage.setItem("theme", userData.themePreference);
      document.documentElement.setAttribute("data-theme", userData.themePreference);
    }
  };

  const value = useMemo(() => ({ user, login, logout, updateUser }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
};
