import React, { useState, useMemo } from "react";
import {
  CalendarRange,
  Plus,
  CheckCircle2,
  Circle,
  Film,
  BookOpen,
  Target,
  Briefcase,
  Link as LinkIcon,
} from "lucide-react";
import { usePlan } from "../hooks";
import { PlanItem, PlanPeriod, PlanCategory } from "../lib/db/types";
import { Button } from "../components/common/Button";
import { Badge } from "../components/common/Badge";
import { Input } from "../components/common/Input";
import { Modal } from "../components/common/Modal";
import { ProgressBar } from "../components/common/ProgressBar";
import { cn } from "../lib/utils";

export const PlanPage: React.FC = () => {
  const {
    periodType,
    setPeriodType,
    periodIdentifier,
    items,
    togglePlanItem,
  } = usePlan("weekly");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Objective Form State
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<PlanCategory>("projects");
  const [newDesc, setNewDesc] = useState("");
  const [newPriority, setNewPriority] = useState<string>("1");

  // Computed Horizon Metrics
  const metrics = useMemo(() => {
    const total = items.length;
    const completed = items.filter((i) => i.isCompleted).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percent };
  }, [items]);

  // Categories configuration
  const categoriesConfig: {
    key: PlanCategory;
    title: string;
    icon: React.ReactNode;
    color: string;
  }[] = [
    {
      key: "entertainment",
      title: "Entertainment Queue",
      icon: <Film className="w-4 h-4 text-violet-400" />,
      color: "border-violet-500/20 bg-violet-500/5",
    },
    {
      key: "learning",
      title: "Learning & Skills",
      icon: <BookOpen className="w-4 h-4 text-teal-400" />,
      color: "border-teal-500/20 bg-teal-500/5",
    },
    {
      key: "personal_goals",
      title: "Personal Goals & Habits",
      icon: <Target className="w-4 h-4 text-emerald-400" />,
      color: "border-emerald-500/20 bg-emerald-500/5",
    },
    {
      key: "projects",
      title: "Projects & Deliverables",
      icon: <Briefcase className="w-4 h-4 text-amber-400" />,
      color: "border-amber-500/20 bg-amber-500/5",
    },
  ];

  // Group items by category
  const groupedItems = useMemo(() => {
    const map: Record<PlanCategory, PlanItem[]> = {
      entertainment: [],
      learning: [],
      personal_goals: [],
      projects: [],
    };

    for (const item of items) {
      if (map[item.category]) {
        map[item.category].push(item);
      } else {
        map.projects.push(item);
      }
    }

    return map;
  }, [items]);

  const handleCreateObjective = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const created: PlanItem = {
      id: `plan-${Date.now()}`,
      periodType,
      periodIdentifier,
      category: newCategory,
      title: newTitle.trim(),
      description: newDesc.trim() || undefined,
      priorityOrder: parseInt(newPriority, 10) || 1,
      isCompleted: false,
    };

    items.push(created);
    setIsAddModalOpen(false);
    setNewTitle("");
    setNewDesc("");
  };

  const periodDisplayName = useMemo(() => {
    switch (periodType) {
      case "weekly":
        return "Current Horizon: Week 47, 2026 (Nov 16 - Nov 22)";
      case "monthly":
        return "Current Horizon: November 2026";
      case "yearly":
        return "Macro Horizon: Full Year 2026";
      default:
        return periodIdentifier;
    }
  }, [periodType, periodIdentifier]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <CalendarRange className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Planning Module (PLAN)
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Multi-horizon tactical and macro goals. Completed objectives remain visible and greyed out to maintain historical context.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsAddModalOpen(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            New Objective
          </Button>
        </div>
      </div>

      {/* Horizon Switcher Tabs & Period Navigator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-charcoal-700 pb-3">
        {/* Horizon Tabs */}
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

        {/* Period Identifier & Steppers */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-charcoal-850 border border-slate-200 dark:border-charcoal-700 text-xs font-mono font-medium text-slate-700 dark:text-slate-300">
            {periodDisplayName}
          </div>
        </div>
      </div>

      {/* Horizon Progress Card */}
      <div className="p-4 rounded-xl bg-white dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-700 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
              Horizon Completion Rate
            </span>
            <Badge variant="teal">
              {metrics.completed} of {metrics.total} Achieved
            </Badge>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Finished objectives stay locked in position with strikethrough styling to preserve completion context.
          </p>
        </div>

        <div className="w-full sm:w-60 space-y-1.5">
          <ProgressBar
            value={metrics.completed}
            max={metrics.total || 1}
            variant="teal"
            size="md"
            showPercent
          />
        </div>
      </div>

      {/* Categorized Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {categoriesConfig.map((col) => {
          const colItems = groupedItems[col.key];
          const completedCount = colItems.filter((i) => i.isCompleted).length;

          return (
            <div
              key={col.key}
              className={cn(
                "rounded-xl border p-4.5 bg-white dark:bg-charcoal-800/80 transition-all flex flex-col justify-between space-y-3",
                col.color
              )}
            >
              {/* Category Column Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-charcoal-700/60">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-charcoal-900/60 border border-charcoal-700">
                    {col.icon}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {col.title}
                  </h3>
                </div>
                <span className="text-[11px] font-mono font-medium text-slate-500 dark:text-slate-400">
                  {completedCount}/{colItems.length}
                </span>
              </div>

              {/* Items in Category */}
              <div className="space-y-2.5 min-h-[120px]">
                {colItems.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400 italic">
                    No objectives queued in {col.title.toLowerCase()}.
                  </div>
                ) : (
                  colItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => togglePlanItem(item.id, !item.isCompleted)}
                      className={cn(
                        "group p-3 rounded-lg border transition-all cursor-pointer flex items-start justify-between gap-3 select-none",
                        item.isCompleted
                          ? "bg-slate-50/60 dark:bg-charcoal-850/60 border-slate-200 dark:border-charcoal-700/60 opacity-60"
                          : "bg-white dark:bg-charcoal-750 border-slate-200 dark:border-charcoal-600/80 hover:border-teal-500/40 shadow-xs"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          className={cn(
                            "w-5 h-5 rounded-full mt-0.5 flex items-center justify-center transition-colors shrink-0",
                            item.isCompleted
                              ? "text-emerald-400"
                              : "text-slate-400 hover:text-teal-400"
                          )}
                        >
                          {item.isCompleted ? (
                            <CheckCircle2 className="w-5 h-5 fill-emerald-500/20" />
                          ) : (
                            <Circle className="w-5 h-5 stroke-[1.5]" />
                          )}
                        </button>

                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-charcoal-700 text-slate-500 dark:text-slate-400 font-bold">
                              #{item.priorityOrder}
                            </span>
                            <span
                              className={cn(
                                "text-xs font-semibold transition-colors",
                                item.isCompleted
                                  ? "line-through text-slate-400 dark:text-slate-500"
                                  : "text-slate-900 dark:text-slate-100 group-hover:text-teal-400"
                              )}
                            >
                              {item.title}
                            </span>
                          </div>

                          {item.description && (
                            <p
                              className={cn(
                                "text-[11px] leading-relaxed",
                                item.isCompleted
                                  ? "text-slate-400 dark:text-slate-500 line-through"
                                  : "text-slate-500 dark:text-slate-400"
                              )}
                            >
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Linked Badge if applicable */}
                      {(item.linkedTaskId || item.linkedMovieId || item.linkedSeriesId) && (
                        <span
                          className="shrink-0 p-1 text-slate-400 hover:text-teal-400"
                          title="Synchronized with Tracker Item"
                        >
                          <LinkIcon className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Add quickly to column */}
              <div className="pt-2 border-t border-slate-200/40 dark:border-charcoal-700/40">
                <button
                  onClick={() => {
                    setNewCategory(col.key);
                    setIsAddModalOpen(true);
                  }}
                  className="w-full py-1.5 rounded-lg text-[11px] text-slate-500 dark:text-slate-400 hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-charcoal-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add {col.title} item</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Plan Objective Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="New Plan Objective"
        description={`Set a deliverable or target for horizon ${periodIdentifier}.`}
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
              onClick={handleCreateObjective}
              disabled={!newTitle.trim()}
              icon={<CheckCircle2 className="w-3.5 h-3.5" />}
            >
              Queue Objective
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreateObjective} className="space-y-4">
          <Input
            label="Objective Title *"
            value={newTitle}
            onChange={setNewTitle}
            placeholder="e.g. Master Rust async concurrency"
            required
            autoFocus
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Horizon Category
              </label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as PlanCategory)}
                className="w-full text-xs py-2 px-3 rounded-lg bg-slate-100 dark:bg-charcoal-700 border border-slate-200 dark:border-charcoal-600 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                <option value="entertainment">Entertainment Queue</option>
                <option value="learning">Learning & Skills</option>
                <option value="personal_goals">Personal Goals & Habits</option>
                <option value="projects">Projects & Deliverables</option>
              </select>
            </div>

            <Input
              label="Priority Number (1 = Highest)"
              value={newPriority}
              onChange={setNewPriority}
              type="number"
              min="1"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Description & Milestone Targets
            </label>
            <textarea
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Key sub-goals, target chapters, or deliverables..."
              rows={3}
              className="w-full text-xs p-2.5 rounded-lg bg-slate-100 dark:bg-charcoal-700 border border-slate-200 dark:border-charcoal-600 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500 resize-none"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
