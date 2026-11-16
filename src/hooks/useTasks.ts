import { useState, useEffect, useCallback, useMemo } from "react";
import { DatabaseClient } from "../lib/db/client";
import { TaskDetail, TaskFilter } from "../lib/db/types";

export function useTasks(initialFilter: TaskFilter = "all") {
  const [tasks, setTasks] = useState<TaskDetail[]>([]);
  const [filter, setFilter] = useState<TaskFilter>(initialFilter);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch all tasks so counts and client filtering are accurate and responsive
      const res = await DatabaseClient.getTasks("all");
      setTasks(res);
    } catch (err) {
      console.error("[useTasks] Error fetching tasks:", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

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
                completedSubtasksCount: isCompleted ? t.subtasksCount : t.completedSubtasksCount,
              }
            : t
        )
      );

      try {
        await DatabaseClient.toggleTaskCompletion(taskId, isCompleted);
        return true;
      } catch (err) {
        console.error("[useTasks] Error toggling task completion:", err);
        fetchTasks();
        return false;
      }
    },
    [fetchTasks]
  );

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Derived counts for tabs
  const counts = useMemo(() => {
    const todayStr = "2026-11-16";
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
  }, [tasks]);

  // Filtered task list based on current active tab
  const filteredTasks = useMemo(() => {
    const todayStr = "2026-11-16";
    switch (filter) {
      case "today":
        return tasks.filter(
          (t) => t.dueDate === todayStr || (!t.isCompleted && t.dueDate && t.dueDate <= todayStr)
        );
      case "upcoming":
        return tasks.filter((t) => !t.isCompleted && t.dueDate && t.dueDate > todayStr);
      case "overdue":
        return tasks.filter((t) => !t.isCompleted && t.dueDate && t.dueDate < todayStr);
      case "completed":
        return tasks.filter((t) => t.isCompleted);
      case "all":
      default:
        return tasks;
    }
  }, [tasks, filter]);

  return {
    tasks,
    filteredTasks,
    filter,
    setFilter,
    counts,
    loading,
    error,
    refetch: fetchTasks,
    toggleTask,
  };
}
