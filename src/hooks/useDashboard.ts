import { useState, useEffect, useCallback } from "react";
import { DatabaseClient } from "../lib/db/client";
import { DashboardData } from "../lib/db/types";

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await DatabaseClient.getDashboardData();
      setData(res);
    } catch (err) {
      console.error("[useDashboard] Error loading dashboard data:", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleChecklistItem = useCallback(
    async (id: string, isCompleted: boolean): Promise<boolean> => {
      // Optimistic update
      setData((prev) => {
        if (!prev) return prev;
        const updatedChecklist = prev.dailyChecklist.map((item) =>
          item.id === id ? { ...item, isCompleted } : item
        );
        const delta = isCompleted ? 1 : -1;
        return {
          ...prev,
          metrics: {
            ...prev.metrics,
            completedTasksToday: Math.max(0, prev.metrics.completedTasksToday + delta),
            pendingTasksToday: Math.max(0, prev.metrics.pendingTasksToday - delta),
          },
          dailyChecklist: updatedChecklist,
        };
      });

      try {
        await DatabaseClient.toggleTaskCompletion(id, isCompleted);
        return true;
      } catch (err) {
        console.error("[useDashboard] Error toggling checklist item:", err);
        // Rollback on failure
        fetchData();
        return false;
      }
    },
    [fetchData]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    toggleChecklistItem,
  };
}
