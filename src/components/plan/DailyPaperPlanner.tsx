import React, { useState, useEffect } from "react";
import {
  Check,
  Plus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Target,
  Clock,
  Sun,
  Lightbulb,
  X,
  CheckCircle2,
} from "lucide-react";
import { cn } from "../../lib/utils";

export interface PlannerItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface DailyPlannerData {
  scheduleItems: PlannerItem[];
  topPriorities: PlannerItem[];
  forTomorrow: PlannerItem[];
  dontForget: PlannerItem[];
  notes: string;
  selectedDay: string; // "M" | "T" | "W" | "TH" | "F" | "SA" | "SU"
}

export type TileId = "priorities" | "schedule" | "tomorrow" | "dontForget";

const DAYS_OF_WEEK = ["M", "T", "W", "TH", "F", "SA", "SU"];

const DEFAULT_PLANNER_DATA: DailyPlannerData = {
  selectedDay: "M",
  topPriorities: [],
  scheduleItems: [],
  forTomorrow: [],
  dontForget: [],
  notes: "",
};

const STORAGE_KEY = "daymark_daily_paper_planner_data_v1";

interface TileConfig {
  id: TileId;
  name: string;
  shortName: string;
  subtitle: string;
  icon: React.ReactNode;
  themeColor: string;
  badgeBg: string;
  badgeText: string;
  borderHover: string;
  gradientBg: string;
  roundCheckboxChecked: string;
  accentText: string;
  buttonHoverText: string;
  buttonStroke: string;
}

const TILE_CONFIGS: Record<TileId, TileConfig> = {
  priorities: {
    id: "priorities",
    name: "Top Priorities",
    shortName: "Priorities",
    subtitle: "High-impact goals for today",
    icon: <Target className="w-5 h-5 text-amber-500" />,
    themeColor: "amber",
    badgeBg: "bg-amber-500/10 dark:bg-amber-500/20",
    badgeText: "text-amber-600 dark:text-amber-400",
    borderHover: "hover:border-amber-400 dark:hover:border-amber-500 hover:shadow-amber-500/10",
    gradientBg: "from-amber-500/10 via-orange-500/5 to-transparent",
    roundCheckboxChecked: "bg-amber-500 border-amber-500 text-white shadow-sm shadow-amber-500/30",
    accentText: "text-amber-600 dark:text-amber-400",
    buttonHoverText: "hover:text-amber-600 dark:hover:text-amber-400",
    buttonStroke: "stroke-amber-500 dark:stroke-amber-400",
  },
  schedule: {
    id: "schedule",
    name: "Daily Schedule",
    shortName: "Schedule",
    subtitle: "Time-blocked & key tasks",
    icon: <Clock className="w-5 h-5 text-blue-500" />,
    themeColor: "blue",
    badgeBg: "bg-blue-500/10 dark:bg-blue-500/20",
    badgeText: "text-blue-600 dark:text-blue-400",
    borderHover: "hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-blue-500/10",
    gradientBg: "from-blue-500/10 via-indigo-500/5 to-transparent",
    roundCheckboxChecked: "bg-blue-500 border-blue-500 text-white shadow-sm shadow-blue-500/30",
    accentText: "text-blue-600 dark:text-blue-400",
    buttonHoverText: "hover:text-blue-600 dark:hover:text-blue-400",
    buttonStroke: "stroke-blue-500 dark:stroke-blue-400",
  },
  tomorrow: {
    id: "tomorrow",
    name: "For Tomorrow",
    shortName: "Tomorrow",
    subtitle: "Prepped and queued next",
    icon: <Sun className="w-5 h-5 text-emerald-500" />,
    themeColor: "emerald",
    badgeBg: "bg-emerald-500/10 dark:bg-emerald-500/20",
    badgeText: "text-emerald-600 dark:text-emerald-400",
    borderHover: "hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-emerald-500/10",
    gradientBg: "from-emerald-500/10 via-teal-500/5 to-transparent",
    roundCheckboxChecked: "bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-500/30",
    accentText: "text-emerald-600 dark:text-emerald-400",
    buttonHoverText: "hover:text-emerald-600 dark:hover:text-emerald-400",
    buttonStroke: "stroke-emerald-500 dark:stroke-emerald-400",
  },
  dontForget: {
    id: "dontForget",
    name: "Don't Forget",
    shortName: "Reminders",
    subtitle: "Critical reminders & quick notes",
    icon: <Lightbulb className="w-5 h-5 text-violet-500" />,
    themeColor: "violet",
    badgeBg: "bg-violet-500/10 dark:bg-violet-500/20",
    badgeText: "text-violet-600 dark:text-violet-400",
    borderHover: "hover:border-violet-400 dark:hover:border-violet-500 hover:shadow-violet-500/10",
    gradientBg: "from-violet-500/10 via-pink-500/5 to-transparent",
    roundCheckboxChecked: "bg-violet-500 border-violet-500 text-white shadow-sm shadow-violet-500/30",
    accentText: "text-violet-600 dark:text-violet-400",
    buttonHoverText: "hover:text-violet-600 dark:hover:text-violet-400",
    buttonStroke: "stroke-violet-500 dark:stroke-violet-400",
  },
};

export const DailyPaperPlanner: React.FC = () => {
  const [data, setData] = useState<DailyPlannerData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Clean out empty ghost placeholders if any
        return {
          ...parsed,
          scheduleItems: (parsed.scheduleItems || DEFAULT_PLANNER_DATA.scheduleItems).filter(
            (i: PlannerItem) => i.text && i.text.trim().length > 0
          ),
          topPriorities: (parsed.topPriorities || DEFAULT_PLANNER_DATA.topPriorities).filter(
            (i: PlannerItem) => i.text && i.text.trim().length > 0
          ),
          forTomorrow: (parsed.forTomorrow || DEFAULT_PLANNER_DATA.forTomorrow).filter(
            (i: PlannerItem) => i.text && i.text.trim().length > 0
          ),
          dontForget: (parsed.dontForget || DEFAULT_PLANNER_DATA.dontForget).filter(
            (i: PlannerItem) => i.text && i.text.trim().length > 0
          ),
        };
      }
    } catch {
      // Fallback
    }
    return DEFAULT_PLANNER_DATA;
  });

  // Active expanded tile state (null = show 4 tiles overview)
  const [activeTile, setActiveTile] = useState<TileId | null>(null);

  // New item input text for expanded view
  const [newItemText, setNewItemText] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Storage quota or error
    }
  }, [data]);

  // Keyboard navigation: press Escape to close full view
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && activeTile !== null) {
        setActiveTile(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTile]);

  // Helper to get items for tile
  const getItemsForTile = (tileId: TileId): PlannerItem[] => {
    switch (tileId) {
      case "priorities":
        return data.topPriorities;
      case "schedule":
        return data.scheduleItems;
      case "tomorrow":
        return data.forTomorrow;
      case "dontForget":
        return data.dontForget;
    }
  };

  // Toggle item completion
  const toggleItem = (tileId: TileId, itemId: string) => {
    setData((prev) => {
      const updater = (list: PlannerItem[]) =>
        list.map((item) => (item.id === itemId ? { ...item, completed: !item.completed } : item));

      switch (tileId) {
        case "priorities":
          return { ...prev, topPriorities: updater(prev.topPriorities) };
        case "schedule":
          return { ...prev, scheduleItems: updater(prev.scheduleItems) };
        case "tomorrow":
          return { ...prev, forTomorrow: updater(prev.forTomorrow) };
        case "dontForget":
          return { ...prev, dontForget: updater(prev.dontForget) };
      }
    });
  };

  // Update item text
  const updateItemText = (tileId: TileId, itemId: string, text: string) => {
    setData((prev) => {
      const updater = (list: PlannerItem[]) =>
        list.map((item) => (item.id === itemId ? { ...item, text } : item));

      switch (tileId) {
        case "priorities":
          return { ...prev, topPriorities: updater(prev.topPriorities) };
        case "schedule":
          return { ...prev, scheduleItems: updater(prev.scheduleItems) };
        case "tomorrow":
          return { ...prev, forTomorrow: updater(prev.forTomorrow) };
        case "dontForget":
          return { ...prev, dontForget: updater(prev.dontForget) };
      }
    });
  };

  // Add new item
  const handleAddItem = (tileId: TileId) => {
    const text = newItemText.trim();
    if (!text) return;

    const newItem: PlannerItem = {
      id: `${tileId}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      text,
      completed: false,
    };

    setData((prev) => {
      switch (tileId) {
        case "priorities":
          return { ...prev, topPriorities: [...prev.topPriorities, newItem] };
        case "schedule":
          return { ...prev, scheduleItems: [...prev.scheduleItems, newItem] };
        case "tomorrow":
          return { ...prev, forTomorrow: [...prev.forTomorrow, newItem] };
        case "dontForget":
          return { ...prev, dontForget: [...prev.dontForget, newItem] };
      }
    });

    setNewItemText("");
  };

  // Delete item
  const handleDeleteItem = (tileId: TileId, itemId: string) => {
    setData((prev) => {
      const filterer = (list: PlannerItem[]) => list.filter((i) => i.id !== itemId);
      switch (tileId) {
        case "priorities":
          return { ...prev, topPriorities: filterer(prev.topPriorities) };
        case "schedule":
          return { ...prev, scheduleItems: filterer(prev.scheduleItems) };
        case "tomorrow":
          return { ...prev, forTomorrow: filterer(prev.forTomorrow) };
        case "dontForget":
          return { ...prev, dontForget: filterer(prev.dontForget) };
      }
    });
  };

  // Reset planner
  const handleReset = () => {
    if (window.confirm("Reset all 4 planner sections to fresh default template?")) {
      setData(DEFAULT_PLANNER_DATA);
    }
  };

  // Formatted date string
  const todayFormatted = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date());

  // Overall totals across all 4 sections
  const allItems = [
    ...data.topPriorities,
    ...data.scheduleItems,
    ...data.forTomorrow,
    ...data.dontForget,
  ];
  const totalCompleted = allItems.filter((i) => i.completed).length;
  const totalCount = allItems.length;
  const overallPercent = totalCount > 0 ? Math.round((totalCompleted / totalCount) * 100) : 0;

  return (
    <div className="w-full space-y-6">
      {/* ======================================================== */}
      {/* TOP HEADER: Clean Date & Day Selector Strip              */}
      {/* ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-[#181a20] border border-slate-200/80 dark:border-[#2b2e38] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center text-amber-500 font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>Daily Focus Hub</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 font-semibold">
                {totalCompleted}/{totalCount} Done ({overallPercent}%)
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {todayFormatted}
            </p>
          </div>
        </div>

        {/* Day Pills Bar */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-charcoal-800 border border-slate-200/70 dark:border-charcoal-700">
            {DAYS_OF_WEEK.map((day) => {
              const isSelected = data.selectedDay === day;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setData((prev) => ({ ...prev, selectedDay: day }))}
                  className={cn(
                    "w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center",
                    isSelected
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm scale-105"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-charcoal-800 transition-colors cursor-pointer"
            title="Reset template"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4 POPPING TILES GRID (WHEN NONE IS EXPANDED)            */}
      {/* ======================================================== */}
      {!activeTile ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {(["priorities", "schedule", "tomorrow", "dontForget"] as TileId[]).map((tileId) => {
            const config = TILE_CONFIGS[tileId];
            const items = getItemsForTile(tileId);
            const completedCount = items.filter((i) => i.completed).length;
            const tileTotal = items.length;
            const percent = tileTotal > 0 ? Math.round((completedCount / tileTotal) * 100) : 0;

            return (
              <div
                key={tileId}
                onClick={() => {
                  setActiveTile(tileId);
                  setNewItemText("");
                }}
                className={cn(
                  "group relative p-6 rounded-3xl bg-white dark:bg-[#181a20] border-2 border-slate-200/80 dark:border-[#2b2e38] transition-all duration-200 cursor-pointer shadow-sm hover:shadow-xl hover:-translate-y-1 overflow-hidden",
                  config.borderHover
                )}
              >
                {/* Popping Gradient Glow Accent */}
                <div
                  className={cn(
                    "absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-60 pointer-events-none transition-opacity group-hover:opacity-100 bg-gradient-to-br",
                    config.gradientBg
                  )}
                />

                <div className="relative z-10 flex flex-col h-full justify-between space-y-4">
                  {/* Top Bar: Icon, Name & Progress Pill */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-charcoal-800/80 border border-slate-200/60 dark:border-charcoal-700 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-xs">
                        {config.icon}
                      </div>
                      <div>
                        <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                          {config.name}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          {config.subtitle}
                        </p>
                      </div>
                    </div>

                    <span
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-bold shrink-0 border border-transparent shadow-2xs",
                        config.badgeBg,
                        config.badgeText
                      )}
                    >
                      {completedCount}/{tileTotal} Done
                    </span>
                  </div>

                  {/* Mini Preview of Top 3 Items with Round Checkboxes */}
                  <div className="space-y-2 py-2">
                    {items.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No tasks yet. Click to add!</p>
                    ) : (
                      items.slice(0, 3).map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium truncate"
                        >
                          <div
                            className={cn(
                              "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                              item.completed
                                ? config.roundCheckboxChecked
                                : "border-slate-300 dark:border-slate-600 bg-transparent"
                            )}
                          >
                            {item.completed && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                          <span
                            className={cn(
                              "truncate",
                              item.completed && "line-through text-slate-400 dark:text-slate-500"
                            )}
                          >
                            {item.text}
                          </span>
                        </div>
                      ))
                    )}
                    {items.length > 3 && (
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 pl-6 font-medium">
                        +{items.length - 3} more items...
                      </p>
                    )}
                  </div>

                  {/* Bottom Footer: Progress Bar & Open Checklist Link */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 max-w-[55%]">
                      <div className="w-full bg-slate-100 dark:bg-charcoal-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full bg-teal-500 rounded-full transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                        {percent}%
                      </span>
                    </div>

                    <div className="group/btn inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-50 dark:bg-[#242730] border border-slate-200 dark:border-[#343844] hover:border-blue-600 dark:hover:border-blue-400 hover:bg-blue-50/60 dark:hover:bg-blue-500/10 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-150">
                      <span>Open Checklist</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ======================================================== */
        /* FULL OPENED CHECKLIST VIEW FOR SELECTED TILE             */
        /* ======================================================== */
        <div className="rounded-3xl bg-white dark:bg-[#181a20] border-2 border-slate-200 dark:border-[#2b2e38] shadow-2xl p-6 sm:p-8 space-y-6 transition-all duration-300 relative overflow-hidden animate-in fade-in zoom-in-95">
          {(() => {
            const config = TILE_CONFIGS[activeTile];
            const items = getItemsForTile(activeTile);
            const completedCount = items.filter((i) => i.completed).length;
            const tileTotal = items.length;
            const percent = tileTotal > 0 ? Math.round((completedCount / tileTotal) * 100) : 0;

            return (
              <>
                {/* Top Banner Accent */}
                <div
                  className={cn(
                    "absolute top-0 left-0 right-0 h-2 bg-gradient-to-r",
                    config.gradientBg,
                    "opacity-90"
                  )}
                />

                {/* Back Button & Header Navigation */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveTile(null)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-charcoal-800 dark:hover:bg-charcoal-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer shadow-xs"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to 4 Tiles</span>
                    </button>

                    <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />

                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-charcoal-800 flex items-center justify-center">
                        {config.icon}
                      </div>
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                        {config.name}
                      </h2>
                    </div>
                  </div>

                  {/* Status Badge & Close */}
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-bold border border-transparent shadow-xs",
                        config.badgeBg,
                        config.badgeText
                      )}
                    >
                      {completedCount} of {tileTotal} completed ({percent}%)
                    </span>

                    <button
                      type="button"
                      onClick={() => setActiveTile(null)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-charcoal-800 transition-colors cursor-pointer"
                      title="Close full checklist (Esc)"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-100 dark:bg-charcoal-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-teal-500 rounded-full transition-all duration-300"
                    style={{ width: `${percent}%` }}
                  />
                </div>

                {/* ======================================================== */}
                {/* THE FULL CHECKLIST WITH ROUND CHECKBOXES                 */}
                {/* ======================================================== */}
                <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-2 py-2">
                  {items.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 dark:text-slate-500 space-y-2">
                      <CheckCircle2 className="w-10 h-10 mx-auto stroke-1 opacity-50" />
                      <p className="text-sm font-medium">No items in this section yet.</p>
                      <p className="text-xs">Add your first checklist item below!</p>
                    </div>
                  ) : (
                    items.map((item) => (
                      <div
                        key={item.id}
                        className={cn(
                          "group flex items-center gap-3.5 p-3 rounded-2xl border transition-all duration-200",
                          item.completed
                            ? "bg-slate-50/60 dark:bg-charcoal-900/40 border-slate-100 dark:border-charcoal-800/60"
                            : "bg-white dark:bg-[#1f222a] border-slate-200/80 dark:border-charcoal-700 shadow-xs hover:border-slate-300 dark:hover:border-charcoal-600"
                        )}
                      >
                        {/* THE ROUND CHECKBOX */}
                        <button
                          type="button"
                          onClick={() => toggleItem(activeTile, item.id)}
                          className={cn(
                            "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-xs",
                            item.completed
                              ? config.roundCheckboxChecked
                              : "border-slate-300 dark:border-slate-500 hover:border-teal-400 dark:hover:border-teal-400 bg-white/80 dark:bg-charcoal-800 hover:scale-105"
                          )}
                          title={item.completed ? "Mark incomplete" : "Mark complete"}
                        >
                          {item.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>

                        {/* Editable Text Input */}
                        <input
                          type="text"
                          value={item.text}
                          onChange={(e) => updateItemText(activeTile, item.id, e.target.value)}
                          className={cn(
                            "flex-1 bg-transparent border-none p-0 text-sm font-medium focus:outline-none focus:ring-0 transition-colors",
                            item.completed
                              ? "line-through text-slate-400 dark:text-slate-500"
                              : "text-slate-800 dark:text-slate-100"
                          )}
                        />

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(activeTile, item.id)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 rounded-lg transition-all cursor-pointer"
                          title="Delete item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* ======================================================== */}
                {/* QUICK ADD NEW ITEM BAR                                   */}
                {/* ======================================================== */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAddItem(activeTile);
                  }}
                  className="flex items-center gap-2 pt-2"
                >
                  <div className="relative flex-1">
                    {/* Empty Round Checkbox Hint */}
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-600 pointer-events-none" />
                    <input
                      type="text"
                      value={newItemText}
                      onChange={(e) => setNewItemText(e.target.value)}
                      placeholder={`Add a new item to ${config.name}... (Press Enter)`}
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-charcoal-900 border border-slate-200 dark:border-charcoal-700 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!newItemText.trim()}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-teal-500 hover:bg-teal-600 disabled:opacity-40 text-charcoal-950 font-bold text-xs transition-colors cursor-pointer shadow-sm shadow-teal-500/20 shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Item</span>
                  </button>
                </form>

                {/* If Don't Forget tile, also render the Quick Notes scratchpad */}
                {activeTile === "dontForget" && (
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Lightbulb className="w-3.5 h-3.5 text-violet-400" />
                      <span>Scratchpad Notes & Ideas</span>
                    </h4>
                    <textarea
                      value={data.notes}
                      rows={4}
                      placeholder="Write freeform notes, phone numbers, thoughts..."
                      onChange={(e) => setData((prev) => ({ ...prev, notes: e.target.value }))}
                      className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-charcoal-900 border border-slate-200 dark:border-charcoal-700 text-xs font-sans leading-relaxed text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-violet-500 resize-none transition-colors"
                    />
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
};
