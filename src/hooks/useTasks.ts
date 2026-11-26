import { useState, useEffect, useCallback, useMemo } from "react";
import { DatabaseClient } from "../lib/db/client";
import {
  TaskDetail,
  TaskFilter,
  CreateTaskInput,
  UpdateTaskInput,
  CategoryDetail,
  TodayGoals,
  Priority,
} from "../lib/db/types";

export type TaskSortOption = "priority" | "dueDate" | "title";

export function useTasks(initialFilter: TaskFilter = "today") {
  const [tasks, setTasks] = useState<TaskDetail[]>([]);
  const [categories, setCategories] = useState<CategoryDetail[]>([]);
  const [dailyGoal, setDailyGoal] = useState<TodayGoals>({
    targetTasksCount: 5,
    notes: "Focus on deep work blocks and high impact items",
  });
  const [filter, setFilter] = useState<TaskFilter>(initialFilter);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<TaskSortOption>("priority");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [tasksRes, categoriesRes, goalRes] = await Promise.all([
        DatabaseClient.getTasks("all"),
        DatabaseClient.getTaskCategories(),
        DatabaseClient.getDailyGoal(todayStr),
      ]);
      setTasks(tasksRes);
      setCategories(categoriesRes);
      setDailyGoal(goalRes);
    } catch (err) {
      console.error("[useTasks] Error fetching task data:", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [todayStr]);

  const toggleTask = useCallback(
    async (taskId: string, isCompleted: boolean): Promise<boolean> => {
      // Optimistic update
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                isCompleted,
                status: isCompleted ? "completed" : "todo",
                completedAt: isCompleted ? new Date().toISOString() : undefined,
                completedSubtasksCount: isCompleted
                  ? t.subtasksCount
                  : t.completedSubtasksCount,
              }
            : t
        )
      );

      try {
        await DatabaseClient.toggleTaskCompletion(taskId, isCompleted);
        return true;
      } catch (err) {
        console.error("[useTasks] Error toggling task completion:", err);
        fetchAllData();
        return false;
      }
    },
    [fetchAllData]
  );

  const createTask = useCallback(
    async (input: CreateTaskInput): Promise<TaskDetail | null> => {
      try {
        const created = await DatabaseClient.createTask(input);
        setTasks((prev) =>
          prev.some((t) => t.id === created.id) ? prev : [created, ...prev]
        );
        return created;
      } catch (err) {
        console.error("[useTasks] Error creating task:", err);
        setError(err instanceof Error ? err.message : String(err));
        return null;
      }
    },
    []
  );

  const quickAddTask = useCallback(
    async (title: string): Promise<TaskDetail | null> => {
      if (!title.trim()) return null;
      return await createTask({
        title: title.trim(),
        priority: "medium",
        dueDate: todayStr,
      });
    },
    [createTask, todayStr]
  );

  const updateTask = useCallback(
    async (input: UpdateTaskInput): Promise<boolean> => {
      try {
        await DatabaseClient.updateTask(input);
        setTasks((prev) =>
          prev.map((t) => {
            if (t.id !== input.id) return t;
            const cat = categories.find((c) => c.id === input.categoryId);
            return {
              ...t,
              title: input.title,
              description: input.description,
              priority: input.priority || t.priority,
              dueDate: input.dueDate,
              categoryId: cat ? cat.id : t.categoryId,
              categoryName: cat ? cat.name : t.categoryName,
              categoryColor: cat ? cat.color : t.categoryColor,
            };
          })
        );
        return true;
      } catch (err) {
        console.error("[useTasks] Error updating task:", err);
        setError(err instanceof Error ? err.message : String(err));
        return false;
      }
    },
    [categories]
  );

  const deleteTask = useCallback(
    async (taskId: string): Promise<boolean> => {
      // Optimistic delete
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      try {
        await DatabaseClient.deleteTask(taskId);
        return true;
      } catch (err) {
        console.error("[useTasks] Error deleting task:", err);
        fetchAllData();
        return false;
      }
    },
    [fetchAllData]
  );

  const updateGoal = useCallback(
    async (targetTasksCount: number, notes?: string): Promise<boolean> => {
      setDailyGoal({ targetTasksCount, notes: notes || "" });
      try {
        await DatabaseClient.updateDailyGoal(todayStr, targetTasksCount, notes);
        return true;
      } catch (err) {
        console.error("[useTasks] Error updating daily goal:", err);
        return false;
      }
    },
    [todayStr]
  );

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Derived counts for tabs
  const counts = useMemo(() => {
    let today = 0;
    let upcoming = 0;
    let overdue = 0;
    let completed = 0;

    for (const t of tasks) {
      if (t.isCompleted) {
        completed++;
      } else {
        if (t.dueDate === todayStr || (t.dueDate && t.dueDate <= todayStr)) {
          today++;
        }
        if (t.dueDate && t.dueDate > todayStr) {
          upcoming++;
        }
        if (t.dueDate && t.dueDate < todayStr) {
          overdue++;
        }
      }
    }

    return {
      all: tasks.length,
      today,
      upcoming,
      overdue,
      completed,
    };
  }, [tasks, todayStr]);

  // Priority weight mapping for sorting
  const priorityWeight = (p: Priority): number => {
    switch (p) {
      case "urgent":
        return 4;
      case "high":
        return 3;
      case "medium":
        return 2;
      case "low":
        return 1;
      default:
        return 0;
    }
  };

  // Filtered and sorted tasks
  const filteredTasks = useMemo(() => {
    // 1. Status Filter
    let result = tasks.filter((t) => {
      switch (filter) {
        case "today":
          return (
            t.dueDate === todayStr ||
            (!t.isCompleted && t.dueDate && t.dueDate <= todayStr)
          );
        case "upcoming":
          return !t.isCompleted && t.dueDate && t.dueDate > todayStr;
        case "overdue":
          return !t.isCompleted && t.dueDate && t.dueDate < todayStr;
        case "completed":
          return t.isCompleted;
        case "all":
        default:
          return true;
      }
    });

    // 2. Category Filter
    if (categoryFilter !== "all") {
      result = result.filter((t) => t.categoryId === categoryFilter);
    }

    // 3. Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q)) ||
          t.categoryName.toLowerCase().includes(q)
      );
    }

    // 4. Sorting
    return result.sort((a, b) => {
      // Completed tasks sink to the bottom when in non-completed views
      if (filter !== "completed" && a.isCompleted !== b.isCompleted) {
        return a.isCompleted ? 1 : -1;
      }

      if (sortBy === "priority") {
        const diff = priorityWeight(b.priority) - priorityWeight(a.priority);
        if (diff !== 0) return diff;
      } else if (sortBy === "dueDate") {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        const diff = a.dueDate.localeCompare(b.dueDate);
        if (diff !== 0) return diff;
      }

      // Tiebreaker: title
      return a.title.localeCompare(b.title);
    });
  }, [tasks, filter, categoryFilter, searchQuery, sortBy, todayStr]);

  // Daily Goal Progress Metrics
  const todayProgress = useMemo(() => {
    const todayTasks = tasks.filter(
      (t) => t.dueDate === todayStr || (!t.isCompleted && t.dueDate && t.dueDate <= todayStr)
    );
    const completedToday = tasks.filter(
      (t) => t.isCompleted && (t.completedAt?.startsWith(todayStr) || t.dueDate === todayStr)
    ).length;

    const target = dailyGoal.targetTasksCount || 5;
    const percent = Math.min(100, Math.round((completedToday / target) * 100));

    return {
      total: todayTasks.length,
      completedToday,
      target,
      percent,
      isGoalReached: completedToday >= target,
    };
  }, [tasks, dailyGoal, todayStr]);

  return {
    tasks,
    filteredTasks,
    categories,
    dailyGoal,
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
    refetch: fetchAllData,
    toggleTask,
    createTask,
    quickAddTask,
    updateTask,
    deleteTask,
    updateGoal,
  };
}
