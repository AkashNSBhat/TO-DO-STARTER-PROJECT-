import { useState, useEffect, useCallback, useMemo } from "react";
import { DatabaseClient } from "../lib/db/client";
import { PlanItem, PlanPeriod, PlanCategory } from "../lib/db/types";

export function usePlan(initialPeriod: PlanPeriod = "weekly") {
  const [periodType, setPeriodType] = useState<PlanPeriod>(initialPeriod);
  const [items, setItems] = useState<PlanItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Derive active periodIdentifier matching project current timeline (2026-11-16, W47)
  const periodIdentifier = useMemo(() => {
    switch (periodType) {
      case "weekly":
        return "2026-W47";
      case "monthly":
        return "2026-11";
      case "yearly":
        return "2026";
      default:
        return "2026-W47";
    }
  }, [periodType]);

  const fetchPlanItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await DatabaseClient.getPlanItems(periodType, periodIdentifier);
      setItems(res);
    } catch (err) {
      console.error("[usePlan] Error loading plan items:", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [periodType, periodIdentifier]);

  const togglePlanItem = useCallback(
    async (itemId: string, isCompleted: boolean): Promise<boolean> => {
      // Optimistic update
      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? {
                ...item,
                isCompleted,
                completedAt: isCompleted ? new Date().toISOString() : undefined,
              }
            : item
        )
      );

      try {
        await DatabaseClient.togglePlanItemCompletion(itemId, isCompleted);
        return true;
      } catch (err) {
        console.error("[usePlan] Error toggling plan item completion:", err);
        fetchPlanItems();
        return false;
      }
    },
    [fetchPlanItems]
  );

  useEffect(() => {
    fetchPlanItems();
  }, [fetchPlanItems]);

  // Group items by category
  const itemsByCategory = useMemo(() => {
    const map: Record<PlanCategory, PlanItem[]> = {
      projects: [],
      learning: [],
      personal_goals: [],
      entertainment: [],
    };

    for (const item of items) {
      if (map[item.category]) {
        map[item.category].push(item);
      }
    }

    return map;
  }, [items]);

  return {
    items,
    periodType,
    setPeriodType,
    periodIdentifier,
    itemsByCategory,
    togglePlanItem,
    loading,
    error,
    refetch: fetchPlanItems,
  };
}
