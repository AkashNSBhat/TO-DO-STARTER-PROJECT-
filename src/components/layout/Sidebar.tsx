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
  { id: "tasks", label: "Daily Tasks", icon: CheckSquare },
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
        discoverFilter?: { mediaType?: "movie" | "series"; language?: string };
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
            active: true,
            subtitle: "Plan and organize your day",
            icon: CalendarClock,
            targetTab: "plan",
          },
          {
            label: "Habit Streak",
            subtitle: "Track your daily consistency",
            icon: Flame,
            targetTab: "statistics",
          },
          {
            label: "Media Progress",
            subtitle: "View your active movies & series",
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
            subtitle: "Manage your daily tasks",
            icon: Zap,
            targetTab: "tasks",
          },
          {
            label: "Watching Next",
            subtitle: "Discover movies & series",
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
        title: "Tasks",
        items: [
          { label: "All tasks", active: true },
          { label: "To do" },
          { label: "In progress" },
          { label: "Done" },
        ],
      },
      {
        title: "Smart Views",
        items: [
          { label: "Upcoming" },
          { label: "Overdue" },
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
          { label: "Movies Catalogue", count: "5,000+", active: true, discoverFilter: { mediaType: "movie" } },
          { label: "Series & Shows", count: "5,000+", discoverFilter: { mediaType: "series" } },
        ],
      },
      {
        title: "Languages",
        items: [
          { label: "English", count: "Global", discoverFilter: { language: "en" } },
          { label: "Hindi (हिंदी)", count: "Popular", discoverFilter: { language: "hi" } },
          { label: "Kannada (ಕನ್ನಡ)", count: "Regional", discoverFilter: { language: "kn" } },
          { label: "German (Deutsch)", count: "European", discoverFilter: { language: "de" } },
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
          { label: "All Movies", active: true },
          { label: "Watching" },
          { label: "Planned" },
          { label: "Completed" },
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
          { label: "Currently Watching", active: true },
          { label: "Plan to Watch" },
          { label: "Completed" },
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
          { label: "All Completed", active: true },
          { label: "Movies Archive" },
          { label: "Series Archive" },
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
          { label: "Weekly Cycle", active: true },
          { label: "Monthly Goals" },
          { label: "Yearly Roadmap" },
        ],
      },
      {
        title: "Categories",
        items: [
          { label: "Projects" },
          { label: "Learning" },
          { label: "Entertainment" },
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
          { label: "All Completions", active: true },
          { label: "Daily Tasks" },
          { label: "Entertainment" },
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
          { label: "Entertainment" },
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
  onSelectDiscoverFilter?: (filter: { mediaType?: "movie" | "series"; language?: string }) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  dbConnected: boolean;
  dbPingMs?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onSelectDiscoverFilter,
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
      {/* 1. SLIM LEFT ICON RAIL (Light & Dark Mode Adaptive)       */}
      {/* ========================================================= */}
      <aside className="w-16 h-screen bg-slate-100/95 dark:bg-[#11151d] border-r border-slate-200/90 dark:border-[#1f2430] flex flex-col items-center justify-between py-4 shrink-0 transition-colors">
        {/* App Cube Logo */}
        <div className="flex flex-col items-center gap-6">
          <div
            onClick={() => onSelectTab("dashboard")}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-teal-500/25 cursor-pointer hover:scale-105 active:scale-95 transition-all"
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
                      "w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer relative",
                      isActive
                        ? "bg-teal-500/12 dark:bg-teal-500/15 text-teal-700 dark:text-teal-300 shadow-xs border border-teal-500/30 dark:border-teal-400/30"
                        : "text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-300 hover:bg-teal-500/10 dark:hover:bg-teal-500/15"
                    )}
                  >
                    <Icon className="w-5 h-5 shrink-0 transition-transform duration-200 ease-out group-hover:scale-[1.15]" />
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-teal-600 dark:bg-teal-400 rounded-r-full" />
                    )}
                  </button>

                  {/* Tooltip on hover */}
                  <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-md bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs font-medium border border-slate-200 dark:border-slate-700 shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
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
            {dbConnected && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
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
            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-300 hover:bg-teal-500/10 dark:hover:bg-teal-500/15 hover:scale-110 transition-all cursor-pointer"
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
      {/* 2. CONTEXTUAL DRAWER (Contained Inside-Box Wave Sidebar)  */}
      {/* ========================================================= */}
      {!collapsed && (() => {
        let runningFlatIndex = 0;

        return (
          <aside
            onMouseLeave={() => setHoveredItemIndex(null)}
            className="relative w-60 h-screen bg-white dark:bg-[#191b20] border-r border-slate-200 dark:border-[#282c35] flex flex-col justify-between transition-all duration-300 shrink-0 overflow-hidden z-20"
          >
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 space-y-5">
              {/* Top Drawer Title with Action */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  {drawerData.title}
                </h2>
                <button
                  onClick={() => onSelectTab("tasks")}
                  className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-blue-500 hover:text-white text-slate-500 dark:text-slate-400 flex items-center justify-center text-xs transition-colors cursor-pointer"
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
                        const isOuterWave = distance === 2;
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
                              if (it.discoverFilter && onSelectDiscoverFilter) {
                                onSelectDiscoverFilter(it.discoverFilter);
                              }
                              if (it.targetTab) {
                                onSelectTab(it.targetTab);
                              }
                            }}
                            onMouseEnter={() => setHoveredItemIndex(flatIdx)}
                            className={cn(
                              "w-full flex flex-col rounded-xl relative overflow-hidden cursor-pointer text-left transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
                              isHovered
                                ? "py-3 px-3 bg-gradient-to-br from-blue-500/12 via-teal-500/12 to-indigo-500/15 dark:from-[#1f2c3f] dark:via-[#1a2f3d] dark:to-[#222840] border border-blue-400/45 dark:border-teal-400/45 shadow-md shadow-teal-500/10"
                                : isNearWave
                                  ? "py-2 px-3 pl-3.5 bg-slate-100/75 dark:bg-[#222631] text-slate-800 dark:text-slate-100"
                                  : isOuterWave
                                    ? "py-1.5 px-2.5 pl-3 text-slate-600 dark:text-slate-300"
                                    : isSelected
                                      ? "py-1.5 px-2.5 bg-slate-100/80 dark:bg-[#22252e] text-blue-600 dark:text-blue-400"
                                      : "py-1.5 px-2.5 text-slate-500 dark:text-slate-400"
                            )}
                          >
                            {/* Internal Wave Backdrop SVG strictly inside the item box */}
                            {isHovered && (
                              <svg
                                aria-hidden="true"
                                viewBox="0 0 220 64"
                                preserveAspectRatio="none"
                                className="pointer-events-none absolute inset-0 w-full h-full opacity-45 dark:opacity-35"
                              >
                                <path
                                  d="M0 44 Q 55 18, 110 38 T 220 26 L 220 64 L 0 64 Z"
                                  className="fill-blue-400/25 dark:fill-teal-400/25"
                                />
                                <path
                                  d="M0 52 Q 70 28, 140 46 T 220 38 L 220 64 L 0 64 Z"
                                  className="fill-indigo-400/20 dark:fill-blue-400/20"
                                />
                              </svg>
                            )}

                            <div className="relative z-10 w-full flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span
                                  className={cn(
                                    "rounded-lg flex items-center justify-center shrink-0 transition-all duration-300",
                                    isHovered
                                      ? "w-7 h-7 bg-blue-500/15 dark:bg-teal-400/20 text-blue-600 dark:text-teal-300 scale-110"
                                      : isNearWave
                                        ? "w-6 h-6 bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-200 scale-105"
                                        : isSelected
                                          ? "w-5 h-5 bg-blue-500/10 text-blue-500 dark:text-blue-400"
                                          : "w-5 h-5 bg-slate-100 dark:bg-slate-800/70 text-slate-400 dark:text-slate-500"
                                  )}
                                >
                                  <ItemIcon
                                    className={cn(
                                      "transition-all duration-300",
                                      isHovered ? "w-4 h-4" : "w-3 h-3"
                                    )}
                                  />
                                </span>

                                <span
                                  className={cn(
                                    "truncate transition-all duration-300",
                                    isHovered
                                      ? "text-[13px] font-bold text-blue-700 dark:text-teal-300 tracking-tight"
                                      : isNearWave
                                        ? "text-xs font-semibold text-slate-800 dark:text-slate-200"
                                        : "text-[11px] font-medium"
                                  )}
                                >
                                  {it.label}
                                </span>
                              </div>

                              {it.count !== undefined && (
                                <span
                                  className={cn(
                                    "font-semibold px-1.5 py-0.5 rounded-full shrink-0 transition-all duration-300",
                                    isHovered
                                      ? "text-[11px] bg-blue-500/15 dark:bg-teal-400/20 text-blue-700 dark:text-teal-300"
                                      : isSelected
                                        ? "text-[10px] bg-blue-500/10 text-blue-500 dark:text-blue-400"
                                        : "text-[10px] text-slate-400 dark:text-slate-500"
                                  )}
                                >
                                  ({it.count})
                                </span>
                              )}
                            </div>

                            {/* Big Wave Expanded Detail Row inside the box */}
                            <div
                              className={cn(
                                "relative z-10 overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
                                isHovered
                                  ? "max-h-10 opacity-100 mt-1.5 pl-9"
                                  : "max-h-0 opacity-0 mt-0 pl-7"
                              )}
                            >
                              <div className="flex items-center gap-1.5 text-[10px] font-medium text-blue-600/85 dark:text-teal-300/90">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-teal-400 animate-pulse shrink-0" />
                                <span className="truncate">{expandedSubtitle}</span>
                              </div>
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
            <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
              <span className="font-semibold text-slate-700 dark:text-slate-300">DAYMARK</span>
              <span>v0.1.0</span>
            </div>
          </aside>
        );
      })()}
    </div>
  );
};
