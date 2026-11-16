import { useState, useEffect } from "react";
import { DatabaseClient } from "../lib/db/client";
import { AppInfoResponse } from "../lib/db/types";

export function useAppInfo() {
  const [appInfo, setAppInfo] = useState<AppInfoResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    DatabaseClient.getAppInfo()
      .then(setAppInfo)
      .catch((err) => console.error("[useAppInfo] Error:", err))
      .finally(() => setLoading(false));
  }, []);

  return { appInfo, loading };
}
