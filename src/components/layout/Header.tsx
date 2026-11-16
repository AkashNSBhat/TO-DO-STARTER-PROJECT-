import React, { useEffect, useRef } from "react";
import { Search, Calendar, Moon, Sun, ShieldCheck, Settings } from "lucide-react";
import { NavTab } from "./Sidebar";
import { Theme } from "../../hooks/useTheme";

interface HeaderProps {
  currentTab: NavTab;
  theme: Theme;
  onToggleTheme: () => void;
  onOpenSettings: () => void;
}

const TAB_TITLES: Record<NavTab, { title: string; subtitle: string }> = {
  dashboard: { title: "Home Dashboard", subtitle: "Daily overview and system telemetry" },
  tasks: { title: "Daily Tasks", subtitle: "Active task queue and daily goals" },
  movies: { title: "Movie Tracker", subtitle: "Planned, watching, and completed films" },
  series: { title: "Series Tracker", subtitle: "Episodic season tracking and progress" },
  archive: { title: "Entertainment Archive", subtitle: "Permanent archive of completed media" },
  plan: { title: "PLAN Module", subtitle: "Weekly, monthly, and yearly horizon planning" },
  activity: { title: "Activity History", subtitle: "Chronological completion timeline" },
  statistics: { title: "Statistics & Insights", subtitle: "Calculated productivity and media analytics" },
  settings: { title: "System Settings", subtitle: "Local storage preferences and backup management" },
};

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  theme,
  onToggleTheme,
  onOpenSettings,
}) => {
  const tabInfo = TAB_TITLES[currentTab] || { title: "DAYMARK", subtitle: "" };
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Full date format: "Monday, November 16, 2026"
  const todayFormatted = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  // Global Ctrl+K / Cmd+K visual shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <header className="h-16 bg-white/80 dark:bg-charcoal-900/80 backdrop-blur-md border-b border-slate-200 dark:border-charcoal-600 px-6 flex items-center justify-between z-10 shrink-0 transition-colors">
      {/* Active Page Title & Breadcrumb */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            DAYMARK /
          </span>
          <h1 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            {tabInfo.title}
          </h1>
          <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
            Phase 1
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">{tabInfo.subtitle}</p>
      </div>

      {/* Center Search Bar with Visual Ctrl+K Hint */}
      <div className="flex-1 max-w-md mx-6">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search tasks, movies, series, or plans..."
            className="w-full bg-slate-100 dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-600 rounded-lg pl-9 pr-16 py-1.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-teal-500 dark:focus:border-teal-500 transition-colors"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 pointer-events-none">
            <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-charcoal-700 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-charcoal-600 shadow-xs">
              Ctrl
            </kbd>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">+</span>
            <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-charcoal-700 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-charcoal-600 shadow-xs">
              K
            </kbd>
          </div>
        </div>
      </div>

      {/* Right Controls: Date, Offline Badge, Theme, Settings */}
      <div className="flex items-center gap-3">
        {/* Date Display */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-600 text-xs text-slate-700 dark:text-slate-300">
          <Calendar className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
          <span>{todayFormatted}</span>
        </div>

        {/* Offline-First Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Offline First</span>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="p-2 rounded-lg bg-slate-100 dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-600 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-charcoal-700 transition-colors cursor-pointer"
          title={`Switch to ${theme === "dark" ? "Light" : "Dark"} theme`}
          aria-label={`Switch to ${theme === "dark" ? "Light" : "Dark"} theme`}
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4 text-amber-400 transition-transform hover:rotate-45" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700 transition-transform hover:-rotate-12" />
          )}
        </button>

        {/* Settings Shortcut */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-lg bg-slate-100 dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-600 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-charcoal-700 transition-colors cursor-pointer"
          title="Open Settings"
          aria-label="Open Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
