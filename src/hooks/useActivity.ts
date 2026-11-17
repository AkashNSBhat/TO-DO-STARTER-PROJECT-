import { useState, useEffect, useCallback } from "react";
import { DatabaseClient } from "../lib/db/client";
import { ActivityHistoryItem, StatisticsData } from "../lib/db/types";

export type ActivityFilterType = "all" | "task" | "movie" | "episode" | "series" | "plan";
export type DateFilterType = "all" | "today" | "week" | "month";

export function useActivity(
  initialLimit: number = 50,
  initialActivityType: ActivityFilterType = "all",
  initialDateFilter: DateFilterType = "all"
) {
  const [history, setHistory] = useState<ActivityHistoryItem[]>([]);
  const [statistics, setStatistics] = useState<StatisticsData | null>(null);
  const [activityType, setActivityType] = useState<ActivityFilterType>(initialActivityType);
  const [dateFilter, setDateFilter] = useState<DateFilterType>(initialDateFilter);
  const [limit, setLimit] = useState<number>(initialLimit);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [histRes, statsRes] = await Promise.all([
        DatabaseClient.getActivityHistory(activityType, dateFilter, limit),
        DatabaseClient.getStatistics(),
      ]);
      setHistory(histRes);
      setStatistics(statsRes);
    } catch (err) {
      console.error("[useActivity] Error loading activity & statistics:", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [activityType, dateFilter, limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    history,
    statistics,
    activityType,
    setActivityType,
    dateFilter,
    setDateFilter,
    limit,
    setLimit,
    loading,
    error,
    refetch: fetchData,
  };
}
