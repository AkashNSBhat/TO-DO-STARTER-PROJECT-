import React, { useState, useRef, useEffect } from "react";
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
          },
          {
            label: "Habit Streak",
            count: "14d",
            subtitle: "14-day active streak • Best run",
          },
          {
            label: "Media Progress",
            count: 3,
            subtitle: "3 active • 2 series, 1 movie",
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
          },
          {
            label: "Watching Next",
            count: 1,
            subtitle: "1 title queued in watchlist",
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
  const [activeSubItem, setActiveSubItem] = useState<string>("In progress");
  const [hoveredItemIndex, setHoveredItemIndex] = useState<number | null>(null);
  const [hoveredWaveY, setHoveredWaveY] = useState<number>(140);
  const drawerAsideRef = useRef<HTMLElement | null>(null);
  const drawerData = DRAWER_SECTIONS[currentTab];

  useEffect(() => {
    setHoveredItemIndex(null);
  }, [currentTab]);

  return (
    <div className="flex h-screen select-none z-20 shrink-0">
      {/* ========================================================= */}
      {/* 1. SLIM LEFT ICON RAIL (Exact Figma Style)                */}
      {/* ========================================================= */}
      <aside className="w-16 h-screen bg-[#14161a] border-r border-[#22252c] flex flex-col items-center justify-between py-4 shrink-0 transition-colors">
        {/* App Cube Logo */}
        <div className="flex flex-col items-center gap-6">
          <div
            onClick={() => onSelectTab("dashboard")}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 cursor-pointer hover:scale-105 active:scale-95 transition-all"
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
                      "w-11 h-11 rounded-xl flex items-center justify-center transition-all cursor-pointer relative",
                      isActive
                        ? "bg-[#252830] text-blue-400 shadow-sm border border-slate-700/50"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                    )}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-500 rounded-r-full" />
                    )}
                  </button>

                  {/* Tooltip on hover */}
                  <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-md bg-slate-900 text-slate-100 text-xs font-medium border border-slate-700 shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
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
            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title={collapsed ? "Expand drawer" : "Collapse drawer"}
            aria-label="Toggle sidebar drawer"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* 2. CONTEXTUAL DRAWER (Wave-Reactive Expandable Column)    */}
      {/* ========================================================= */}
      {!collapsed && (() => {
        let runningFlatIndex = 0;
        const isWaveActive = hoveredItemIndex !== null;

        return (
          <aside
            ref={drawerAsideRef}
            onMouseLeave={() => setHoveredItemIndex(null)}
            className="relative w-60 h-screen bg-white dark:bg-[#191b20] border-r border-slate-200 dark:border-[#282c35] flex flex-col justify-between transition-all duration-300 shrink-0 overflow-visible z-30"
          >
            {/* Dynamic Right-Edge SVG Wave Crest that follows hovered item */}
            <div
              aria-hidden="true"
              style={{
                top: `${Math.max(24, hoveredWaveY - 90)}px`,
                transform: isWaveActive ? "scaleX(1)" : "scaleX(0)",
              }}
              className={cn(
                "pointer-events-none absolute -right-[30px] w-[31px] h-[180px] origin-left z-20 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
                isWaveActive ? "opacity-100" : "opacity-0"
              )}
            >
              <svg
                viewBox="0 0 36 180"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full drop-shadow-[4px_0_12px_rgba(20,184,166,0.18)]"
              >
                <path
                  d="M0 0 C2 42, 32 56, 32 90 C32 124, 2 138, 0 180 L0 0 Z"
                  className="fill-white dark:fill-[#191b20]"
                />
                <path
                  d="M0 0 C2 42, 32 56, 32 90 C32 124, 2 138, 0 180"
                  strokeWidth="1.5"
                  className="stroke-blue-400/50 dark:stroke-teal-400/50"
                />
              </svg>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-visible p-4 space-y-6">
              {/* Top Drawer Title with Action */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  {drawerData.title}
                </h2>
                <button
                  className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-blue-500 hover:text-white text-slate-500 dark:text-slate-400 flex items-center justify-center text-xs transition-colors cursor-pointer"
                  title="Quick Add"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Wave-Reactive Navigation Groups */}
              <div className="space-y-5">
                {drawerData.groups.map((group, gIdx) => (
                  <div key={gIdx} className="space-y-1.5">
                    {group.title && (
                      <div className="flex items-center justify-between px-2 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        <span>{group.title}</span>
                        <ChevronDown className="w-3 h-3 text-slate-400" />
                      </div>
                    )}

                    <div className="space-y-1 relative pl-1">
                      {/* Subtle hierarchy guideline */}
                      <div className="absolute left-2.5 top-2 bottom-2 w-px bg-slate-200 dark:bg-slate-800" />

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

                        const expandedSubtitle =
                          it.subtitle ||
                          (it.count !== undefined
                            ? `${it.count} items • Click to focus`
                            : "Quick view • Click to open");

                        return (
                          <button
                            key={idx}
                            onClick={() => setActiveSubItem(it.label)}
                            onMouseEnter={(e) => {
                              setHoveredItemIndex(flatIdx);
                              const asideRect =
                                drawerAsideRef.current?.getBoundingClientRect();
                              const btnRect = e.currentTarget.getBoundingClientRect();
                              if (asideRect) {
                                setHoveredWaveY(
                                  btnRect.top - asideRect.top + btnRect.height / 2
                                );
                              }
                            }}
                            className={cn(
                              "w-full flex flex-col px-3 rounded-xl text-xs font-medium relative cursor-pointer text-left origin-left transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
                              isHovered
                                ? "z-30 py-3 translate-x-4 scale-[1.07] rounded-2xl bg-gradient-to-r from-blue-50 via-teal-50/90 to-indigo-50 dark:from-[#212b3d] dark:via-[#1b2e3b] dark:to-[#242b42] text-blue-700 dark:text-teal-300 border border-blue-400/50 dark:border-teal-400/45 shadow-[0_10px_28px_-6px_rgba(20,184,166,0.32)]"
                                : isNearWave
                                  ? "z-20 py-2 translate-x-2 scale-[1.025] bg-slate-100/80 dark:bg-[#232732] text-slate-900 dark:text-slate-100 shadow-sm"
                                  : isOuterWave
                                    ? "z-10 py-1.5 translate-x-1 scale-[1.008] text-slate-700 dark:text-slate-300"
                                    : isSelected
                                      ? "z-10 py-1.5 bg-slate-100 dark:bg-[#252830] text-blue-600 dark:text-blue-400 font-semibold shadow-xs"
                                      : "z-10 py-1.5 text-slate-600 dark:text-slate-400"
                            )}
                          >
                            <div className="w-full flex items-center justify-between">
                              <span
                                className={cn(
                                  "truncate transition-all duration-300",
                                  isHovered && "font-bold text-[13px] tracking-tight"
                                )}
                              >
                                {it.label}
                              </span>
                              {it.count !== undefined && (
                                <span
                                  className={cn(
                                    "text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ml-1.5 transition-all duration-300",
                                    isHovered
                                      ? "bg-blue-500/15 dark:bg-teal-400/20 text-blue-700 dark:text-teal-300 scale-110"
                                      : isSelected
                                        ? "bg-blue-500/10 text-blue-500 dark:text-blue-400"
                                        : "text-slate-400 dark:text-slate-500"
                                  )}
                                >
                                  ({it.count})
                                </span>
                              )}
                            </div>

                            {/* Big Wave Expanded Detail Row */}
                            <div
                              className={cn(
                                "overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
                                isHovered
                                  ? "max-h-10 opacity-100 mt-1.5"
                                  : "max-h-0 opacity-0 mt-0"
                              )}
                            >
                              <div className="flex items-center gap-1.5 text-[10px] font-medium text-blue-600/85 dark:text-teal-300/85">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-teal-400 animate-pulse shrink-0" />
                                <span className="truncate">{expandedSubtitle}</span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
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
