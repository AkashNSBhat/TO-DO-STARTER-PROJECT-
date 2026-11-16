import { useState, useEffect, useCallback } from "react";
import { DatabaseClient } from "../lib/db/client";
import { AppSettings } from "../lib/db/types";

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await DatabaseClient.getAppSettings();
      setSettings(res);
    } catch (err) {
      console.error("[useSettings] Error loading app settings:", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSetting = useCallback(
    async (key: string, value: string): Promise<boolean> => {
      // Optimistic update
      setSettings((prev) => ({ ...prev, [key]: value }));

      try {
        await DatabaseClient.setAppSetting(key, value);
        return true;
      } catch (err) {
        console.error(`[useSettings] Error saving setting '${key}':`, err);
        fetchSettings();
        return false;
      }
    },
    [fetchSettings]
  );

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    loading,
    error,
    updateSetting,
    refetch: fetchSettings,
  };
}
