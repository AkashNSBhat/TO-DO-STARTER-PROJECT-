import React from "react";
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
  const todayFormatted = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  return (
    <header className="h-16 bg-charcoal-900/80 backdrop-blur-md border-b border-charcoal-600 px-6 flex items-center justify-between z-10 shrink-0">
      {/* Title & Subtitle */}
      <div>
        <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          {tabInfo.title}
          <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full bg-sage-500/10 text-sage-400 border border-sage-500/20">
            Phase 0
          </span>
        </h1>
        <p className="text-xs text-slate-400">{tabInfo.subtitle}</p>
      </div>

      {/* Center Search Bar */}
      <div className="flex-1 max-w-md mx-6">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tasks, movies, series, or plans... (Ctrl+K)"
            className="w-full bg-charcoal-800 border border-charcoal-600 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-sage-500 transition-colors"
          />
        </div>
      </div>

      {/* Right Controls: Date, Offline Badge, Theme, Settings */}
      <div className="flex items-center gap-3">
        {/* Date Display */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-charcoal-800 border border-charcoal-600 text-xs text-slate-300">
          <Calendar className="w-3.5 h-3.5 text-sage-400" />
          <span>{todayFormatted}</span>
        </div>

        {/* Offline-First Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-medium">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Offline First</span>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="p-2 rounded-lg bg-charcoal-800 border border-charcoal-600 text-slate-300 hover:text-slate-100 hover:border-charcoal-500 transition-colors"
          title={`Switch to ${theme === "dark" ? "Light" : "Dark"} theme`}
        >
          {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-300" />}
        </button>

        {/* Settings Shortcut */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-lg bg-charcoal-800 border border-charcoal-600 text-slate-300 hover:text-slate-100 hover:border-charcoal-500 transition-colors"
          title="Open Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
