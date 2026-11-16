import React from "react";
import {
  Home,
  CheckSquare,
  Film,
  Tv,
  Archive,
  CalendarRange,
  History,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Database,
} from "lucide-react";
import { cn } from "../../lib/utils";

export type NavTab =
  | "dashboard"
  | "tasks"
  | "movies"
  | "series"
  | "archive"
  | "plan"
  | "activity"
  | "statistics"
  | "settings";

interface NavItem {
  id: NavTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Home Dashboard", icon: Home },
  { id: "tasks", label: "Daily Tasks", icon: CheckSquare },
  { id: "movies", label: "Movies", icon: Film },
  { id: "series", label: "Series", icon: Tv },
  { id: "archive", label: "Entertainment Archive", icon: Archive },
  { id: "plan", label: "PLAN Module", icon: CalendarRange, badge: "Horizon" },
  { id: "activity", label: "Activity History", icon: History },
  { id: "statistics", label: "Statistics", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  dbConnected: boolean;
  dbPingMs?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
  dbConnected,
  dbPingMs,
}) => {
  return (
    <aside
      className={cn(
        "h-screen bg-slate-50 dark:bg-charcoal-900 border-r border-slate-200 dark:border-charcoal-600 flex flex-col justify-between transition-all duration-200 select-none z-20 shrink-0",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Brand Header */}
      <div>
        <div
          className={cn(
            "h-16 flex items-center border-b border-slate-200 dark:border-charcoal-600 transition-colors",
            collapsed ? "justify-center px-2" : "justify-between px-4"
          )}
        >
          {collapsed ? (
            <button
              onClick={onToggleCollapse}
              className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-sm text-charcoal-950 font-bold text-sm hover:opacity-90 group relative cursor-pointer"
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <span className="group-hover:hidden">DM</span>
              <ChevronRight className="w-5 h-5 hidden group-hover:block text-charcoal-950" />
            </button>
          ) : (
            <>
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shrink-0 shadow-sm text-charcoal-950 font-bold text-sm">
                  DM
                </div>
                <div className="flex flex-col truncate">
                  <span className="font-bold text-slate-900 dark:text-slate-100 tracking-wide text-sm font-sans">
                    DAYMARK
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    Every completion stays
                  </span>
                </div>
              </div>
              <button
                onClick={onToggleCollapse}
                className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-charcoal-800 transition-colors cursor-pointer"
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="p-2 space-y-1 mt-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <div key={item.id} className="relative group">
                <button
                  onClick={() => onSelectTab(item.id)}
                  title={item.label}
                  aria-label={item.label}
                  className={cn(
                    "w-full flex items-center rounded-lg text-sm font-medium transition-all cursor-pointer",
                    collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2",
                    isActive
                      ? "bg-teal-500/10 dark:bg-charcoal-800 text-teal-600 dark:text-teal-400 font-semibold shadow-inner border-l-2 border-teal-500"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-charcoal-800/60"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-4 h-4 shrink-0 transition-transform group-hover:scale-105",
                      isActive ? "text-teal-600 dark:text-teal-400" : "text-slate-500 dark:text-slate-400"
                    )}
                  />
                  {!collapsed && <span className="truncate flex-1 text-left">{item.label}</span>}
                  {!collapsed && item.badge && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                      {item.badge}
                    </span>
                  )}
                </button>

                {/* Desktop Hover Tooltip in Collapsed Mode */}
                {collapsed && (
                  <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-md bg-slate-900 dark:bg-charcoal-800 text-slate-100 text-xs font-medium border border-slate-700 dark:border-charcoal-600 shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap flex items-center gap-1.5">
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-teal-500/20 text-teal-300 font-semibold">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Database Status / Footer */}
      <div className="p-3 border-t border-slate-200 dark:border-charcoal-600">
        <div
          className={cn(
            "flex items-center gap-2 p-2 rounded-lg bg-slate-100 dark:bg-charcoal-850 border border-slate-200 dark:border-charcoal-600/70 text-xs",
            collapsed ? "justify-center" : "justify-between"
          )}
          title={`SQLite WAL: ${dbConnected ? "Connected" : "Disconnected"}${
            dbPingMs !== undefined ? ` (${dbPingMs}ms)` : ""
          }`}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="relative flex h-2 w-2 shrink-0">
              {dbConnected && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span
                className={cn(
                  "relative inline-flex rounded-full h-2 w-2",
                  dbConnected ? "bg-emerald-500" : "bg-rose-500"
                )}
              ></span>
            </span>
            {!collapsed && (
              <span className="truncate text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1.5">
                <Database className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                SQLite Local
              </span>
            )}
          </div>
          {!collapsed && dbPingMs !== undefined && (
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{dbPingMs}ms</span>
          )}
        </div>
      </div>
    </aside>
  );
};
