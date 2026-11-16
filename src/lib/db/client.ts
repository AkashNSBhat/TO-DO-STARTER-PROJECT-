import { invoke } from "@tauri-apps/api/core";
import {
  DbStatusResponse,
  AppInfoResponse,
  DashboardData,
  TaskDetail,
  TaskFilter,
  MovieDetail,
  MovieFilter,
  SeriesDetail,
  SeriesFull,
  ArchiveItem,
  ArchiveFilter,
  PlanItem,
  PlanPeriod,
  ActivityHistoryItem,
  StatisticsData,
  AppSettings,
} from "./types";
import { fallbackSeedData } from "./seedData";

export class DatabaseClient {
  private static localData = JSON.parse(JSON.stringify(fallbackSeedData));

  /**
   * Check if running in a native Tauri desktop environment
   */
  static isTauri(): boolean {
    return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
  }

  // =============================================================
  // Diagnostics & System Telemetry
  // =============================================================

  static async getDbStatus(): Promise<DbStatusResponse> {
    if (!this.isTauri()) {
      return {
        connected: false,
        path: "Simulated Web Environment (Tauri desktop required for SQLite)",
        journal_mode: "WAL (Simulated)",
        foreign_keys_enabled: true,
        migration_version: 2,
        tables_count: 15,
        table_stats: [
          { name: "tasks", count: this.localData.tasks.length },
          { name: "movies", count: this.localData.movies.length },
          { name: "series", count: this.localData.seriesSummary.length },
          { name: "plan_items", count: this.localData.planItems.length },
          { name: "activity_history", count: this.localData.activityHistory.length },
        ],
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

  static async ping(): Promise<number> {
    if (!this.isTauri()) {
      return 0;
    }
    return await invoke<number>("ping_db");
  }

  static async getAppInfo(): Promise<AppInfoResponse> {
    if (!this.isTauri()) {
      return {
        name: "DAYMARK",
        version: "0.1.0",
        description: "Every day counts. Every completion stays.",
        os: "Web Browser (Development Preview)",
        database_engine: "SQLite 3 (WAL mode via Tauri Rust core)",
        sqlite_version: "3.45.0",
      };
    }

    try {
      return await invoke<AppInfoResponse>("get_app_info");
    } catch (error) {
      console.error("[DAYMARK DB] Failed to get app info:", error);
      throw error;
    }
  }

  // =============================================================
  // Home Dashboard
  // =============================================================

  static async getDashboardData(): Promise<DashboardData> {
    if (!this.isTauri()) {
      return this.computeFallbackDashboard();
    }
    return await invoke<DashboardData>("get_dashboard_data");
  }

  private static computeFallbackDashboard(): DashboardData {
    const now = new Date();
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const greeting = `It's ${dayNames[now.getDay()]}, ${monthNames[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;

    // Year and Month Progress
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const isLeap = (now.getFullYear() % 4 === 0 && now.getFullYear() % 100 !== 0) || now.getFullYear() % 400 === 0;
    const totalDaysYear = isLeap ? 366 : 365;
    const yearProgressPct = Math.round((dayOfYear / totalDaysYear) * 1000) / 10;

    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const monthProgressPct = Math.round((now.getDate() / daysInMonth) * 1000) / 10;

    const tasks: TaskDetail[] = this.localData.tasks;
    const completedTasksToday = tasks.filter((t) => t.isCompleted).length;
    const pendingTasksToday = tasks.filter((t) => !t.isCompleted && (t.dueDate === "2026-11-16" || !t.dueDate)).length;
    const totalMoviesWatched = this.localData.movies.filter((m: MovieDetail) => m.status === "completed").length;
    const activeSeriesCount = this.localData.seriesSummary.filter((s: SeriesDetail) => s.status === "watching").length;

    const dailyChecklist = tasks.slice(0, 5).map((t) => ({
      id: t.id,
      title: t.title,
      category: t.categoryName,
      priority: t.priority,
      isCompleted: t.isCompleted,
    }));

    return {
      greeting,
      streakCount: parseInt(this.localData.appSettings.streak_count || "14", 10),
      yearProgressPct,
      monthProgressPct,
      metrics: {
        completedTasksToday,
        pendingTasksToday,
        totalMoviesWatched,
        activeSeriesCount,
      },
      dailyChecklist,
      todayGoals: this.localData.todayGoals,
      scheduleSlots: this.localData.scheduleSlots,
      activitySpline: this.localData.activitySpline,
    };
  }

  // =============================================================
  // Daily Tasks
  // =============================================================

  static async getTasks(filter: TaskFilter = "all"): Promise<TaskDetail[]> {
    if (!this.isTauri()) {
      return this.filterFallbackTasks(filter);
    }
    return await invoke<TaskDetail[]>("get_tasks", {
      filter: filter === "all" ? null : filter,
    });
  }

  private static filterFallbackTasks(filter: TaskFilter): TaskDetail[] {
    const all: TaskDetail[] = this.localData.tasks;
    switch (filter) {
      case "today":
        return all.filter((t) => t.dueDate === "2026-11-16" || (!t.isCompleted && (t.dueDate ? t.dueDate <= "2026-11-16" : false)));
      case "upcoming":
        return all.filter((t) => !t.isCompleted && t.dueDate && t.dueDate > "2026-11-16");
      case "overdue":
        return all.filter((t) => !t.isCompleted && t.dueDate && t.dueDate < "2026-11-16");
      case "completed":
        return all.filter((t) => t.isCompleted);
      case "all":
      default:
        return all;
    }
  }

  static async toggleTaskCompletion(taskId: string, isCompleted: boolean): Promise<boolean> {
    if (!this.isTauri()) {
      const task = this.localData.tasks.find((t: TaskDetail) => t.id === taskId);
      if (task) {
        task.isCompleted = isCompleted;
        task.status = isCompleted ? "completed" : "todo";
        task.completedAt = isCompleted ? new Date().toISOString() : undefined;
        if (isCompleted) {
          task.completedSubtasksCount = task.subtasksCount;
        }
      }
      return true;
    }
    return await invoke<boolean>("toggle_task_completion", { taskId, isCompleted });
  }

  // =============================================================
  // Movies
  // =============================================================

  static async getMovies(filter: MovieFilter = "all"): Promise<MovieDetail[]> {
    if (!this.isTauri()) {
      const all: MovieDetail[] = this.localData.movies;
      if (filter === "all") return all;
      return all.filter((m) => m.status === filter);
    }
    return await invoke<MovieDetail[]>("get_movies", {
      filter: filter === "all" ? null : filter,
    });
  }

  // =============================================================
  // Series & Episodes
  // =============================================================

  static async getSeries(): Promise<SeriesDetail[]> {
    if (!this.isTauri()) {
      return this.localData.seriesSummary;
    }
    return await invoke<SeriesDetail[]>("get_series");
  }

  static async getSeriesDetail(seriesId: string): Promise<SeriesFull> {
    if (!this.isTauri()) {
      const found = this.localData.seriesDetailMap[seriesId];
      if (!found) {
        throw new Error(`Series '${seriesId}' not found in fallback data.`);
      }
      return found;
    }
    return await invoke<SeriesFull>("get_series_detail", { seriesId });
  }

  static async toggleEpisodeCompletion(episodeId: string, isCompleted: boolean): Promise<boolean> {
    if (!this.isTauri()) {
      for (const seriesKey of Object.keys(this.localData.seriesDetailMap)) {
        const full: SeriesFull = this.localData.seriesDetailMap[seriesKey];
        for (const season of full.seasons) {
          const ep = season.episodes.find((e) => e.id === episodeId);
          if (ep) {
            ep.isCompleted = isCompleted;
            ep.completedAt = isCompleted ? new Date().toISOString() : undefined;
            // Recount completed episodes in full series
            let completedCount = 0;
            for (const s of full.seasons) {
              for (const e of s.episodes) {
                if (e.isCompleted) completedCount++;
              }
            }
            full.completedEpisodes = completedCount;
            full.progressText = `${completedCount}/${full.totalEpisodes} Episodes`;

            // Also update summary
            const summary = this.localData.seriesSummary.find((s: SeriesDetail) => s.id === full.id);
            if (summary) {
              summary.completedEpisodes = completedCount;
              summary.progressText = full.progressText;
            }
            return true;
          }
        }
      }
      return true;
    }
    return await invoke<boolean>("toggle_episode_completion", { episodeId, isCompleted });
  }

  // =============================================================
  // Entertainment Archive
  // =============================================================

  static async getArchiveData(filter: ArchiveFilter = "all"): Promise<ArchiveItem[]> {
    if (!this.isTauri()) {
      const all: ArchiveItem[] = this.localData.archiveItems;
      if (filter === "all") return all;
      if (filter === "movies" || filter === "movie") return all.filter((i) => i.type === "movie");
      if (filter === "series") return all.filter((i) => i.type === "series");
      return all;
    }
    return await invoke<ArchiveItem[]>("get_archive_data", {
      filter: filter === "all" ? null : filter,
    });
  }

  // =============================================================
  // Plan Module
  // =============================================================

  static async getPlanItems(periodType?: PlanPeriod, periodId?: string): Promise<PlanItem[]> {
    if (!this.isTauri()) {
      let items: PlanItem[] = this.localData.planItems;
      if (periodType) {
        items = items.filter((p) => p.periodType === periodType);
      }
      if (periodId) {
        items = items.filter((p) => p.periodIdentifier === periodId);
      }
      return items.sort((a, b) => a.priorityOrder - b.priorityOrder);
    }
    return await invoke<PlanItem[]>("get_plan_items", {
      periodType: periodType ?? null,
      periodId: periodId ?? null,
    });
  }

  static async togglePlanItemCompletion(itemId: string, isCompleted: boolean): Promise<boolean> {
    if (!this.isTauri()) {
      const item = this.localData.planItems.find((p: PlanItem) => p.id === itemId);
      if (item) {
        item.isCompleted = isCompleted;
        item.completedAt = isCompleted ? new Date().toISOString() : undefined;
      }
      return true;
    }
    return await invoke<boolean>("toggle_plan_item_completion", { itemId, isCompleted });
  }

  // =============================================================
  // Activity History & Statistics
  // =============================================================

  static async getActivityHistory(limit: number = 50): Promise<ActivityHistoryItem[]> {
    if (!this.isTauri()) {
      return this.localData.activityHistory.slice(0, limit);
    }
    return await invoke<ActivityHistoryItem[]>("get_activity_history", { limit });
  }

  static async getStatistics(): Promise<StatisticsData> {
    if (!this.isTauri()) {
      return this.localData.statistics;
    }
    return await invoke<StatisticsData>("get_statistics");
  }

  // =============================================================
  // App Settings
  // =============================================================

  static async getAppSettings(): Promise<AppSettings> {
    if (!this.isTauri()) {
      return { ...this.localData.appSettings };
    }
    return await invoke<AppSettings>("get_app_settings");
  }

  static async setAppSetting(key: string, value: string): Promise<boolean> {
    if (!this.isTauri()) {
      this.localData.appSettings[key] = value;
      return true;
    }
    return await invoke<boolean>("set_app_setting", { key, value });
  }
}
