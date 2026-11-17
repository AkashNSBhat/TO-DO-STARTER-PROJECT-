import { useState, useEffect, useCallback, useMemo } from "react";
import { DatabaseClient } from "../lib/db/client";
import {
  PlanItem,
  PlanPeriod,
  PlanCategory,
  CreatePlanItemInput,
  UpdatePlanItemInput,
} from "../lib/db/types";

export function getDefaultPeriod(type: PlanPeriod): string {
  switch (type) {
    case "weekly":
      return "2026-W47";
    case "monthly":
      return "2026-11";
    case "yearly":
      return "2026";
    default:
      return "2026-W47";
  }
}

export function getNextPeriod(type: PlanPeriod, current: string): string {
  if (type === "yearly") {
    const y = parseInt(current, 10) || 2026;
    return String(y + 1);
  }
  if (type === "monthly") {
    const parts = current.split("-");
    let y = parseInt(parts[0], 10) || 2026;
    let m = parseInt(parts[1], 10) || 11;
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
    return `${y}-${String(m).padStart(2, "0")}`;
  }
  // weekly: YYYY-Www
  const match = current.match(/^(\d{4})-W(\d{1,2})$/);
  if (match) {
    let y = parseInt(match[1], 10);
    let w = parseInt(match[2], 10);
    w += 1;
    if (w > 52) {
      w = 1;
      y += 1;
    }
    return `${y}-W${String(w).padStart(2, "0")}`;
  }
  return "2026-W48";
}

export function getPrevPeriod(type: PlanPeriod, current: string): string {
  if (type === "yearly") {
    const y = parseInt(current, 10) || 2026;
    return String(y - 1);
  }
  if (type === "monthly") {
    const parts = current.split("-");
    let y = parseInt(parts[0], 10) || 2026;
    let m = parseInt(parts[1], 10) || 11;
    m -= 1;
    if (m < 1) {
      m = 12;
      y -= 1;
    }
    return `${y}-${String(m).padStart(2, "0")}`;
  }
  // weekly: YYYY-Www
  const match = current.match(/^(\d{4})-W(\d{1,2})$/);
  if (match) {
    let y = parseInt(match[1], 10);
    let w = parseInt(match[2], 10);
    w -= 1;
    if (w < 1) {
      w = 52;
      y -= 1;
    }
    return `${y}-W${String(w).padStart(2, "0")}`;
  }
  return "2026-W46";
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function formatPeriodDisplay(type: PlanPeriod, identifier: string): string {
  if (type === "yearly") {
    return `Full Year ${identifier}`;
  }
  if (type === "monthly") {
    const parts = identifier.split("-");
    if (parts.length === 2) {
      const y = parts[0];
      const m = parseInt(parts[1], 10) - 1;
      if (m >= 0 && m < 12) {
        return `${MONTH_NAMES[m]} ${y}`;
      }
    }
    return identifier;
  }
  // weekly
  const match = identifier.match(/^(\d{4})-W(\d{1,2})$/);
  if (match) {
    return `Week ${match[2]}, ${match[1]}`;
  }
  return identifier;
}

export function usePlan(initialPeriod: PlanPeriod = "weekly") {
  const [periodType, setPeriodTypeState] = useState<PlanPeriod>(initialPeriod);
  const [periodIdentifier, setPeriodIdentifier] = useState<string>(getDefaultPeriod(initialPeriod));
  const [items, setItems] = useState<PlanItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const setPeriodType = useCallback((newType: PlanPeriod) => {
    setPeriodTypeState(newType);
    setPeriodIdentifier(getDefaultPeriod(newType));
  }, []);

  const goToNextPeriod = useCallback(() => {
    setPeriodIdentifier((curr) => getNextPeriod(periodType, curr));
  }, [periodType]);

  const goToPrevPeriod = useCallback(() => {
    setPeriodIdentifier((curr) => getPrevPeriod(periodType, curr));
  }, [periodType]);

  const goToCurrentPeriod = useCallback(() => {
    setPeriodIdentifier(getDefaultPeriod(periodType));
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

  const createPlanItem = useCallback(
    async (input: Omit<CreatePlanItemInput, "periodType" | "periodIdentifier">): Promise<PlanItem> => {
      const fullInput: CreatePlanItemInput = {
        ...input,
        periodType,
        periodIdentifier,
      };
      const created = await DatabaseClient.createPlanItem(fullInput);
      setItems((prev) => [...prev, created].sort((a, b) => a.priorityOrder - b.priorityOrder));
      return created;
    },
    [periodType, periodIdentifier]
  );

  const updatePlanItem = useCallback(
    async (input: UpdatePlanItemInput): Promise<boolean> => {
      const ok = await DatabaseClient.updatePlanItem(input);
      if (ok) {
        await fetchPlanItems();
      }
      return ok;
    },
    [fetchPlanItems]
  );

  const deletePlanItem = useCallback(
    async (itemId: string): Promise<boolean> => {
      setItems((prev) => prev.filter((p) => p.id !== itemId));
      const ok = await DatabaseClient.deletePlanItem(itemId);
      if (!ok) {
        await fetchPlanItems();
      }
      return ok;
    },
    [fetchPlanItems]
  );

  const reorderPlanItems = useCallback(
    async (itemIds: string[]): Promise<boolean> => {
      // Optimistically reorder in state
      setItems((prev) => {
        const idMap = new Map(prev.map((i) => [i.id, i]));
        const reordered: PlanItem[] = [];
        itemIds.forEach((id, idx) => {
          const item = idMap.get(id);
          if (item) {
            reordered.push({ ...item, priorityOrder: idx + 1 });
            idMap.delete(id);
          }
        });
        // Append any items that were in other categories or not included
        idMap.forEach((remaining) => reordered.push(remaining));
        return reordered;
      });

      try {
        await DatabaseClient.reorderPlanItems(itemIds);
        return true;
      } catch (err) {
        console.error("[usePlan] Error reordering items:", err);
        await fetchPlanItems();
        return false;
      }
    },
    [fetchPlanItems]
  );

  const carryForward = useCallback(async (): Promise<number> => {
    const nextId = getNextPeriod(periodType, periodIdentifier);
    const count = await DatabaseClient.carryForwardPlanItems(
      periodType,
      periodIdentifier,
      nextId
    );
    return count;
  }, [periodType, periodIdentifier]);

  useEffect(() => {
    fetchPlanItems();
  }, [fetchPlanItems]);

  // Group items by category (built-in categories + custom)
  const itemsByCategory = useMemo(() => {
    const map: Record<PlanCategory, PlanItem[]> = {
      projects: [],
      learning: [],
      personal_goals: [],
      entertainment: [],
      custom: [],
    };

    for (const item of items) {
      if (map[item.category]) {
        map[item.category].push(item);
      } else {
        map.custom.push(item);
      }
    }

    return map;
  }, [items]);

  // Unique custom category names in this active period
  const customCategories = useMemo(() => {
    const names = new Set<string>();
    items.forEach((item) => {
      if (item.category === "custom" && item.customCategoryName?.trim()) {
        names.add(item.customCategoryName.trim());
      }
    });
    return Array.from(names);
  }, [items]);

  // Progress metrics: overall & per-category
  const progress = useMemo(() => {
    const total = items.length;
    const completed = items.filter((i) => i.isCompleted).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    const calcCat = (catItems: PlanItem[]) => {
      const t = catItems.length;
      const c = catItems.filter((i) => i.isCompleted).length;
      const p = t > 0 ? Math.round((c / t) * 100) : 0;
      return { total: t, completed: c, percent: p };
    };

    return {
      overall: { total, completed, percent },
      byCategory: {
        projects: calcCat(itemsByCategory.projects),
        learning: calcCat(itemsByCategory.learning),
        personal_goals: calcCat(itemsByCategory.personal_goals),
        entertainment: calcCat(itemsByCategory.entertainment),
        custom: calcCat(itemsByCategory.custom),
      },
    };
  }, [items, itemsByCategory]);

  const isCurrentPeriod = useMemo(() => {
    return periodIdentifier === getDefaultPeriod(periodType);
  }, [periodType, periodIdentifier]);

  return {
    items,
    periodType,
    setPeriodType,
    periodIdentifier,
    setPeriodIdentifier,
    periodDisplayName: formatPeriodDisplay(periodType, periodIdentifier),
    isCurrentPeriod,
    goToNextPeriod,
    goToPrevPeriod,
    goToCurrentPeriod,
    itemsByCategory,
    customCategories,
    progress,
    togglePlanItem,
    createPlanItem,
    updatePlanItem,
    deletePlanItem,
    reorderPlanItems,
    carryForward,
    loading,
    error,
    refetch: fetchPlanItems,
  };
}