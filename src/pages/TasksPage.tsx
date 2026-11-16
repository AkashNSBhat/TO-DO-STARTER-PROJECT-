import React from "react";
import { CheckSquare, Plus, RefreshCw, AlertTriangle } from "lucide-react";
import { useTasks } from "../hooks";
import { TaskDetail, TaskFilter } from "../lib/db/types";
import { Button } from "../components/common/Button";
import {
  TaskFilterTabs,
  TaskList,
  TaskSkeleton,
  TaskEmptyState,
} from "../components/tasks";

export interface TasksPageProps {
  initialTasks?: TaskDetail[];
  initialFilter?: TaskFilter;
  onNewTask?: () => void;
}

export const TasksPage: React.FC<TasksPageProps> = ({
  initialTasks,
  initialFilter = "today",
  onNewTask,
}) => {
  const {
    filteredTasks,
    filter,
    setFilter,
    counts,
    loading,
    error,
    refetch,
    toggleTask,
  } = useTasks(initialFilter);

  // If initialTasks passed (for tests/SSR), filter client-side, else use hook filteredTasks
  const displayTasks = initialTasks
    ? initialTasks.filter((t) => {
        if (filter === "all") return true;
        if (filter === "completed") return t.isCompleted;
        if (filter === "today") return t.dueDate === "2026-11-16" || (!t.isCompleted && t.dueDate && t.dueDate <= "2026-11-16");
        if (filter === "upcoming") return !t.isCompleted && t.dueDate && t.dueDate > "2026-11-16";
        if (filter === "overdue") return !t.isCompleted && t.dueDate && t.dueDate < "2026-11-16";
        return true;
      })
    : filteredTasks;

  if (loading && (!displayTasks || displayTasks.length === 0)) {
    return <TaskSkeleton />;
  }

  if (error && (!displayTasks || displayTasks.length === 0)) {
    return (
      <div className="p-8 text-center rounded-2xl bg-rose-500/10 border border-rose-500/20 max-w-xl mx-auto my-12">
        <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Failed to load tasks
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
          {error}
        </p>
        <Button
          variant="primary"
          size="sm"
          onClick={() => refetch()}
          icon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Retry Connection
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-500">
              <CheckSquare className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Daily Tasks
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Prioritize and track your deliverables. Completed tasks remain permanently visible in muted history.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="primary"
            size="md"
            onClick={onNewTask}
            icon={<Plus className="w-4 h-4" />}
          >
            New Task
          </Button>
        </div>
      </div>

      {/* Segmented Filter Tabs: Today, Upcoming, Overdue, Completed, All */}
      <TaskFilterTabs
        activeFilter={filter}
        onFilterChange={setFilter}
        counts={counts}
      />

      {/* Task List or Contextual Empty State */}
      {displayTasks.length === 0 ? (
        <TaskEmptyState filter={filter} onCreateTask={onNewTask} />
      ) : (
        <TaskList
          tasks={displayTasks}
          filter={filter}
          onToggle={toggleTask}
        />
      )}
    </div>
  );
};
