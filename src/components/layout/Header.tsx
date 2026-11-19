import React, { useEffect, useRef } from "react";
import { Search, Bell, Moon, Sun, Settings } from "lucide-react";
import { NavTab } from "./Sidebar";
import { Theme } from "../../hooks/useTheme";
import { useSettings } from "../../hooks/useSettings";

interface HeaderProps {
  currentTab: NavTab;
  theme: Theme;
  onToggleTheme: () => void;
  onOpenSettings: () => void;
}

const TAB_TITLES: Record<NavTab, { title: string; subtitle: string }> = {
  dashboard: { title: "Dashboard", subtitle: "Overview and personal productivity analytics" },
  tasks: { title: "Daily Tasks", subtitle: "Active task queue and daily goals" },
  discover: { title: "Discover Catalogue", subtitle: "Search and explore global movies and web series" },
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
  const { settings } = useSettings();
  const userName = settings?.user_name || "Vincent";
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Formatted date badge matching screenshot: "18 Nov 2026"
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date());

  // Global Ctrl+K / Cmd+K listener
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
    <header className="h-16 bg-white dark:bg-[#131518] border-b border-slate-200/80 dark:border-[#22252c] px-6 flex items-center justify-between z-10 shrink-0 transition-colors">
      {/* Left: Personalized Greeting (Exact Figma style) */}
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 tracking-tight">
            <span>Welcome back, {userName}</span>
            <span className="text-lg">👋</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {TAB_TITLES[currentTab]?.subtitle || "Every day counts. Every completion stays."}
          </p>
        </div>
      </div>

      {/* Center Search Bar with Visual Ctrl+K Hint */}
      <div className="flex-1 max-w-sm mx-6 hidden md:block">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search anything..."
            className="w-full bg-slate-100 dark:bg-[#1b1d22] border border-slate-200/80 dark:border-[#2a2d35] rounded-xl pl-9 pr-14 py-1.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 transition-colors"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 pointer-events-none">
            <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-[#252830] text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
              Ctrl K
            </kbd>
          </div>
        </div>
      </div>

      {/* Right Controls: Notifications, Date Pill, Theme, Profile Avatar */}
      <div className="flex items-center gap-3">
        {/* Date Pill (Figma style) */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-[#1f2228] border border-slate-200/80 dark:border-[#2c3038] text-xs font-medium text-slate-600 dark:text-slate-300">
          <span>{formattedDate}</span>
        </div>

        {/* Notification Bell */}
        <button
          className="relative w-8 h-8 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1f2228] transition-colors cursor-pointer"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500" />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1f2228] transition-colors cursor-pointer"
          title={`Switch to ${theme === "dark" ? "Light" : "Dark"} theme`}
          aria-label={`Switch to ${theme === "dark" ? "Light" : "Dark"} theme`}
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700" />
          )}
        </button>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1f2228] transition-colors cursor-pointer"
          title="Open Settings"
          aria-label="Open Settings"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* User Avatar Circle */}
        <div
          onClick={onOpenSettings}
          className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-xs shadow-sm cursor-pointer hover:ring-2 hover:ring-blue-500/50 transition-all shrink-0 ml-1"
          title={`Signed in as ${userName}`}
        >
          {userName.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
};
