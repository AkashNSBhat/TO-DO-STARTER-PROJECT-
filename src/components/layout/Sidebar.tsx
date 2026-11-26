import React, { useState, useEffect } from "react";
import {
  LayoutGrid,
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
  Box,
  Plus,
  ChevronDown,
  Compass,
  CalendarClock,
  Flame,
  Clapperboard,
  Zap,
  PlayCircle,
  Sparkles,
} from "lucide-react";
import { cn } from "../../lib/utils";

export type NavTab =
  | "dashboard"
  | "tasks"
  | "discover"
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
  { id: "dashboard", label: "Dashboard", icon: LayoutGrid },
  { id: "tasks", label: "Daily Tasks", icon: CheckSquare, badge: "11" },
  { id: "discover", label: "Discover", icon: Compass, badge: "New" },
  { id: "movies", label: "Movies", icon: Film },
  { id: "series", label: "Series", icon: Tv },
  { id: "archive", label: "Archive", icon: Archive },
  { id: "plan", label: "PLAN", icon: CalendarRange, badge: "Horizon" },
  { id: "activity", label: "Activity", icon: History },
  { id: "statistics", label: "Statistics", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
];

// Sub-items for the secondary drawer
const DRAWER_SECTIONS: Record<
  NavTab,
  {
    title: string;
    groups: Array<{
      title?: string;
      items: Array<{
        label: string;
        count?: string | number;
        active?: boolean;
        subtitle?: string;
        icon?: React.ComponentType<{ className?: string }>;
        targetTab?: NavTab;
      }>;
    }>;
  }
> = {
  dashboard: {
    title: "Overview",
    groups: [
      {
        title: "Workspace",
        items: [
          {
            label: "Today's Agenda",
            count: 6,
            active: true,
            subtitle: "6 items scheduled • 2 due soon",
            icon: CalendarClock,
            targetTab: "plan",
          },
          {
            label: "Habit Streak",
            count: "14d",
            subtitle: "14-day active streak • Best run",
            icon: Flame,
            targetTab: "statistics",
          },
          {
            label: "Media Progress",
            count: 3,
            subtitle: "3 active • 2 series, 1 movie",
            icon: Clapperboard,
            targetTab: "series",
          },
        ],
      },
      {
        title: "Quick Access",
        items: [
          {
            label: "Priority Tasks",
            count: 2,
            subtitle: "2 high-priority tasks pending",
            icon: Zap,
            targetTab: "tasks",
          },
          {
            label: "Watching Next",
            count: 1,
            subtitle: "1 title queued in watchlist",
            icon: PlayCircle,
            targetTab: "discover",
          },
        ],
      },
    ],
  },
  tasks: {
    title: "Projects",
    groups: [
      {
        title: "Projects",
        items: [
          { label: "All projects", count: 3 },
          { label: "Design system", count: 4, active: true },
          { label: "User flow", count: 2 },
          { label: "Ux research", count: 3 },
        ],
      },
      {
        title: "Tasks",
        items: [
          { label: "All tasks", count: 11 },
          { label: "To do", count: 4 },
          { label: "In progress", count: 4, active: true },
          { label: "Done", count: 3 },
        ],
      },
      {
        title: "Smart Views",
        items: [
          { label: "Upcoming", count: 5 },
          { label: "Overdue", count: 0 },
        ],
      },
    ],
  },
  discover: {
    title: "Discover Catalogue",
    groups: [
      {
        title: "Media Categories",
        items: [
          { label: "Movies Catalogue", count: "5,000+", active: true },
          { label: "Series & Shows", count: "5,000+" },
        ],
      },
      {
        title: "Languages",
        items: [
          { label: "English", count: "Global" },
          { label: "Hindi (हिंदी)", count: "Popular" },
          { label: "Kannada (ಕನ್ನಡ)", count: "Regional" },
          { label: "German (Deutsch)", count: "European" },
        ],
      },
    ],
  },
  movies: {
    title: "Movies",
    groups: [
      {
        title: "Status",
        items: [
          { label: "All Movies", count: 24 },
          { label: "Watching", count: 2, active: true },
          { label: "Planned", count: 4 },
          { label: "Completed", count: 18 },
        ],
      },
      {
        title: "Genres",
        items: [
          { label: "Sci-Fi", count: 8 },
          { label: "Drama", count: 6 },
          { label: "Action", count: 5 },
        ],
      },
    ],
  },
  series: {
    title: "Series",
    groups: [
      {
        title: "Status",
        items: [
          { label: "Currently Watching", count: 3, active: true },
          { label: "Plan to Watch", count: 2 },
          { label: "Completed", count: 2 },
        ],
      },
      {
        title: "Seasons",
        items: [
          { label: "Severance S2", count: "8/10" },
          { label: "Shogun S1", count: "6/10" },
        ],
      },
    ],
  },
  archive: {
    title: "Archive",
    groups: [
      {
        title: "Ledger",
        items: [
          { label: "All Completed", count: 20, active: true },
          { label: "Movies Archive", count: 18 },
          { label: "Series Archive", count: 2 },
        ],
      },
      {
        title: "Timeline",
        items: [
          { label: "2026 Watched", count: 12 },
          { label: "Historical Records", count: 8 },
        ],
      },
    ],
  },
  plan: {
    title: "Planning",
    groups: [
      {
        title: "Horizons",
        items: [
          { label: "Weekly Cycle", count: "W47", active: true },
          { label: "Monthly Goals", count: "Nov" },
          { label: "2026 Roadmap", count: "Year" },
        ],
      },
      {
        title: "Categories",
        items: [
          { label: "Projects", count: 5 },
          { label: "Learning", count: 2 },
          { label: "Entertainment", count: 3 },
        ],
      },
    ],
  },
  activity: {
    title: "Activity",
    groups: [
      {
        title: "Feed Filter",
        items: [
          { label: "All Completions", count: 50, active: true },
          { label: "Daily Tasks", count: 42 },
          { label: "Entertainment", count: 8 },
        ],
      },
    ],
  },
  statistics: {
    title: "Analytics",
    groups: [
      {
        title: "Metrics",
        items: [
          { label: "Productivity", active: true },
          { label: "Entertainment", count: "142h" },
          { label: "90-Day Heatmap" },
        ],
      },
    ],
  },
  settings: {
    title: "Preferences",
    groups: [
      {
        title: "System",
        items: [
          { label: "Appearance", active: true },
          { label: "Productivity Targets" },
          { label: "Backup & Restore" },
          { label: "Database Health" },
        ],
      },
    ],
  },
};

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
  const [activeSubItem, setActiveSubItem] = useState<string>("Today's Agenda");
  const [hoveredItemIndex, setHoveredItemIndex] = useState<number | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const drawerData = DRAWER_SECTIONS[currentTab];

  const toggleGroup = (groupKey: string) => {
    setHoveredItemIndex(null);
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };

  useEffect(() => {
    setHoveredItemIndex(null);
  }, [currentTab]);

  return (
    <div className="flex h-screen select-none z-20 shrink-0">
      {/* ========================================================= */}
      {/* 1. SLIM LEFT ICON RAIL (Clean Google/Enterprise Style)    */}
      {/* ========================================================= */}
      <aside className="w-16 h-screen bg-white dark:bg-[#16181d] border-r border-slate-200 dark:border-[#262932] flex flex-col items-center justify-between py-4 shrink-0 transition-colors">
        {/* App Cube Logo */}
        <div className="flex flex-col items-center gap-6">
          <div
            onClick={() => onSelectTab("dashboard")}
            className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 flex items-center justify-center text-white shadow-sm cursor-pointer hover:scale-105 active:scale-95 transition-all"
            title="DAYMARK — Every day counts"
          >
            <Box className="w-5 h-5 text-white" />
          </div>

          {/* Icon Navigation Dock */}
          <nav className="flex flex-col items-center gap-2">
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
                      "w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-150 cursor-pointer relative",
                      isActive
                        ? "bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400"
                        : "text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-[#22252e]"
                    )}
                  >
                    <Icon className="w-5 h-5 shrink-0 transition-transform duration-150 ease-out group-hover:scale-[1.12]" />
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-600 dark:bg-blue-400 rounded-r-full" />
                    )}
                  </button>

                  {/* Tooltip on hover */}
                  <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-md bg-slate-900 dark:bg-[#262932] text-white text-xs font-medium border border-slate-800 dark:border-[#343844] shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                    {item.label}
                  </div>
                </div>
              );
            })}
          </nav>
        </div>

        {/* Bottom Status / Toggle */}
        <div className="flex flex-col items-center gap-3">
          {/* SQLite Dot */}
          <div
            className="w-3 h-3 rounded-full flex items-center justify-center relative cursor-help"
            title={`SQLite WAL: ${dbConnected ? "Connected" : "Disconnected"}${
              dbPingMs !== undefined ? ` (${dbPingMs}ms)` : ""
            }`}
          >
            <span
              className={cn(
                "relative inline-flex rounded-full h-2 w-2",
                dbConnected ? "bg-emerald-500" : "bg-rose-500"
              )}
            ></span>
          </div>

          {/* Drawer Expand/Collapse Button */}
          <button
            onClick={onToggleCollapse}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-[#22252e] hover:scale-105 transition-all cursor-pointer"
            title={collapsed ? "Expand drawer" : "Collapse drawer"}
            aria-label="Toggle sidebar drawer"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* 2. CONTEXTUAL DRAWER (Clean Enterprise Expandable Column) */}
      {/* ========================================================= */}
      {!collapsed && (() => {
        let runningFlatIndex = 0;

        return (
          <aside
            onMouseLeave={() => setHoveredItemIndex(null)}
            className="relative w-60 h-screen bg-[#fafafa] dark:bg-[#1b1d22] border-r border-slate-200 dark:border-[#262932] flex flex-col justify-between transition-colors duration-200 shrink-0 overflow-hidden z-20"
          >
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 space-y-5">
              {/* Top Drawer Title with Action */}
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/80 dark:border-[#262932]">
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
                  {drawerData.title}
                </h2>
                <button
                  onClick={() => onSelectTab("tasks")}
                  className="w-7 h-7 rounded-lg bg-white dark:bg-[#242730] border border-slate-200 dark:border-[#343844] hover:border-blue-600 dark:hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 text-slate-500 dark:text-slate-400 flex items-center justify-center text-xs transition-colors cursor-pointer"
                  title="Quick Add"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Contained Wave-Reactive Navigation Groups */}
              <div className="space-y-4">
                {drawerData.groups.map((group, gIdx) => {
                  const groupKey = `${currentTab}:${group.title || gIdx}`;
                  const isGroupCollapsed = !!collapsedGroups[groupKey];

                  return (
                    <div key={gIdx} className="space-y-1">
                      {group.title && (
                        <button
                          type="button"
                          onClick={() => toggleGroup(groupKey)}
                          aria-expanded={!isGroupCollapsed}
                          className="w-full flex items-center justify-between px-2 py-1 rounded-lg text-[10px] font-semibold text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-slate-800/40 uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          <span>{group.title}</span>
                          <ChevronDown
                            className={cn(
                              "w-3.5 h-3.5 text-slate-400 transition-transform duration-200",
                              isGroupCollapsed && "-rotate-90"
                            )}
                          />
                        </button>
                      )}

                      <div
                        className={cn(
                          "space-y-1 relative overflow-hidden transition-all duration-300 ease-out",
                          isGroupCollapsed
                            ? "max-h-0 opacity-0 pointer-events-none"
                            : "max-h-[600px] opacity-100"
                        )}
                      >
                        {group.items.map((it, idx) => {
                          const flatIdx = runningFlatIndex++;
                        const isSelected =
                          activeSubItem === it.label || (!activeSubItem && it.active);
                        const distance =
                          hoveredItemIndex !== null
                            ? Math.abs(flatIdx - hoveredItemIndex)
                            : null;
                          const isHovered = distance === 0;
                          const isNearWave = distance === 1;
                          const ItemIcon = it.icon || Sparkles;

                        const expandedSubtitle =
                          it.subtitle ||
                          (it.count !== undefined
                            ? `${it.count} items • Click to open`
                            : "Click to open");

                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setActiveSubItem(it.label);
                              if (it.targetTab) {
                                onSelectTab(it.targetTab);
                              }
                            }}
                            onMouseEnter={() => setHoveredItemIndex(flatIdx)}
                            className={cn(
                              "w-full flex flex-col rounded-lg relative overflow-hidden cursor-pointer text-left transition-all duration-200 ease-out",
                              isHovered
                                ? "py-2.5 px-3 bg-white dark:bg-[#242730] border border-slate-200 dark:border-[#343844] shadow-sm"
                                : isNearWave
                                  ? "py-1.5 px-2.5 pl-3 bg-slate-100/80 dark:bg-[#20232b] text-slate-800 dark:text-slate-100"
                                  : isSelected
                                    ? "py-1.5 px-2.5 bg-blue-50/80 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                    : "py-1.5 px-2.5 text-slate-600 dark:text-slate-400"
                            )}
                          >
                            <div className="w-full flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span
                                  className={cn(
                                    "rounded-md flex items-center justify-center shrink-0 transition-all duration-200",
                                    isHovered
                                      ? "w-7 h-7 bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400"
                                      : isSelected
                                        ? "w-5 h-5 text-blue-600 dark:text-blue-400"
                                        : "w-5 h-5 text-slate-400 dark:text-slate-500"
                                  )}
                                >
                                  <ItemIcon
                                    className={cn(
                                      "transition-all duration-200",
                                      isHovered ? "w-4 h-4" : "w-3.5 h-3.5"
                                    )}
                                  />
                                </span>

                                <span
                                  className={cn(
                                    "truncate transition-all duration-200",
                                    isHovered
                                      ? "text-[13px] font-semibold text-slate-900 dark:text-white"
                                      : "text-xs font-medium"
                                  )}
                                >
                                  {it.label}
                                </span>
                              </div>

                              {it.count !== undefined && (
                                <span
                                  className={cn(
                                    "text-[11px] font-medium px-1.5 py-0.5 rounded-md shrink-0 transition-colors duration-200",
                                    isHovered
                                      ? "bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 font-semibold"
                                      : isSelected
                                        ? "text-blue-600 dark:text-blue-400"
                                        : "text-slate-400 dark:text-slate-500"
                                  )}
                                >
                                  {it.count}
                                </span>
                              )}
                            </div>

                            {/* Clean Expanded Detail Row on Hover */}
                            <div
                              className={cn(
                                "overflow-hidden transition-all duration-200 ease-out",
                                isHovered
                                  ? "max-h-8 opacity-100 mt-1 pl-9"
                                  : "max-h-0 opacity-0 mt-0 pl-7"
                              )}
                            >
                              <span className="block truncate text-[11px] text-slate-500 dark:text-slate-400">
                                {expandedSubtitle}
                              </span>
                            </div>
                          </button>
                        );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Drawer Footer Branding */}
            <div className="p-3 border-t border-slate-200/80 dark:border-[#262932] flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
              <span className="font-semibold text-slate-700 dark:text-slate-300">DAYMARK</span>
              <span>v0.1.0</span>
            </div>
          </aside>
        );
      })()}
    </div>
  );
};
