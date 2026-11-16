import { useState, useEffect, useCallback } from "react";
import { DatabaseClient } from "../lib/db/client";
import { DbStatusResponse } from "../lib/db/types";

export function useDatabase() {
  const [status, setStatus] = useState<DbStatusResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refreshStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await DatabaseClient.getDbStatus();
      setStatus(res);
    } catch (err) {
      console.error("[useDatabase] Error:", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const ping = useCallback(async () => {
    try {
      const ms = await DatabaseClient.ping();
      setStatus((prev) => (prev ? { ...prev, ping_ms: ms } : prev));
      return ms;
    } catch (err) {
      console.error("[useDatabase] Ping failed:", err);
      throw err;
    }
  }, []);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  return { status, loading, error, refreshStatus, ping, isTauri: DatabaseClient.isTauri() };
}
