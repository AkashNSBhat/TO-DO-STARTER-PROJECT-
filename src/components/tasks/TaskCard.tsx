import React from "react";
import { Calendar, Flag, ListTodo } from "lucide-react";
import { TaskDetail, Priority } from "../../lib/db/types";
import { Badge } from "../common/Badge";
import { CircularCheckbox } from "./CircularCheckbox";

export interface TaskCardProps {
  task: TaskDetail;
  onToggle: (taskId: string, isCompleted: boolean) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onToggle }) => {
  const isOverdue = !task.isCompleted && task.dueDate && task.dueDate < "2026-11-16";
  const isToday = task.dueDate === "2026-11-16";

  const renderPriorityBadge = (priority: Priority) => {
    switch (priority) {
      case "urgent":
        return (
          <Badge variant="danger" pill className="gap-1 font-semibold uppercase text-[10px] tracking-wider">
            <Flag className="w-2.5 h-2.5 text-rose-500" />
            Urgent
          </Badge>
        );
      case "high":
        return (
          <Badge variant="warning" pill className="gap-1 font-semibold uppercase text-[10px] tracking-wider">
            <Flag className="w-2.5 h-2.5 text-amber-500" />
            High
          </Badge>
        );
      case "medium":
        return (
          <Badge variant="teal" pill className="gap-1 font-semibold uppercase text-[10px] tracking-wider">
            <Flag className="w-2.5 h-2.5 text-teal-500" />
            Medium
          </Badge>
        );
      case "low":
      default:
        return (
          <Badge variant="muted" pill className="gap-1 font-semibold uppercase text-[10px] tracking-wider">
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
      className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 ${
        task.isCompleted
          ? "bg-slate-50/70 dark:bg-charcoal-850/50 border-slate-200/60 dark:border-charcoal-700/60 opacity-65"
          : "bg-white dark:bg-charcoal-800 border-slate-200 dark:border-charcoal-600 hover:border-slate-300 dark:hover:border-charcoal-500 shadow-xs"
      }`}
    >
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
          <h4
            className={`text-sm font-semibold truncate transition-colors ${
              task.isCompleted
                ? "line-through text-slate-400 dark:text-slate-500"
                : "text-slate-900 dark:text-slate-100"
            }`}
          >
            {task.title}
          </h4>
          {task.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
              {task.description}
            </p>
          )}
        </div>
      </div>

      {/* Right section: Category, Priority, Due Date, Subtask Count */}
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

        {/* Subtask Count Pill */}
        {task.subtasksCount > 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-charcoal-700/60 border border-slate-200 dark:border-charcoal-600">
            <ListTodo className="w-3 h-3 text-slate-400" />
            {task.completedSubtasksCount}/{task.subtasksCount}
          </span>
        )}
      </div>
    </div>
  );
};
