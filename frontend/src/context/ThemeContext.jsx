import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/client";

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => localStorage.getItem("theme") || "light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const setTheme = async (next, persist = false) => {
    setThemeState(next);
    if (persist && localStorage.getItem("token")) {
      try {
        await api.patch("/profile", { themePreference: next });
      } catch {
        /* keep local theme */
      }
    }
  };

  const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light");

  const syncThemeFromUser = (userTheme) => {
    if (userTheme && userTheme !== theme) {
      setThemeState(userTheme);
    }
  };

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme, syncThemeFromUser, isDark: theme === "dark" }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};
