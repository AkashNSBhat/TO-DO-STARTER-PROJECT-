import React, { useState } from "react";
import {
  CheckSquare,
  Plus,
  RefreshCw,
  AlertTriangle,
  Search,
} from "lucide-react";
import { useTasks } from "../hooks";
import { TaskDetail, TaskFilter } from "../lib/db/types";
import { Button } from "../components/common/Button";
import { Input } from "../components/common/Input";
import {
  TaskFilterTabs,
  TaskList,
  TaskSkeleton,
  TaskEmptyState,
  TaskModal,
  TaskDeleteDialog,
  TaskQuickAdd,
  DailyGoalCard,
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
    categories,
    todayProgress,
    filter,
    setFilter,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    sortBy,
    setSortBy,
    counts,
    loading,
    error,
    refetch,
    toggleTask,
    createTask,
    quickAddTask,
    updateTask,
    deleteTask,
    updateGoal,
  } = useTasks(initialFilter);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<TaskDetail | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<TaskDetail | null>(null);

  const handleOpenCreateModal = () => {
    setTaskToEdit(null);
    setIsModalOpen(true);
    if (onNewTask) onNewTask();
  };

  const handleOpenEditModal = (task: TaskDetail) => {
    setTaskToEdit(task);
    setIsModalOpen(true);
  };

  const handleOpenDeleteDialog = (task: TaskDetail) => {
    setTaskToDelete(task);
  };

  // If initialTasks passed (e.g. for testing/SSR), use client filter, else use hook filteredTasks
  const displayTasks = initialTasks
    ? initialTasks.filter((t) => {
        if (filter === "all") return true;
        if (filter === "completed") return t.isCompleted;
        if (filter === "today")
          return (
            t.dueDate === "2026-11-16" ||
            (!t.isCompleted && t.dueDate && t.dueDate <= "2026-11-16")
          );
        if (filter === "upcoming")
          return !t.isCompleted && t.dueDate && t.dueDate > "2026-11-16";
        if (filter === "overdue")
          return !t.isCompleted && t.dueDate && t.dueDate < "2026-11-16";
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
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <CheckSquare className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Daily Tasks & Goals
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
            onClick={handleOpenCreateModal}
            icon={<Plus className="w-4 h-4" />}
          >
            New Task
          </Button>
        </div>
      </div>

      {/* Daily Goal Visual Tracker */}
      <DailyGoalCard
        completedCount={todayProgress.completedToday}
        targetCount={todayProgress.target}
        notes={todayProgress.target > 0 ? "Daily milestone tracker" : undefined}
        onUpdateGoal={updateGoal}
      />

      {/* Quick Add Inline Bar */}
      <TaskQuickAdd onQuickAdd={quickAddTask} />

      {/* Filter and Search Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 dark:border-charcoal-700 pb-3">
        {/* Segmented Filter Tabs */}
        <TaskFilterTabs
          activeFilter={filter}
          onFilterChange={setFilter}
          counts={counts}
        />

        {/* Search, Category, and Sorting Controls */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Category Filter Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs py-1.5 px-2.5 rounded-lg bg-slate-100 dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-600 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Sort Selector */}
          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as "priority" | "dueDate" | "title")
            }
            className="text-xs py-1.5 px-2.5 rounded-lg bg-slate-100 dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-600 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
          >
            <option value="priority">Sort: Priority</option>
            <option value="dueDate">Sort: Due Date</option>
            <option value="title">Sort: Title</option>
          </select>
        </div>
      </div>

      {/* Real-time Keyword Search */}
      <div className="max-w-md">
        <Input
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search deliverables by title, notes, or category..."
          icon={Search}
          clearable
          inputSize="sm"
        />
      </div>

      {/* Task List or Contextual Empty State */}
      {displayTasks.length === 0 ? (
        <TaskEmptyState filter={filter} onCreateTask={handleOpenCreateModal} />
      ) : (
        <TaskList
          tasks={displayTasks}
          filter={filter}
          onToggle={toggleTask}
          onEdit={handleOpenEditModal}
          onDelete={handleOpenDeleteDialog}
        />
      )}

      {/* Task Creation / Editing Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        taskToEdit={taskToEdit}
        categories={categories}
        onSave={async (payload) => {
          if ("id" in payload) {
            return await updateTask(payload);
          } else {
            return await createTask(payload);
          }
        }}
      />

      {/* Task Deletion Confirmation Dialog */}
      <TaskDeleteDialog
        isOpen={Boolean(taskToDelete)}
        onClose={() => setTaskToDelete(null)}
        task={taskToDelete}
        onConfirmDelete={deleteTask}
      />
    </div>
  );
};
