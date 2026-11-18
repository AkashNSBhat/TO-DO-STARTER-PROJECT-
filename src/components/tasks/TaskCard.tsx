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
  MoreHorizontal,
} from "lucide-react";
import { TaskDetail, Priority, SubtaskDetail } from "../../lib/db/types";
import { Badge } from "../common/Badge";
import { CircularCheckbox } from "./CircularCheckbox";
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
  const [showMenu, setShowMenu] = useState(false);

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

  // Progress metrics
  const totalSubtasks = task.subtasksCount || subtasks.length || 0;
  const completedSubtasks = task.completedSubtasksCount || subtasks.filter((s) => s.isCompleted).length || 0;
  
  // Fractional display (e.g. 7/10 or 4/10 as seen in Figma screenshot)
  const progressRatioText =
    totalSubtasks > 0
      ? `${completedSubtasks}/${totalSubtasks}`
      : task.isCompleted
      ? "10/10"
      : "0/1";

  const progressPercent = task.isCompleted
    ? 100
    : totalSubtasks > 0
    ? Math.round((completedSubtasks / totalSubtasks) * 100)
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
            <Flag className="w-2.5 h-2.5 text-blue-500" />
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

  return (
    <div
      className={cn(
        "rounded-2xl border transition-all duration-200 overflow-hidden relative group",
        task.isCompleted
          ? "bg-slate-50/70 dark:bg-[#1a1c22]/60 border-slate-200/60 dark:border-[#282c35]/60 opacity-70"
          : "bg-white dark:bg-[#21242b] border-slate-200/90 dark:border-[#2c3038] hover:border-blue-400/50 dark:hover:border-slate-700 shadow-sm hover:shadow-md"
      )}
    >
      <div className="p-4 space-y-3">
        {/* Top Header: Title, Category/Project Subtitle, Menu */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="pt-0.5">
              <CircularCheckbox
                checked={task.isCompleted}
                onToggle={(checked) => onToggle(task.id, checked)}
                label={task.title}
              />
            </div>

            <div className="min-w-0 flex-1">
              <h4
                className={cn(
                  "text-sm font-semibold truncate transition-colors tracking-tight",
                  task.isCompleted
                    ? "line-through text-slate-400 dark:text-slate-500"
                    : "text-slate-900 dark:text-slate-100"
                )}
              >
                {task.title}
              </h4>
              <p className="text-xs text-slate-400 dark:text-slate-400 truncate mt-0.5 font-medium">
                {task.categoryName || "General Task"}
                {task.description && ` • ${task.description}`}
              </p>
            </div>
          </div>

          {/* Three dots menu button */}
          <div className="relative shrink-0">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="More options"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-32 rounded-xl bg-white dark:bg-[#1a1c22] border border-slate-200 dark:border-[#2c3038] shadow-xl py-1 z-30 animate-fadeIn">
                {onEdit && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onEdit(task);
                    }}
                    className="w-full px-3 py-1.5 text-xs text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-blue-500" />
                    Edit Task
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onDelete(task);
                    }}
                    className="w-full px-3 py-1.5 text-xs text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center gap-2 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ======================================================= */}
        {/* The Signature Figma Progress Bar                        */}
        {/* ======================================================= */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <ListTodo className="w-3.5 h-3.5 text-slate-400" />
              <span>Progress</span>
            </span>
            <span className="font-mono font-semibold text-slate-700 dark:text-slate-300 text-[11px]">
              {progressRatioText}
            </span>
          </div>

          {/* Progress Bar Track with Vibrant Orange or Green Fill */}
          <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-300",
                task.isCompleted
                  ? "bg-[#22c55e]" // Vibrant Neon Lime when done
                  : "bg-[#ff783e]" // Warm Tangerine Orange when in progress
              )}
              style={{ width: `${Math.max(8, progressPercent)}%` }}
            />
          </div>
        </div>

        {/* Footer Meta Row: Date Pill, Priority Flag, Subtasks Drawer Toggle */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            {/* Date Pill (Figma style) */}
            {task.dueDate && (
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border select-none",
                  isOverdue
                    ? "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20"
                    : isToday
                    ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20"
                    : "bg-slate-50 dark:bg-[#1a1c22] text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-[#2c3038]"
                )}
              >
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>{isToday ? "Today" : task.dueDate}</span>
              </span>
            )}

            {/* Priority flag */}
            {renderPriorityBadge(task.priority)}
          </div>

          {/* Subtask Count Pill / Expand Toggle */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer",
              isExpanded
                ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20"
                : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            )}
            title="Toggle Subtask Checklist"
          >
            <span>{totalSubtasks > 0 ? `${completedSubtasks}/${totalSubtasks}` : "Checklist"}</span>
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Subtasks Drawer */}
      {isExpanded && (
        <div className="px-5 py-3.5 bg-slate-50/80 dark:bg-[#181a20] border-t border-slate-200/80 dark:border-[#282c35] space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Checklist Items
            </span>
            <span className="text-[11px] font-mono text-blue-500 font-bold">
              {progressPercent}%
            </span>
          </div>

          {/* Subtasks list */}
          {loadingSubtasks ? (
            <p className="text-xs text-slate-400 py-1">Loading checklist...</p>
          ) : (
            <div className="space-y-1.5 pt-1">
              {subtasks.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#21242b] border border-slate-200/80 dark:border-[#2c3038] text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => handleToggleSubtask(sub.id, !sub.isCompleted)}
                      className={cn(
                        "w-4 h-4 rounded-full flex items-center justify-center shrink-0 cursor-pointer",
                        sub.isCompleted
                          ? "text-emerald-500"
                          : "text-slate-400 hover:text-blue-500"
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
                          : "text-slate-800 dark:text-slate-200 font-medium"
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
              className="flex-1 text-xs py-1.5 px-3 rounded-xl bg-white dark:bg-[#21242b] border border-slate-200 dark:border-[#2c3038] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={!newSubtaskTitle.trim()}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 cursor-pointer transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
