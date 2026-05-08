import { useEffect, useState } from "react";
import styles from "./ThemeToggle.module.scss";

const THEME_KEY = "isciz-theme";

const SunIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </svg>
);

const MoonIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

/**
 * Segmented sun/moon theme toggle. The initial theme is applied synchronously
 * by an inline script in root.jsx (`themeBootstrap`) so there's no flash.
 */
const ThemeToggle = () => {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    if (typeof document === "undefined") return;
    setTheme(document.documentElement.classList.contains("theme-dark") ? "dark" : "light");
  }, []);

  const setThemeTo = (next) => {
    if (next === theme) return;
    setTheme(next);
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("theme-dark", next === "dark");
    }
    if (typeof window !== "undefined") {
      try { window.localStorage.setItem(THEME_KEY, next); } catch { /* ignore */ }
    }
  };

  return (
    <div className={styles.group} role="group" aria-label="Theme">
      <button
        type="button"
        className={`${styles.option} ${theme === "light" ? styles.optionActive : ""}`}
        onClick={() => setThemeTo("light")}
        aria-label="Use light theme"
        aria-pressed={theme === "light"}
      >
        <SunIcon />
      </button>
      <button
        type="button"
        className={`${styles.option} ${theme === "dark" ? styles.optionActive : ""}`}
        onClick={() => setThemeTo("dark")}
        aria-label="Use dark theme"
        aria-pressed={theme === "dark"}
      >
        <MoonIcon />
      </button>
    </div>
  );
};

export default ThemeToggle;
