import React, { useState, useEffect } from "react";
import {
  Calendar,
  Flag,
  ListTodo,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  CheckCircle2,
  Circle,
  Clock,
} from "lucide-react";
import { TaskDetail, Priority, SubtaskDetail } from "../../lib/db/types";
import { Badge } from "../common/Badge";
import { CircularCheckbox } from "./CircularCheckbox";
import { ProgressBar } from "../common/ProgressBar";
import { DatabaseClient } from "../../lib/db/client";
import { cn } from "../../lib/utils";

export interface TaskCardProps {
  task: TaskDetail;
  onToggle: (taskId: string, isCompleted: boolean) => void;
  onEdit?: (task: TaskDetail) => void;
  onDelete?: (task: TaskDetail) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onToggle,
  onEdit,
  onDelete,
}) => {
  const isOverdue = !task.isCompleted && task.dueDate && task.dueDate < "2026-11-16";
  const isToday = task.dueDate === "2026-11-16";

  const [isExpanded, setIsExpanded] = useState(false);
  const [subtasks, setSubtasks] = useState<SubtaskDetail[]>([]);
  const [loadingSubtasks, setLoadingSubtasks] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");

  const loadSubtasks = async () => {
    try {
      setLoadingSubtasks(true);
      const res = await DatabaseClient.getSubtasks(task.id);
      setSubtasks(res);
    } finally {
      setLoadingSubtasks(false);
    }
  };

  useEffect(() => {
    if (isExpanded) {
      loadSubtasks();
    }
  }, [isExpanded, task.id]);

  const handleToggleSubtask = async (subtaskId: string, isCompleted: boolean) => {
    // Optimistic update
    setSubtasks((prev) =>
      prev.map((s) =>
        s.id === subtaskId
          ? {
              ...s,
              isCompleted,
              completedAt: isCompleted ? new Date().toISOString() : undefined,
            }
          : s
      )
    );
    await DatabaseClient.toggleSubtaskCompletion(subtaskId, isCompleted);
  };

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    const added = await DatabaseClient.addSubtask(task.id, newSubtaskTitle.trim());
    setSubtasks((prev) => [...prev, added]);
    setNewSubtaskTitle("");
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    setSubtasks((prev) => prev.filter((s) => s.id !== subtaskId));
    await DatabaseClient.deleteSubtask(subtaskId);
  };

  const subtaskProgress =
    subtasks.length > 0
      ? Math.round(
          (subtasks.filter((s) => s.isCompleted).length / subtasks.length) * 100
        )
      : 0;

  const renderPriorityBadge = (priority: Priority) => {
    switch (priority) {
      case "urgent":
        return (
          <Badge
            variant="danger"
            pill
            className="gap-1 font-semibold uppercase text-[10px] tracking-wider"
          >
            <Flag className="w-2.5 h-2.5 text-rose-500" />
            Urgent
          </Badge>
        );
      case "high":
        return (
          <Badge
            variant="warning"
            pill
            className="gap-1 font-semibold uppercase text-[10px] tracking-wider"
          >
            <Flag className="w-2.5 h-2.5 text-amber-500" />
            High
          </Badge>
        );
      case "medium":
        return (
          <Badge
            variant="teal"
            pill
            className="gap-1 font-semibold uppercase text-[10px] tracking-wider"
          >
            <Flag className="w-2.5 h-2.5 text-teal-500" />
            Medium
          </Badge>
        );
      case "low":
      default:
        return (
          <Badge
            variant="muted"
            pill
            className="gap-1 font-semibold uppercase text-[10px] tracking-wider"
          >
            <Flag className="w-2.5 h-2.5 text-slate-400" />
            Low
          </Badge>
        );
    }
  };

  const renderDueDatePill = () => {
    if (!task.dueDate) return null;

    if (isOverdue) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 select-none">
          <Calendar className="w-3 h-3 text-rose-500" />
          Overdue {task.dueDate}
        </span>
      );
    }

    if (isToday) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-500/20 select-none">
          <Calendar className="w-3 h-3 text-teal-600 dark:text-teal-400" />
          Today
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-charcoal-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-charcoal-600 select-none">
        <Calendar className="w-3 h-3 text-slate-400" />
        {task.dueDate}
      </span>
    );
  };

  return (
    <div
      className={cn(
        "rounded-xl border transition-all duration-150 overflow-hidden",
        task.isCompleted
          ? "bg-slate-50/70 dark:bg-charcoal-850/50 border-slate-200/60 dark:border-charcoal-700/60 opacity-65"
          : "bg-white dark:bg-charcoal-800 border-slate-200 dark:border-charcoal-600 hover:border-slate-300 dark:hover:border-charcoal-500 shadow-xs"
      )}
    >
      {/* Main Task Row */}
      <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        {/* Left section: Checkbox, Title, Description */}
        <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
          <div className="pt-0.5 sm:pt-0">
            <CircularCheckbox
              checked={task.isCompleted}
              onToggle={(checked) => onToggle(task.id, checked)}
              label={task.title}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4
                className={cn(
                  "text-sm font-semibold truncate transition-colors",
                  task.isCompleted
                    ? "line-through text-slate-400 dark:text-slate-500"
                    : "text-slate-900 dark:text-slate-100"
                )}
              >
                {task.title}
              </h4>
              {task.isCompleted && task.completedAt && (
                <span className="text-[10px] font-mono text-emerald-500 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  {task.completedAt.slice(11, 16)}
                </span>
              )}
            </div>

            {task.description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {task.description}
              </p>
            )}
          </div>
        </div>

        {/* Right section: Category, Priority, Due Date, Subtask Toggle, Actions */}
        <div className="flex items-center flex-wrap gap-2 shrink-0 self-end sm:self-auto pl-8 sm:pl-0">
          {/* Category Badge with Color Dot */}
          <Badge variant="default" pill className="gap-1.5 font-medium text-xs">
            {task.categoryColor && (
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: task.categoryColor }}
              />
            )}
            <span>{task.categoryName}</span>
          </Badge>

          {/* Priority Badge */}
          {renderPriorityBadge(task.priority)}

          {/* Due Date Calendar Pill */}
          {renderDueDatePill()}

          {/* Subtask Count Pill / Expand Toggle */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono transition-colors cursor-pointer",
              isExpanded
                ? "bg-teal-500/10 text-teal-400 border border-teal-500/20"
                : "bg-slate-100 dark:bg-charcoal-700/60 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-charcoal-600 hover:text-teal-400"
            )}
            title="Toggle Subtask Checklist"
          >
            <ListTodo className="w-3 h-3" />
            <span>
              {task.completedSubtasksCount}/{task.subtasksCount}
            </span>
            {isExpanded ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-1 pl-1 border-l border-slate-200 dark:border-charcoal-700">
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(task)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-charcoal-700 transition-colors cursor-pointer"
                title="Edit Task"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}

            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(task)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-charcoal-700 transition-colors cursor-pointer"
                title="Delete Task"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Subtasks Drawer */}
      {isExpanded && (
        <div className="px-5 py-3.5 bg-slate-50/80 dark:bg-charcoal-900/60 border-t border-slate-200/80 dark:border-charcoal-700/80 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Checklist Progress
            </span>
            <span className="text-[11px] font-mono text-teal-400 font-bold">
              {subtaskProgress}%
            </span>
          </div>

          <ProgressBar
            value={subtaskProgress}
            max={100}
            variant="teal"
            size="sm"
          />

          {/* Subtasks list */}
          {loadingSubtasks ? (
            <p className="text-xs text-slate-400 py-1">Loading checklist...</p>
          ) : (
            <div className="space-y-1.5 pt-1">
              {subtasks.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-charcoal-800 border border-slate-200/80 dark:border-charcoal-700/60 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => handleToggleSubtask(sub.id, !sub.isCompleted)}
                      className={cn(
                        "w-4 h-4 rounded-full flex items-center justify-center shrink-0 cursor-pointer",
                        sub.isCompleted
                          ? "text-emerald-400"
                          : "text-slate-400 hover:text-teal-400"
                      )}
                    >
                      {sub.isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 fill-emerald-500/20" />
                      ) : (
                        <Circle className="w-4 h-4 stroke-[1.5]" />
                      )}
                    </button>
                    <span
                      className={cn(
                        "truncate",
                        sub.isCompleted
                          ? "line-through text-slate-400 dark:text-slate-500"
                          : "text-slate-800 dark:text-slate-200"
                      )}
                    >
                      {sub.title}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteSubtask(sub.id)}
                    className="text-slate-400 hover:text-rose-400 ml-2 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add Subtask input */}
          <form onSubmit={handleAddSubtask} className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              placeholder="Add next checklist item..."
              className="flex-1 text-xs py-1.5 px-3 rounded-lg bg-white dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
            <button
              type="submit"
              disabled={!newSubtaskTitle.trim()}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-teal-500 text-charcoal-950 disabled:opacity-50 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
