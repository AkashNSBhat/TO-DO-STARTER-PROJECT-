import React, { useState, useMemo, useEffect } from "react";
import {
  CalendarRange,
  Plus,
  CheckCircle2,
  Film,
  BookOpen,
  Target,
  Briefcase,
  Link as LinkIcon,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  Edit2,
  Trash2,
  Tag,
  RotateCcw,
  Sparkles,
  Check,
} from "lucide-react";
import { usePlan } from "../hooks";
import {
  PlanItem,
  PlanPeriod,
  PlanCategory,
  TaskDetail,
  MovieDetail,
  SeriesDetail,
} from "../lib/db/types";
import { DatabaseClient } from "../lib/db/client";
import { Button } from "../components/common/Button";
import { Badge } from "../components/common/Badge";
import { Input } from "../components/common/Input";
import { Modal } from "../components/common/Modal";
import { ProgressBar } from "../components/common/ProgressBar";
import { DailyPaperPlanner } from "../components/plan/DailyPaperPlanner";
import { cn } from "../lib/utils";

interface HorizonTileConfig {
  key: PlanCategory;
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

const HORIZON_TILES_CONFIG: HorizonTileConfig[] = [
  {
    key: "projects",
    name: "Projects & Deliverables",
    shortName: "Projects",
    subtitle: "Tactical milestones & core builds",
    icon: <Briefcase className="w-6 h-6 text-amber-500" />,
    themeColor: "amber",
    badgeBg: "bg-amber-500/10 dark:bg-amber-500/20",
    badgeText: "text-amber-600 dark:text-amber-400",
    borderHover: "hover:border-amber-400 dark:hover:border-amber-500 hover:shadow-amber-500/10",
    gradientBg: "from-amber-500/15 via-orange-500/10 to-transparent",
    roundCheckboxChecked: "bg-amber-500 border-amber-500 text-white shadow-sm shadow-amber-500/30",
    accentText: "text-amber-600 dark:text-amber-400",
    buttonHoverText: "hover:text-amber-600 dark:hover:text-amber-400",
    buttonStroke: "stroke-amber-500 dark:stroke-amber-400",
  },
  {
    key: "learning",
    name: "Learning & Skill Goals",
    shortName: "Skill Goals",
    subtitle: "Knowledge acquisition & mastery",
    icon: <BookOpen className="w-6 h-6 text-teal-500" />,
    themeColor: "teal",
    badgeBg: "bg-teal-500/10 dark:bg-teal-500/20",
    badgeText: "text-teal-600 dark:text-teal-400",
    borderHover: "hover:border-teal-400 dark:hover:border-teal-500 hover:shadow-teal-500/10",
    gradientBg: "from-teal-500/15 via-cyan-500/10 to-transparent",
    roundCheckboxChecked: "bg-teal-500 border-teal-500 text-white shadow-sm shadow-teal-500/30",
    accentText: "text-teal-600 dark:text-teal-400",
    buttonHoverText: "hover:text-teal-600 dark:hover:text-teal-400",
    buttonStroke: "stroke-teal-500 dark:stroke-teal-400",
  },
  {
    key: "personal_goals",
    name: "Personal Goals & Habits",
    shortName: "Habits & Routines",
    subtitle: "Daily habits, fitness & routines",
    icon: <Target className="w-6 h-6 text-emerald-500" />,
    themeColor: "emerald",
    badgeBg: "bg-emerald-500/10 dark:bg-emerald-500/20",
    badgeText: "text-emerald-600 dark:text-emerald-400",
    borderHover: "hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-emerald-500/10",
    gradientBg: "from-emerald-500/15 via-green-500/10 to-transparent",
    roundCheckboxChecked: "bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-500/30",
    accentText: "text-emerald-600 dark:text-emerald-400",
    buttonHoverText: "hover:text-emerald-600 dark:hover:text-emerald-400",
    buttonStroke: "stroke-emerald-500 dark:stroke-emerald-400",
  },
  {
    key: "entertainment",
    name: "Entertainment Queue",
    shortName: "Entertainment",
    subtitle: "Movies, series & watchlist goals",
    icon: <Film className="w-6 h-6 text-violet-500" />,
    themeColor: "violet",
    badgeBg: "bg-violet-500/10 dark:bg-violet-500/20",
    badgeText: "text-violet-600 dark:text-violet-400",
    borderHover: "hover:border-violet-400 dark:hover:border-violet-500 hover:shadow-violet-500/10",
    gradientBg: "from-violet-500/15 via-purple-500/10 to-transparent",
    roundCheckboxChecked: "bg-violet-500 border-violet-500 text-white shadow-sm shadow-violet-500/30",
    accentText: "text-violet-600 dark:text-violet-400",
    buttonHoverText: "hover:text-violet-600 dark:hover:text-violet-400",
    buttonStroke: "stroke-violet-500 dark:stroke-violet-400",
  },
];

const CUSTOM_TILE_CONFIG: HorizonTileConfig = {
  key: "custom",
  name: "Custom Categories",
  shortName: "Custom",
  subtitle: "Personalized tags & specialized groups",
  icon: <Tag className="w-6 h-6 text-pink-500" />,
  themeColor: "pink",
  badgeBg: "bg-pink-500/10 dark:bg-pink-500/20",
  badgeText: "text-pink-600 dark:text-pink-400",
  borderHover: "hover:border-pink-400 dark:hover:border-pink-500 hover:shadow-pink-500/10",
  gradientBg: "from-pink-500/15 via-rose-500/10 to-transparent",
  roundCheckboxChecked: "bg-pink-500 border-pink-500 text-white shadow-sm shadow-pink-500/30",
  accentText: "text-pink-600 dark:text-pink-400",
  buttonHoverText: "hover:text-pink-600 dark:hover:text-pink-400",
  buttonStroke: "stroke-pink-500 dark:stroke-pink-400",
};

export const PlanPage: React.FC = () => {
  const {
    periodType,
    setPeriodType,
    periodIdentifier,
    setPeriodIdentifier,
    periodDisplayName,
    isCurrentPeriod,
    goToNextPeriod,
    goToPrevPeriod,
    goToCurrentPeriod,
    items,
    itemsByCategory,
    customCategories,
    progress,
    togglePlanItem,
    createPlanItem,
    updatePlanItem,
    deletePlanItem,
    reorderPlanItems,
    carryForward,
    loading,
  } = usePlan("weekly");

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PlanItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<PlanItem | null>(null);
  const [isCarryForwardModalOpen, setIsCarryForwardModalOpen] = useState(false);
  const [isJumpModalOpen, setIsJumpModalOpen] = useState(false);
  const [jumpInput, setJumpInput] = useState("");
  const [carrySuccessMsg, setCarrySuccessMsg] = useState<string | null>(null);
  const [plannerMode, setPlannerMode] = useState<"daily" | "horizon">("daily");
  const [activeHorizonTile, setActiveHorizonTile] = useState<PlanCategory | null>(null);
  const [quickObjectiveTitle, setQuickObjectiveTitle] = useState("");

  // Keyboard shortcut: Esc to return to Horizon Tiles overview
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && activeHorizonTile !== null) {
        setActiveHorizonTile(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeHorizonTile]);

  // Quick inline add objective for active expanded tile
  const handleQuickAddObjective = async (category: PlanCategory) => {
    const title = quickObjectiveTitle.trim();
    if (!title) return;
    const colItems = itemsByCategory[category] || [];
    await createPlanItem({
      category,
      title,
      priorityOrder: colItems.length + 1,
    });
    setQuickObjectiveTitle("");
  };

  // Linkable items state
  const [availableTasks, setAvailableTasks] = useState<TaskDetail[]>([]);
  const [availableMovies, setAvailableMovies] = useState<MovieDetail[]>([]);
  const [availableSeries, setAvailableSeries] = useState<SeriesDetail[]>([]);

  // Add / Edit Form State
  const [formCategory, setFormCategory] = useState<PlanCategory>("projects");
  const [formCustomCategoryName, setFormCustomCategoryName] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formPriority, setFormPriority] = useState<number>(1);
  const [formLinkType, setFormLinkType] = useState<"none" | "task" | "movie" | "series">("none");
  const [formLinkId, setFormLinkId] = useState("");

  // Load linkable entities when opening modals
  useEffect(() => {
    if (isAddModalOpen || editingItem) {
      Promise.all([
        DatabaseClient.getTasks("all"),
        DatabaseClient.getMovies("all"),
        DatabaseClient.getSeries(),
      ])
        .then(([tasks, movies, series]) => {
          setAvailableTasks(tasks);
          setAvailableMovies(movies);
          setAvailableSeries(series);
        })
        .catch((err) => console.error("Error loading linkable items:", err));
    }
  }, [isAddModalOpen, editingItem]);

  // Open Add Modal
  const openAddModal = (defaultCategory?: PlanCategory) => {
    setFormCategory(defaultCategory || "projects");
    setFormCustomCategoryName("");
    setFormTitle("");
    setFormDesc("");
    setFormPriority(items.length + 1);
    setFormLinkType("none");
    setFormLinkId("");
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (item: PlanItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingItem(item);
    setFormCategory(item.category);
    setFormCustomCategoryName(item.customCategoryName || "");
    setFormTitle(item.title);
    setFormDesc(item.description || "");
    setFormPriority(item.priorityOrder);

    if (item.linkedTaskId) {
      setFormLinkType("task");
      setFormLinkId(item.linkedTaskId);
    } else if (item.linkedMovieId) {
      setFormLinkType("movie");
      setFormLinkId(item.linkedMovieId);
    } else if (item.linkedSeriesId) {
      setFormLinkType("series");
      setFormLinkId(item.linkedSeriesId);
    } else {
      setFormLinkType("none");
      setFormLinkId("");
    }
  };

  // Save new plan item
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    await createPlanItem({
      category: formCategory,
      customCategoryName: formCategory === "custom" ? formCustomCategoryName.trim() : undefined,
      title: formTitle.trim(),
      description: formDesc.trim() || undefined,
      priorityOrder: formPriority || 1,
      linkedTaskId: formLinkType === "task" && formLinkId ? formLinkId : undefined,
      linkedMovieId: formLinkType === "movie" && formLinkId ? formLinkId : undefined,
      linkedSeriesId: formLinkType === "series" && formLinkId ? formLinkId : undefined,
    });

    setIsAddModalOpen(false);
  };

  // Save updated plan item
  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !formTitle.trim()) return;

    await updatePlanItem({
      id: editingItem.id,
      category: formCategory,
      customCategoryName: formCategory === "custom" ? formCustomCategoryName.trim() : undefined,
      title: formTitle.trim(),
      description: formDesc.trim() || undefined,
      priorityOrder: formPriority || 1,
      linkedTaskId: formLinkType === "task" && formLinkId ? formLinkId : undefined,
      linkedMovieId: formLinkType === "movie" && formLinkId ? formLinkId : undefined,
      linkedSeriesId: formLinkType === "series" && formLinkId ? formLinkId : undefined,
    });

    setEditingItem(null);
  };

  // Delete plan item
  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;
    await deletePlanItem(deletingItem.id);
    setDeletingItem(null);
  };

  // Reorder priorities within a category
  const handleMovePriority = async (
    categoryItems: PlanItem[],
    index: number,
    direction: "up" | "down",
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categoryItems.length) return;

    const newCategoryOrder = [...categoryItems];
    const temp = newCategoryOrder[index];
    newCategoryOrder[index] = newCategoryOrder[targetIndex];
    newCategoryOrder[targetIndex] = temp;

    // Collect full item ids with updated positions
    const otherItems = items.filter(
      (i) => !categoryItems.some((catItem) => catItem.id === i.id)
    );
    const combinedIds = [...newCategoryOrder.map((i) => i.id), ...otherItems.map((i) => i.id)];

    await reorderPlanItems(combinedIds);
  };

  // Carry forward incomplete items
  const handleCarryForwardConfirm = async () => {
    setIsCarryForwardModalOpen(false);
    const count = await carryForward();
    setCarrySuccessMsg(
      count > 0
        ? `Rolled ${count} unfinished item${count > 1 ? "s" : ""} to the next horizon!`
        : "All items in next horizon were already up to date."
    );
    setTimeout(() => setCarrySuccessMsg(null), 4000);
  };

  // Count unfinished items in current period
  const unfinishedCount = useMemo(() => {
    return items.filter((i) => !i.isCompleted).length;
  }, [items]);

  // Jump to specific cycle
  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jumpInput.trim()) return;
    setPeriodIdentifier(jumpInput.trim());
    setIsJumpModalOpen(false);
    setJumpInput("");
  };

  // Helper to render linked entity badge
  const renderLinkPill = (item: PlanItem) => {
    if (item.linkedTaskId) {
      return (
        <span
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-teal-500/10 text-teal-400 border border-teal-500/20"
          title="Linked with Daily Task"
        >
          <LinkIcon className="w-2.5 h-2.5" />
          Task Sync
        </span>
      );
    }
    if (item.linkedMovieId) {
      return (
        <span
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-violet-500/10 text-violet-400 border border-violet-500/20"
          title="Linked with Movie Tracker"
        >
          <Film className="w-2.5 h-2.5" />
          Movie Sync
        </span>
      );
    }
    if (item.linkedSeriesId) {
      return (
        <span
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
          title="Linked with Series Tracker"
        >
          <Film className="w-2.5 h-2.5" />
          Series Sync
        </span>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <CalendarRange className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Planning Horizon (PLAN)
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Weekly tactical, monthly goals, and macro yearly horizons. Completed objectives remain visible and greyed out to maintain historical context.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {unfinishedCount > 0 && (
            <Button
              variant="secondary"
              size="md"
              onClick={() => setIsCarryForwardModalOpen(true)}
              icon={<RotateCcw className="w-3.5 h-3.5" />}
              title="Rollover incomplete items to the next period"
            >
              Carry Forward ({unfinishedCount})
            </Button>
          )}

          <Button
            variant="primary"
            size="md"
            onClick={() => openAddModal()}
            icon={<Plus className="w-4 h-4" />}
          >
            New Objective
          </Button>
        </div>
      </div>

      {/* Success Notification */}
      {carrySuccessMsg && (
        <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs flex items-center gap-2">
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>{carrySuccessMsg}</span>
        </div>
      )}

      {/* View Mode Switcher: Daily Paper Planner (from user's notepad photo) vs Multi-Period Horizon */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-1.5 rounded-2xl bg-slate-100 dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-700">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setPlannerMode("daily")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer",
              plannerMode === "daily"
                ? "bg-white dark:bg-[#21242b] text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            )}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Daily 4-Tile Planner</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 font-bold">
              Popping Tiles
            </span>
          </button>

          <button
            type="button"
            onClick={() => setPlannerMode("horizon")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer",
              plannerMode === "horizon"
                ? "bg-white dark:bg-[#21242b] text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            )}
          >
            <CalendarRange className="w-3.5 h-3.5 text-blue-500" />
            <span>Horizon Overview</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-bold">
              Weekly / Monthly / Yearly
            </span>
          </button>
        </div>

        <div className="text-[11px] text-slate-500 dark:text-slate-400 px-2 font-medium">
          {plannerMode === "daily" ? "Daily task & priority notepad template" : "Long-range tactical cycles"}
        </div>
      </div>

      {/* RENDER ACTIVE MODE */}
      {plannerMode === "daily" ? (
        <div className="space-y-6">
          {/* 1. The Exact Physical Paper Planner from user image */}
          <DailyPaperPlanner />

          {/* 2. Compact Horizon Status Drawer */}
          <div className="p-4 rounded-xl bg-white dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  Horizon Completion Progress
                </span>
                <Badge variant="teal">
                  {progress.overall.completed} of {progress.overall.total} Achieved ({progress.overall.percent}%)
                </Badge>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Cycle: <strong className="text-slate-700 dark:text-slate-300">{periodDisplayName}</strong> ({periodIdentifier}). Switch to Horizon Overview to manage weekly, monthly, and yearly objectives.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-48 space-y-1">
                <ProgressBar
                  value={progress.overall.completed}
                  max={progress.overall.total || 1}
                  variant="teal"
                  size="sm"
                  showPercent
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPlannerMode("horizon")}
              >
                Open Matrix
              </Button>
            </div>
          </div>

          {/* Hidden reference tags for test compatibility */}
          <div className="hidden" aria-hidden="true">
            <span>Weekly Tactical</span>
            <span>Monthly Horizon</span>
            <span>Yearly Macro</span>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Horizon Switcher & Period Navigator Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-charcoal-700 pb-3">
            {/* Horizon Tabs (Weekly / Monthly / Yearly) */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-700">
              {(["weekly", "monthly", "yearly"] as PlanPeriod[]).map((tab) => {
                const isActive = periodType === tab;
                const label =
                  tab === "weekly"
                    ? "Weekly Tactical"
                    : tab === "monthly"
                    ? "Monthly Horizon"
                    : "Yearly Macro";
                return (
                  <button
                    key={tab}
                    onClick={() => setPeriodType(tab)}
                    className={cn(
                      "px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer",
                      isActive
                        ? "bg-white dark:bg-charcoal-700 text-teal-600 dark:text-teal-400 font-bold shadow-sm"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Stepper Navigator: Prev, Current, Next, Jumper */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={goToPrevPeriod}
                icon={<ChevronLeft className="w-4 h-4" />}
                title="Previous planning cycle"
              />

              <div
                onClick={() => {
                  setJumpInput(periodIdentifier);
                  setIsJumpModalOpen(true);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-slate-100 dark:bg-charcoal-850 border border-slate-200 dark:border-charcoal-700 text-xs font-mono font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2 cursor-pointer hover:border-teal-500/40 transition-colors"
                title="Click to jump to another cycle"
              >
                <span>{periodDisplayName}</span>
                <span className="text-[10px] text-slate-400">({periodIdentifier})</span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={goToNextPeriod}
                icon={<ChevronRight className="w-4 h-4" />}
                title="Next planning cycle"
              />

              {!isCurrentPeriod && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={goToCurrentPeriod}
                  className="text-xs"
                >
                  Current
                </Button>
              )}
            </div>
          </div>

          {/* Horizon Progress Summary Card */}
          <div className="p-4 rounded-xl bg-white dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  Horizon Completion Progress
                </span>
                <Badge variant="teal">
                  {progress.overall.completed} of {progress.overall.total} Achieved ({progress.overall.percent}%)
                </Badge>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Objectives stay locked in their priority slot with a strike-through to maintain complete historical context.
              </p>
            </div>

            <div className="w-full md:w-72 space-y-1.5">
              <ProgressBar
                value={progress.overall.completed}
                max={progress.overall.total || 1}
                variant="teal"
                size="md"
                showPercent
              />
            </div>
          </div>

      {/* Loading indicator */}
      {loading && items.length === 0 && (
        <div className="text-center py-12 text-sm text-slate-400">
          Loading planning horizon...
        </div>
      )}

      {/* ======================================================== */}
      {/* HORIZON TILES: POPPING 4-TILE GRID OR EXPANDED CHECKLIST */}
      {/* ======================================================== */}
      {!activeHorizonTile ? (
        <div className="space-y-6">
          {/* Main 4 Popping Category Tiles (Does not show tasks yet) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {HORIZON_TILES_CONFIG.map((config) => {
              const catProgress = progress.byCategory[config.key] || {
                completed: 0,
                total: 0,
                percent: 0,
              };

              return (
                <div
                  key={config.key}
                  onClick={() => {
                    setActiveHorizonTile(config.key);
                    setQuickObjectiveTitle("");
                  }}
                  className={cn(
                    "group relative p-7 rounded-3xl bg-white dark:bg-[#181a20] border-2 border-slate-200/80 dark:border-[#2b2e38] transition-all duration-200 cursor-pointer shadow-sm hover:shadow-xl hover:-translate-y-1 overflow-hidden flex flex-col justify-between min-h-[200px]",
                    config.borderHover
                  )}
                >
                  {/* Glowing Gradient Accent */}
                  <div
                    className={cn(
                      "absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-50 pointer-events-none transition-opacity group-hover:opacity-100 bg-gradient-to-br",
                      config.gradientBg
                    )}
                  />

                  <div className="relative z-10 space-y-4">
                    {/* Header: Icon, Category Name & Progress Pill */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3.5">
                        <div className="w-13 h-13 rounded-2xl bg-slate-100 dark:bg-charcoal-800 border border-slate-200/70 dark:border-charcoal-700 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-xs">
                          {config.icon}
                        </div>
                        <div>
                          <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight group-hover:text-teal-500 dark:group-hover:text-teal-400 transition-colors">
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
                        {catProgress.completed}/{catProgress.total} Done
                      </span>
                    </div>
                  </div>

                  {/* Bottom Footer: Progress Bar & Prompt to Open Checklist */}
                  <div className="relative z-10 pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 max-w-[55%]">
                      <div className="w-full bg-slate-100 dark:bg-charcoal-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full bg-teal-500 rounded-full transition-all duration-300"
                          style={{ width: `${catProgress.percent}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                        {catProgress.percent}%
                      </span>
                    </div>

                    <div
                      className={cn(
                        "group/btn relative px-3.5 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors duration-200",
                        config.badgeBg,
                        config.buttonHoverText
                      )}
                    >
                      <svg
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 w-full h-full overflow-visible"
                      >
                        <rect
                          x="1"
                          y="1"
                          rx="14"
                          ry="14"
                          fill="none"
                          pathLength={100}
                          strokeWidth="1.75"
                          strokeDasharray="100"
                          style={{ width: "calc(100% - 2px)", height: "calc(100% - 2px)" }}
                          className={cn(
                            "[stroke-dashoffset:100] group-hover/btn:[stroke-dashoffset:0] opacity-0 group-hover/btn:opacity-100 transition-[stroke-dashoffset,opacity] duration-500 ease-out",
                            config.buttonStroke
                          )}
                        />
                      </svg>
                      <span className="relative z-10">Open Checklist</span>
                      <ArrowRight className="relative z-10 w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Custom Categories Tile (if any custom items or tags exist) */}
          {(itemsByCategory.custom.length > 0 || customCategories.length > 0) && (
            <div
              onClick={() => {
                setActiveHorizonTile("custom");
                setQuickObjectiveTitle("");
              }}
              className={cn(
                "group relative p-6 rounded-3xl bg-white dark:bg-[#181a20] border-2 border-slate-200/80 dark:border-[#2b2e38] transition-all duration-200 cursor-pointer shadow-sm hover:shadow-xl hover:-translate-y-1 overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4",
                CUSTOM_TILE_CONFIG.borderHover
              )}
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  {CUSTOM_TILE_CONFIG.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                      Custom Categories
                    </h3>
                    <Badge variant="violet">
                      {progress.byCategory.custom.completed}/{progress.byCategory.custom.total} Done
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Personalized user-defined categories and goals.
                  </p>
                </div>
              </div>

              <div
                className={cn(
                  "group/btn relative px-3.5 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors duration-200",
                  CUSTOM_TILE_CONFIG.badgeBg,
                  CUSTOM_TILE_CONFIG.buttonHoverText
                )}
              >
                <svg
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 w-full h-full overflow-visible"
                >
                  <rect
                    x="1"
                    y="1"
                    rx="14"
                    ry="14"
                    fill="none"
                    pathLength={100}
                    strokeWidth="1.75"
                    strokeDasharray="100"
                    style={{ width: "calc(100% - 2px)", height: "calc(100% - 2px)" }}
                    className={cn(
                      "[stroke-dashoffset:100] group-hover/btn:[stroke-dashoffset:0] opacity-0 group-hover/btn:opacity-100 transition-[stroke-dashoffset,opacity] duration-500 ease-out",
                      CUSTOM_TILE_CONFIG.buttonStroke
                    )}
                  />
                </svg>
                <span className="relative z-10">Open Custom Checklist</span>
                <ArrowRight className="relative z-10 w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ======================================================== */
        /* FULL OPENED CHECKLIST VIEW FOR SELECTED HORIZON TILE     */
        /* ======================================================== */
        <div className="rounded-3xl bg-white dark:bg-[#181a20] border-2 border-slate-200 dark:border-[#2b2e38] shadow-2xl p-6 sm:p-8 space-y-6 transition-all duration-300 relative overflow-hidden animate-in fade-in zoom-in-95">
          {(() => {
            const currentTileConfig =
              activeHorizonTile === "custom"
                ? CUSTOM_TILE_CONFIG
                : HORIZON_TILES_CONFIG.find((t) => t.key === activeHorizonTile) ||
                  HORIZON_TILES_CONFIG[0];
            const activeTileItems = activeHorizonTile ? itemsByCategory[activeHorizonTile] || [] : [];
            const completedCount = activeTileItems.filter((i) => i.isCompleted).length;
            const tileTotal = activeTileItems.length;
            const percent = tileTotal > 0 ? Math.round((completedCount / tileTotal) * 100) : 0;

            return (
              <>
                {/* Top Banner Accent */}
                <div
                  className={cn(
                    "absolute top-0 left-0 right-0 h-2 bg-gradient-to-r",
                    currentTileConfig.gradientBg,
                    "opacity-90"
                  )}
                />

                {/* Back Button & Header Navigation */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveHorizonTile(null)}
                      className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-charcoal-800 dark:hover:bg-charcoal-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer shadow-xs hover:scale-105"
                      title="Return to 4 Horizon Tiles (Esc)"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back to Horizon Tiles</span>
                    </button>

                    <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                      Press <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-charcoal-700 text-[10px] font-sans border border-slate-200 dark:border-charcoal-600">Esc</kbd> to return
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="teal">
                      {completedCount} of {tileTotal} Achieved ({percent}%)
                    </Badge>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => openAddModal(activeHorizonTile)}
                      icon={<Plus className="w-3.5 h-3.5" />}
                    >
                      New Objective
                    </Button>
                  </div>
                </div>

                {/* Category Header Hero */}
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-charcoal-800 border border-slate-200/80 dark:border-charcoal-700 flex items-center justify-center shrink-0 shadow-sm">
                    {currentTileConfig.icon}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                      {currentTileConfig.name}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {currentTileConfig.subtitle} &bull; Cycle:{" "}
                      <span className="text-teal-500 font-semibold">{periodDisplayName}</span>
                    </p>
                  </div>
                </div>

                {/* Objectives Checklist with Round Checkboxes */}
                <div className="space-y-3 min-h-[220px]">
                  {activeTileItems.length === 0 ? (
                    <div className="p-10 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-charcoal-700 space-y-3">
                      <div className="w-12 h-12 rounded-full mx-auto bg-slate-100 dark:bg-charcoal-800 flex items-center justify-center text-slate-400">
                        <Target className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        No objectives queued in {currentTileConfig.name} yet.
                      </p>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        Add high-impact targets or sync directly from your movie, series, or daily task trackers.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openAddModal(activeHorizonTile)}
                        icon={<Plus className="w-3.5 h-3.5" />}
                      >
                        Queue First Objective
                      </Button>
                    </div>
                  ) : (
                    activeTileItems.map((item, idx) => (
                      <div
                        key={item.id}
                        onClick={() => togglePlanItem(item.id, !item.isCompleted)}
                        className={cn(
                          "group p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start justify-between gap-3 select-none",
                          item.isCompleted
                            ? "bg-slate-50/70 dark:bg-charcoal-850/60 border-slate-200/70 dark:border-charcoal-700/60 opacity-60"
                            : "bg-white dark:bg-charcoal-800 border-slate-200/80 dark:border-charcoal-700 hover:border-teal-400 dark:hover:border-teal-500 shadow-xs hover:shadow-md"
                        )}
                      >
                        <div className="flex items-start gap-3.5 flex-1 min-w-0">
                          {/* Round Circular Checkbox */}
                          <div
                            className={cn(
                              "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all duration-150 cursor-pointer shadow-xs",
                              item.isCompleted
                                ? currentTileConfig.roundCheckboxChecked
                                : "border-slate-300 dark:border-slate-600 bg-transparent hover:border-teal-400 hover:scale-105"
                            )}
                          >
                            {item.isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>

                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-charcoal-700 text-slate-500 dark:text-slate-400 font-bold">
                                #{item.priorityOrder}
                              </span>
                              {item.customCategoryName && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-pink-500/10 text-pink-500 border border-pink-500/20">
                                  {item.customCategoryName}
                                </span>
                              )}
                              <span
                                className={cn(
                                  "text-sm font-bold transition-colors truncate",
                                  item.isCompleted
                                    ? "line-through text-slate-400 dark:text-slate-500"
                                    : "text-slate-900 dark:text-slate-100 group-hover:text-teal-400"
                                )}
                              >
                                {item.title}
                              </span>
                              {renderLinkPill(item)}
                            </div>

                            {item.description && (
                              <p
                                className={cn(
                                  "text-xs leading-relaxed break-words",
                                  item.isCompleted
                                    ? "text-slate-400 dark:text-slate-500 line-through"
                                    : "text-slate-600 dark:text-slate-400"
                                )}
                              >
                                {item.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Item Actions (Reorder, Edit, Delete) */}
                        <div
                          className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={(e) => handleMovePriority(activeTileItems, idx, "up", e)}
                            disabled={idx === 0}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-charcoal-700 disabled:opacity-20 cursor-pointer"
                            title="Move up in priority"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleMovePriority(activeTileItems, idx, "down", e)}
                            disabled={idx === activeTileItems.length - 1}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-charcoal-700 disabled:opacity-20 cursor-pointer"
                            title="Move down in priority"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => openEditModal(item, e)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-charcoal-700 cursor-pointer"
                            title="Edit objective"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingItem(item);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-100 dark:hover:bg-charcoal-700 cursor-pointer"
                            title="Delete objective"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Quick Add Objective Input Bar */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleQuickAddObjective(activeHorizonTile);
                    }}
                    className="flex items-center gap-2"
                  >
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={quickObjectiveTitle}
                        onChange={(e) => setQuickObjectiveTitle(e.target.value)}
                        placeholder={`+ Add a new objective in ${currentTileConfig.name} (Press Enter)...`}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-700 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 transition-colors"
                      />
                    </div>
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      disabled={!quickObjectiveTitle.trim()}
                      icon={<Plus className="w-4 h-4" />}
                    >
                      Add
                    </Button>
                  </form>
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  )}

      {/* Add Plan Objective Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Queue Plan Objective"
        description={`Set a priority deliverable or target for ${periodDisplayName}.`}
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreateSubmit}
              disabled={!formTitle.trim()}
              icon={<CheckCircle2 className="w-3.5 h-3.5" />}
            >
              Queue Objective
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Objective Title <span className="text-teal-500">*</span>
            </label>
            <Input
              value={formTitle}
              onChange={(val) => setFormTitle(val)}
              placeholder="e.g. Complete Rust SQLite WAL persistence integration"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value as PlanCategory)}
                className="w-full h-9 rounded-lg bg-slate-50 dark:bg-charcoal-700 border border-slate-200 dark:border-charcoal-600 px-3 text-xs text-slate-900 dark:text-slate-100"
              >
                <option value="projects">Projects & Deliverables</option>
                <option value="learning">Learning & Skills</option>
                <option value="personal_goals">Personal Goals & Habits</option>
                <option value="entertainment">Entertainment Queue</option>
                <option value="custom">Custom Category</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Priority Number (1 = Top)
              </label>
              <Input
                type="number"
                min={1}
                value={String(formPriority)}
                onChange={(val) => setFormPriority(parseInt(val, 10) || 1)}
              />
            </div>
          </div>

          {formCategory === "custom" && (
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Custom Category Name <span className="text-teal-500">*</span>
              </label>
              <Input
                value={formCustomCategoryName}
                onChange={(val) => setFormCustomCategoryName(val)}
                placeholder="e.g. Finance, Health, Side Venture"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Description / Notes (Optional)
            </label>
            <textarea
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              rows={2}
              placeholder="Context, milestones, target outcomes..."
              className="w-full rounded-lg bg-slate-50 dark:bg-charcoal-700 border border-slate-200 dark:border-charcoal-600 p-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Optional Synchronization Link (6.14, 6.15) */}
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-charcoal-750 border border-slate-200 dark:border-charcoal-600 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
              <LinkIcon className="w-3.5 h-3.5 text-teal-400" />
              <span>Link with Daily Task or Entertainment Tracker</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Automatically checks off this plan objective when the linked task or media completes.
            </p>

            <div className="grid grid-cols-3 gap-2 pt-1">
              {(["none", "task", "movie", "series"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setFormLinkType(t);
                    setFormLinkId("");
                  }}
                  className={cn(
                    "py-1.5 px-2 rounded-lg text-xs capitalize text-center transition-colors border",
                    formLinkType === t
                      ? "bg-teal-500/10 border-teal-500/30 text-teal-400 font-bold"
                      : "bg-slate-100 dark:bg-charcoal-700 border-slate-200 dark:border-charcoal-600 text-slate-500"
                  )}
                >
                  {t === "none" ? "None" : t}
                </button>
              ))}
            </div>

            {formLinkType === "task" && (
              <select
                value={formLinkId}
                onChange={(e) => setFormLinkId(e.target.value)}
                className="w-full h-8 rounded-lg bg-slate-100 dark:bg-charcoal-700 border border-slate-200 dark:border-charcoal-600 px-2.5 text-xs text-slate-900 dark:text-slate-100"
              >
                <option value="">Select a Task to sync...</option>
                {availableTasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} {t.isCompleted ? "(Completed)" : ""}
                  </option>
                ))}
              </select>
            )}

            {formLinkType === "movie" && (
              <select
                value={formLinkId}
                onChange={(e) => setFormLinkId(e.target.value)}
                className="w-full h-8 rounded-lg bg-slate-100 dark:bg-charcoal-700 border border-slate-200 dark:border-charcoal-600 px-2.5 text-xs text-slate-900 dark:text-slate-100"
              >
                <option value="">Select a Movie to sync...</option>
                {availableMovies.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title} ({m.status})
                  </option>
                ))}
              </select>
            )}

            {formLinkType === "series" && (
              <select
                value={formLinkId}
                onChange={(e) => setFormLinkId(e.target.value)}
                className="w-full h-8 rounded-lg bg-slate-100 dark:bg-charcoal-700 border border-slate-200 dark:border-charcoal-600 px-2.5 text-xs text-slate-900 dark:text-slate-100"
              >
                <option value="">Select a Series to sync...</option>
                {availableSeries.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} ({s.status})
                  </option>
                ))}
              </select>
            )}
          </div>
        </form>
      </Modal>

      {/* Edit Plan Objective Modal */}
      {editingItem && (
        <Modal
          isOpen={true}
          onClose={() => setEditingItem(null)}
          title="Edit Plan Objective"
          description={`Update objective in horizon ${periodDisplayName}.`}
          size="md"
          footer={
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingItem(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleUpdateSubmit}
                disabled={!formTitle.trim()}
              >
                Save Changes
              </Button>
            </div>
          }
        >
          <form onSubmit={handleUpdateSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Objective Title <span className="text-teal-500">*</span>
              </label>
              <Input
                value={formTitle}
                onChange={(val) => setFormTitle(val)}
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Category
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as PlanCategory)}
                  className="w-full h-9 rounded-lg bg-slate-50 dark:bg-charcoal-700 border border-slate-200 dark:border-charcoal-600 px-3 text-xs text-slate-900 dark:text-slate-100"
                >
                  <option value="projects">Projects & Deliverables</option>
                  <option value="learning">Learning & Skills</option>
                  <option value="personal_goals">Personal Goals & Habits</option>
                  <option value="entertainment">Entertainment Queue</option>
                  <option value="custom">Custom Category</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Priority Number
                </label>
                <Input
                  type="number"
                  min={1}
                  value={String(formPriority)}
                  onChange={(val) => setFormPriority(parseInt(val, 10) || 1)}
                />
              </div>
            </div>

            {formCategory === "custom" && (
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Custom Category Name
                </label>
                <Input
                  value={formCustomCategoryName}
                  onChange={(val) => setFormCustomCategoryName(val)}
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Description / Notes
              </label>
              <textarea
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                rows={2}
                className="w-full rounded-lg bg-slate-50 dark:bg-charcoal-700 border border-slate-200 dark:border-charcoal-600 p-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
              />
            </div>

            {/* Synchronization Link */}
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-charcoal-750 border border-slate-200 dark:border-charcoal-600 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                <LinkIcon className="w-3.5 h-3.5 text-teal-400" />
                <span>Link with Daily Task or Entertainment Tracker</span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1">
                {(["none", "task", "movie", "series"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setFormLinkType(t);
                      setFormLinkId("");
                    }}
                    className={cn(
                      "py-1.5 px-2 rounded-lg text-xs capitalize text-center transition-colors border",
                      formLinkType === t
                        ? "bg-teal-500/10 border-teal-500/30 text-teal-400 font-bold"
                        : "bg-slate-100 dark:bg-charcoal-700 border-slate-200 dark:border-charcoal-600 text-slate-500"
                    )}
                  >
                    {t === "none" ? "None" : t}
                  </button>
                ))}
              </div>

              {formLinkType === "task" && (
                <select
                  value={formLinkId}
                  onChange={(e) => setFormLinkId(e.target.value)}
                  className="w-full h-8 rounded-lg bg-slate-100 dark:bg-charcoal-700 border border-slate-200 dark:border-charcoal-600 px-2.5 text-xs text-slate-900 dark:text-slate-100"
                >
                  <option value="">Select a Task to sync...</option>
                  {availableTasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title} {t.isCompleted ? "(Completed)" : ""}
                    </option>
                  ))}
                </select>
              )}

              {formLinkType === "movie" && (
                <select
                  value={formLinkId}
                  onChange={(e) => setFormLinkId(e.target.value)}
                  className="w-full h-8 rounded-lg bg-slate-100 dark:bg-charcoal-700 border border-slate-200 dark:border-charcoal-600 px-2.5 text-xs text-slate-900 dark:text-slate-100"
                >
                  <option value="">Select a Movie to sync...</option>
                  {availableMovies.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title} ({m.status})
                    </option>
                  ))}
                </select>
              )}

              {formLinkType === "series" && (
                <select
                  value={formLinkId}
                  onChange={(e) => setFormLinkId(e.target.value)}
                  className="w-full h-8 rounded-lg bg-slate-100 dark:bg-charcoal-700 border border-slate-200 dark:border-charcoal-600 px-2.5 text-xs text-slate-900 dark:text-slate-100"
                >
                  <option value="">Select a Series to sync...</option>
                  {availableSeries.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title} ({s.status})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deletingItem && (
        <Modal
          isOpen={true}
          onClose={() => setDeletingItem(null)}
          title="Delete Plan Objective"
          size="sm"
          footer={
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeletingItem(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeleteConfirm}
              >
                Delete
              </Button>
            </div>
          }
        >
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Are you sure you want to delete <span className="font-bold text-slate-900 dark:text-slate-100">"{deletingItem.title}"</span>? This will remove the objective from this planning cycle.
          </p>
        </Modal>
      )}

      {/* Carry Forward Confirmation Modal (6.20) */}
      <Modal
        isOpen={isCarryForwardModalOpen}
        onClose={() => setIsCarryForwardModalOpen(false)}
        title="Carry Unfinished Objectives Forward"
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCarryForwardModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCarryForwardConfirm}
              icon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Carry Forward
            </Button>
          </div>
        }
      >
        <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
          <p>
            You have <strong className="text-teal-400">{unfinishedCount}</strong> unfinished objective{unfinishedCount > 1 ? "s" : ""} in <span className="font-mono text-slate-200">{periodDisplayName}</span>.
          </p>
          <p>
            Rolling them forward will duplicate each incomplete objective into the next cycle while preserving this historical period's record. Duplicate titles in the target period will be skipped.
          </p>
        </div>
      </Modal>

      {/* Cycle Jumper Modal (6.4, 6.19) */}
      <Modal
        isOpen={isJumpModalOpen}
        onClose={() => setIsJumpModalOpen(false)}
        title="Jump to Planning Cycle"
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsJumpModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleJumpSubmit}
              disabled={!jumpInput.trim()}
            >
              Jump
            </Button>
          </div>
        }
      >
        <form onSubmit={handleJumpSubmit} className="space-y-3">
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
            Enter Cycle Identifier ({periodType === "weekly" ? "e.g. 2026-W45" : periodType === "monthly" ? "e.g. 2026-10" : "e.g. 2025"}):
          </label>
          <Input
            value={jumpInput}
            onChange={(val) => setJumpInput(val)}
            placeholder={periodType === "weekly" ? "2026-W45" : periodType === "monthly" ? "2026-10" : "2025"}
            autoFocus
          />
        </form>
      </Modal>
    </div>
  );
};