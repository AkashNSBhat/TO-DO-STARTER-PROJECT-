import React, { useState } from "react";
import {
  Plus,
  RefreshCw,
  AlertTriangle,
  Search,
  LayoutGrid,
  List,
} from "lucide-react";
import { useTasks } from "../hooks";
import { TaskDetail, TaskFilter, CreateTaskInput, UpdateTaskInput } from "../lib/db/types";
import { Button } from "../components/common/Button";
import { Input } from "../components/common/Input";
import {
  TaskFilterTabs,
  TaskList,
  TaskCard,
  TaskSkeleton,
  TaskEmptyState,
  TaskModal,
  TaskDeleteDialog,
  TaskQuickAdd,
  DailyGoalCard,
} from "../components/tasks";
import { cn } from "../lib/utils";

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

  // View mode switcher: "board" (Kanban) or "list" (Linear/List)
  const [viewMode, setViewMode] = useState<"board" | "list">("board");

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

  // Board columns (To do, In progress, Done)
  const todoTasks = displayTasks.filter(
    (t) => !t.isCompleted && (t.status === "todo" || (!t.status && !t.completedSubtasksCount))
  );
  const inProgressTasks = displayTasks.filter(
    (t) =>
      !t.isCompleted &&
      (t.status === "in_progress" || (t.completedSubtasksCount && t.completedSubtasksCount > 0))
  );
  const doneTasks = displayTasks.filter((t) => t.isCompleted || t.status === "completed");

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
      {/* ========================================================= */}
      {/* 1. TOP BAR: View Switcher (Board/List) & Action Buttons   */}
      {/* ========================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-[#282c35] pb-4">
        {/* View Switcher Tabs (Figma style) */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => setViewMode("board")}
            className={cn(
              "flex items-center gap-2 pb-2 text-sm font-semibold transition-all relative cursor-pointer",
              viewMode === "board"
                ? "text-blue-600 dark:text-blue-400"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            )}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Board view</span>
            {viewMode === "board" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "flex items-center gap-2 pb-2 text-sm font-semibold transition-all relative cursor-pointer",
              viewMode === "list"
                ? "text-blue-600 dark:text-blue-400"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            )}
          >
            <List className="w-4 h-4" />
            <span>List view</span>
            {viewMode === "list" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
            )}
          </button>
        </div>

        {/* Right Action Tools: Filter, Sort, New Task (Royal Blue Button) */}
        <div className="flex items-center gap-2.5">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs py-2 px-3 rounded-xl bg-white dark:bg-[#1f2228] border border-slate-200 dark:border-[#2c3038] text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-xs"
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
            className="text-xs py-2 px-3 rounded-xl bg-white dark:bg-[#1f2228] border border-slate-200 dark:border-[#2c3038] text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-xs"
          >
            <option value="priority">Sort: Priority</option>
            <option value="dueDate">Sort: Due Date</option>
            <option value="title">Sort: Title</option>
          </select>

          {/* Primary Action Button (Electric Royal Blue from Figma) */}
          <Button
            variant="primary"
            size="md"
            onClick={handleOpenCreateModal}
            icon={<Plus className="w-4 h-4" />}
          >
            New task
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

      {/* Search Bar & Smart Filter Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <TaskFilterTabs
          activeFilter={filter}
          onFilterChange={setFilter}
          counts={counts}
        />

        <div className="w-full md:w-72">
          <Input
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search tasks..."
            icon={Search}
            clearable
            inputSize="sm"
          />
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. MAIN WORKSPACE VIEW (Board / Kanban or List)           */}
      {/* ========================================================= */}
      {displayTasks.length === 0 ? (
        <TaskEmptyState filter={filter} onCreateTask={handleOpenCreateModal} />
      ) : viewMode === "board" ? (
        /* KANBAN BOARD VIEW (Exact Figma Design System) */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
          {/* Column 1: To Do */}
          <div className="space-y-3 bg-slate-100/50 dark:bg-[#16181d]/50 p-3.5 rounded-2xl border border-slate-200/60 dark:border-[#252830]">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-800 dark:text-slate-200">To do</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {todoTasks.length}
                </span>
              </div>
              <button
                onClick={handleOpenCreateModal}
                className="text-xs font-medium text-slate-400 hover:text-blue-500 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add new task</span>
              </button>
            </div>

            <div className="space-y-3">
              {todoTasks.map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  onToggle={toggleTask}
                  onEdit={handleOpenEditModal}
                  onDelete={handleOpenDeleteDialog}
                />
              ))}
              {todoTasks.length === 0 && (
                <div className="p-6 text-center text-xs text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  No tasks waiting in To do
                </div>
              )}
            </div>
          </div>

          {/* Column 2: In progress */}
          <div className="space-y-3 bg-slate-100/50 dark:bg-[#16181d]/50 p-3.5 rounded-2xl border border-slate-200/60 dark:border-[#252830]">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-800 dark:text-slate-200">In progress</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500 dark:text-orange-400">
                  {inProgressTasks.length}
                </span>
              </div>
              <button
                onClick={handleOpenCreateModal}
                className="text-xs font-medium text-slate-400 hover:text-blue-500 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add new task</span>
              </button>
            </div>

            <div className="space-y-3">
              {inProgressTasks.map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  onToggle={toggleTask}
                  onEdit={handleOpenEditModal}
                  onDelete={handleOpenDeleteDialog}
                />
              ))}
              {inProgressTasks.length === 0 && (
                <div className="p-6 text-center text-xs text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  No tasks currently in progress
                </div>
              )}
            </div>
          </div>

          {/* Column 3: Done */}
          <div className="space-y-3 bg-slate-100/50 dark:bg-[#16181d]/50 p-3.5 rounded-2xl border border-slate-200/60 dark:border-[#252830]">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-800 dark:text-slate-200">Done</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 dark:text-emerald-400">
                  {doneTasks.length}
                </span>
              </div>
              <button
                onClick={handleOpenCreateModal}
                className="text-xs font-medium text-slate-400 hover:text-blue-500 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add new task</span>
              </button>
            </div>

            <div className="space-y-3">
              {doneTasks.map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  onToggle={toggleTask}
                  onEdit={handleOpenEditModal}
                  onDelete={handleOpenDeleteDialog}
                />
              ))}
              {doneTasks.length === 0 && (
                <div className="p-6 text-center text-xs text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  No completed tasks yet
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* LIST VIEW */
        <TaskList
          tasks={displayTasks}
          filter={filter}
          onToggle={toggleTask}
          onEdit={handleOpenEditModal}
          onDelete={handleOpenDeleteDialog}
        />
      )}

      {/* Task Creation & Editing Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={async (data) => {
          if (taskToEdit) {
            return await updateTask(data as UpdateTaskInput);
          } else {
            return await createTask(data as CreateTaskInput);
          }
        }}
        taskToEdit={taskToEdit}
        categories={categories}
      />

      {/* Task Deletion Confirmation Dialog */}
      <TaskDeleteDialog
        isOpen={!!taskToDelete}
        onClose={() => setTaskToDelete(null)}
        task={taskToDelete}
        onConfirmDelete={deleteTask}
      />
    </div>
  );
};
