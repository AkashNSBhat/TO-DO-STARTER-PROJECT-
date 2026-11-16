import { invoke } from "@tauri-apps/api/core";
import { DbStatusResponse, AppInfoResponse } from "./types";

export class DatabaseClient {
  /**
   * Check if running in a native Tauri desktop environment
   */
  static isTauri(): boolean {
    return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
  }

  /**
   * Retrieve SQLite database status, file path, migrations and table statistics
   */
  static async getDbStatus(): Promise<DbStatusResponse> {
    if (!this.isTauri()) {
      return {
        connected: false,
        path: "Simulated Web Environment (Tauri desktop required for SQLite)",
        journal_mode: "N/A",
        foreign_keys_enabled: false,
        migration_version: 0,
        tables_count: 0,
        table_stats: [],
        ping_ms: 0,
      };
    }

    try {
      return await invoke<DbStatusResponse>("get_db_status");
    } catch (error) {
      console.error("[DAYMARK DB] Failed to get database status:", error);
      throw error;
    }
  }

  /**
   * Ping database connection and measure latency
   */
  static async ping(): Promise<number> {
    if (!this.isTauri()) {
      return 0;
    }
    return await invoke<number>("ping_db");
  }

  /**
   * Retrieve Daymark application information
   */
  static async getAppInfo(): Promise<AppInfoResponse> {
    if (!this.isTauri()) {
      return {
        name: "DAYMARK",
        version: "0.1.0",
        description: "Every day counts. Every completion stays.",
        os: "Web Browser (Development Preview)",
        database_engine: "None (Awaiting Tauri Host)",
        sqlite_version: "N/A",
      };
    }

    try {
      return await invoke<AppInfoResponse>("get_app_info");
    } catch (error) {
      console.error("[DAYMARK DB] Failed to get app info:", error);
      throw error;
    }
  }
}
