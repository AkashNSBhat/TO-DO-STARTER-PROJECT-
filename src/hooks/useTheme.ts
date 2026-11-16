import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";

export type Theme = "dark" | "light";

const THEME_STORAGE_KEY = "daymark_theme";

/**
 * Resolves the initial theme using the priority:
 * 1. localStorage ("daymark_theme")
 * 2. System preference via window.matchMedia
 * 3. Default fallback to "dark"
 */
function getInitialTheme(): Theme {
  if (typeof window === "undefined") {
    return "dark";
  }

  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === "dark" || saved === "light") {
      return saved;
    }

    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) {
      return "light";
    }
  } catch (err) {
    console.warn("[DAYMARK] Could not access localStorage or matchMedia:", err);
  }

  return "dark";
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  // Apply theme to document element and persist to storage
  useEffect(() => {
    const root = document.documentElement;

    if (theme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
      root.style.colorScheme = "dark";
    } else {
      root.classList.remove("dark");
      root.classList.add("light");
      root.style.colorScheme = "light";
    }

    // Persist synchronously to localStorage
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (err) {
      console.warn("[DAYMARK] Failed to save theme in localStorage:", err);
    }

    // Persist asynchronously to SQLite app_settings if running in native Tauri
    const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
    if (isTauri) {
      invoke("set_app_setting", { key: "theme", value: theme }).catch(() => {
        // Silently catch if command is not yet registered in M1
      });
    }
  }, [theme]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  return { theme, toggleTheme, setTheme };
}
