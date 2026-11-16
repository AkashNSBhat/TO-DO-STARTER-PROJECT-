import { useState, useEffect, useCallback } from "react";
import { DatabaseClient } from "../lib/db/client";
import { ActivityHistoryItem, StatisticsData } from "../lib/db/types";

export function useActivity(historyLimit: number = 50) {
  const [history, setHistory] = useState<ActivityHistoryItem[]>([]);
  const [statistics, setStatistics] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [histRes, statsRes] = await Promise.all([
        DatabaseClient.getActivityHistory(historyLimit),
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
  }, [historyLimit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    history,
    statistics,
    loading,
    error,
    refetch: fetchData,
  };
}
