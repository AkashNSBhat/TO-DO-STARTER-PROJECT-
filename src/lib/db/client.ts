import { invoke } from "@tauri-apps/api/core";
import {
  DbStatusResponse,
  AppInfoResponse,
  DashboardData,
  TaskDetail,
  TaskFilter,
  CreateTaskInput,
  UpdateTaskInput,
  SubtaskDetail,
  CategoryDetail,
  TodayGoals,
  MovieDetail,
  MovieFilter,
  CreateMovieInput,
  UpdateMovieInput,
  SeriesDetail,
  SeriesFull,
  CreateSeriesInput,
  UpdateSeriesInput,
  SeasonDetail,
  EpisodeDetail,
  ToggleEpisodeResult,
  ArchiveItem,
  ArchiveFilter,
  AddHistoricalInput,
  UpdateArchivedInput,
  PlanItem,
  PlanPeriod,
  CreatePlanItemInput,
  UpdatePlanItemInput,
  ActivityHistoryItem,
  StatisticsData,
  AppSettings,
  DatabaseBackupPayload,
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
      streakCount: parseInt(this.localData.appSettings.streak_count || "0", 10),
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

  private static getLocalTodayStr(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  private static filterFallbackTasks(filter: TaskFilter): TaskDetail[] {
    const all: TaskDetail[] = this.localData.tasks;
    const today = this.getLocalTodayStr();
    switch (filter) {
      case "today":
        return all.filter((t) => t.dueDate === today || (!t.isCompleted && (t.dueDate ? t.dueDate <= today : false)));
      case "upcoming":
        return all.filter((t) => !t.isCompleted && t.dueDate && t.dueDate > today);
      case "overdue":
        return all.filter((t) => !t.isCompleted && t.dueDate && t.dueDate < today);
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

  static async createTask(input: CreateTaskInput): Promise<TaskDetail> {
    if (!this.isTauri()) {
      const id = `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const subtasksCount = input.subtasks?.length ?? 0;
      const categories: CategoryDetail[] = await this.getTaskCategories();
      const cat = categories.find((c) => c.id === input.categoryId) || categories[0];

      const newTask: TaskDetail = {
        id,
        title: input.title,
        description: input.description,
        categoryId: cat?.id || "cat-work",
        categoryName: cat?.name || "Deep Work",
        categoryColor: cat?.color || "#14b8a6",
        priority: input.priority || "medium",
        status: "todo",
        dueDate: input.dueDate,
        isCompleted: false,
        completedAt: undefined,
        subtasksCount,
        completedSubtasksCount: 0,
      };

      this.localData.tasks.unshift(newTask);

      if (input.subtasks) {
        if (!this.localData.subtasksMap) this.localData.subtasksMap = {};
        this.localData.subtasksMap[id] = input.subtasks.map((st, i) => ({
          id: `sub-${Date.now()}-${i}`,
          taskId: id,
          title: st,
          isCompleted: false,
          position: i,
        }));
      }

      return newTask;
    }

    return await invoke<TaskDetail>("create_task", { input });
  }

  static async updateTask(input: UpdateTaskInput): Promise<boolean> {
    if (!this.isTauri()) {
      const task = this.localData.tasks.find((t: TaskDetail) => t.id === input.id);
      if (task) {
        task.title = input.title;
        task.description = input.description;
        task.priority = input.priority || task.priority;
        task.dueDate = input.dueDate;
        if (input.categoryId) {
          const categories: CategoryDetail[] = await this.getTaskCategories();
          const cat = categories.find((c) => c.id === input.categoryId);
          if (cat) {
            task.categoryId = cat.id;
            task.categoryName = cat.name;
            task.categoryColor = cat.color;
          }
        }
      }
      return true;
    }

    return await invoke<boolean>("update_task", { input });
  }

  static async deleteTask(taskId: string): Promise<boolean> {
    if (!this.isTauri()) {
      this.localData.tasks = this.localData.tasks.filter((t: TaskDetail) => t.id !== taskId);
      if (this.localData.subtasksMap) {
        delete this.localData.subtasksMap[taskId];
      }
      return true;
    }

    return await invoke<boolean>("delete_task", { taskId });
  }

  static async getSubtasks(taskId: string): Promise<SubtaskDetail[]> {
    if (!this.isTauri()) {
      if (!this.localData.subtasksMap) {
        this.localData.subtasksMap = {};
      }
      return this.localData.subtasksMap[taskId] || [];
    }

    return await invoke<SubtaskDetail[]>("get_subtasks", { taskId });
  }

  static async toggleSubtaskCompletion(subtaskId: string, isCompleted: boolean): Promise<boolean> {
    if (!this.isTauri()) {
      if (this.localData.subtasksMap) {
        for (const taskId of Object.keys(this.localData.subtasksMap)) {
          const sub = this.localData.subtasksMap[taskId].find((s: SubtaskDetail) => s.id === subtaskId);
          if (sub) {
            sub.isCompleted = isCompleted;
            sub.completedAt = isCompleted ? new Date().toISOString() : undefined;

            // Update parent task completedSubtasksCount
            const parent = this.localData.tasks.find((t: TaskDetail) => t.id === taskId);
            if (parent) {
              const compCount = this.localData.subtasksMap[taskId].filter((s: SubtaskDetail) => s.isCompleted).length;
              parent.completedSubtasksCount = compCount;
            }
            return true;
          }
        }
      }
      return true;
    }

    return await invoke<boolean>("toggle_subtask_completion", { subtaskId, isCompleted });
  }

  static async addSubtask(taskId: string, title: string): Promise<SubtaskDetail> {
    if (!this.isTauri()) {
      if (!this.localData.subtasksMap) this.localData.subtasksMap = {};
      if (!this.localData.subtasksMap[taskId]) this.localData.subtasksMap[taskId] = [];
      const newSub: SubtaskDetail = {
        id: `sub-${Date.now()}`,
        taskId,
        title,
        isCompleted: false,
        position: this.localData.subtasksMap[taskId].length,
      };
      this.localData.subtasksMap[taskId].push(newSub);

      const parent = this.localData.tasks.find((t: TaskDetail) => t.id === taskId);
      if (parent) {
        parent.subtasksCount = this.localData.subtasksMap[taskId].length;
      }
      return newSub;
    }

    return await invoke<SubtaskDetail>("add_subtask", { taskId, title });
  }

  static async deleteSubtask(subtaskId: string): Promise<boolean> {
    if (!this.isTauri()) {
      if (this.localData.subtasksMap) {
        for (const taskId of Object.keys(this.localData.subtasksMap)) {
          const idx = this.localData.subtasksMap[taskId].findIndex((s: SubtaskDetail) => s.id === subtaskId);
          if (idx !== -1) {
            this.localData.subtasksMap[taskId].splice(idx, 1);
            const parent = this.localData.tasks.find((t: TaskDetail) => t.id === taskId);
            if (parent) {
              parent.subtasksCount = this.localData.subtasksMap[taskId].length;
              parent.completedSubtasksCount = this.localData.subtasksMap[taskId].filter((s: SubtaskDetail) => s.isCompleted).length;
            }
            return true;
          }
        }
      }
      return true;
    }

    return await invoke<boolean>("delete_subtask", { subtaskId });
  }

  static async getTaskCategories(): Promise<CategoryDetail[]> {
    if (!this.isTauri()) {
      return [
        { id: "cat-work", name: "Deep Work", color: "#14b8a6", icon: "briefcase" },
        { id: "cat-eng", name: "Engineering", color: "#3b82f6", icon: "code" },
        { id: "cat-fit", name: "Health & Fitness", color: "#10b981", icon: "activity" },
        { id: "cat-pers", name: "Personal", color: "#f59e0b", icon: "user" },
      ];
    }

    return await invoke<CategoryDetail[]>("get_task_categories");
  }

  static async getDailyGoal(date: string): Promise<TodayGoals> {
    if (!this.isTauri()) {
      return this.localData.todayGoals || {
        targetTasksCount: 5,
        notes: "Focus on deep work blocks and high impact items",
      };
    }

    return await invoke<TodayGoals>("get_daily_goal", { date });
  }

  static async updateDailyGoal(date: string, targetTasksCount: number, notes?: string): Promise<boolean> {
    if (!this.isTauri()) {
      this.localData.todayGoals = {
        targetTasksCount,
        notes: notes || "",
      };
      return true;
    }

    return await invoke<boolean>("update_daily_goal", { date, targetTasksCount, notes });
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

  static async createMovie(input: CreateMovieInput): Promise<MovieDetail> {
    if (!this.isTauri()) {
      const id = `mov-${Date.now()}`;
      const newMovie: MovieDetail = {
        id,
        title: input.title,
        releaseYear: input.releaseYear,
        status: input.status || "planned",
        rating: input.rating,
        dateWatched: input.dateWatched,
        isHistorical: input.isHistorical ?? false,
        genres: input.genres || [],
        posterColor: input.posterColor || "#8b5cf6",
        posterUrl: input.posterUrl,
        notes: input.notes,
      };

      this.localData.movies.unshift(newMovie);
      return newMovie;
    }

    return await invoke<MovieDetail>("create_movie", { input });
  }

  static async updateMovie(input: UpdateMovieInput): Promise<boolean> {
    if (!this.isTauri()) {
      const movie = this.localData.movies.find((m: MovieDetail) => m.id === input.id);
      if (movie) {
        movie.title = input.title;
        movie.releaseYear = input.releaseYear;
        movie.status = input.status;
        movie.rating = input.rating;
        movie.dateWatched = input.dateWatched;
        movie.genres = input.genres || movie.genres;
        movie.notes = input.notes;
        movie.posterUrl = input.posterUrl;
        movie.posterColor = input.posterColor || movie.posterColor;
      }
      return true;
    }

    return await invoke<boolean>("update_movie", { input });
  }

  static async deleteMovie(movieId: string): Promise<boolean> {
    if (!this.isTauri()) {
      this.localData.movies = this.localData.movies.filter((m: MovieDetail) => m.id !== movieId);
      return true;
    }

    return await invoke<boolean>("delete_movie", { movieId });
  }

  static async getAllGenres(): Promise<string[]> {
    if (!this.isTauri()) {
      const set = new Set<string>();
      for (const m of this.localData.movies) {
        for (const g of m.genres) set.add(g);
      }
      return Array.from(set).sort();
    }

    return await invoke<string[]>("get_all_genres");
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

  static async createSeries(input: CreateSeriesInput): Promise<SeriesFull> {
    if (!this.isTauri()) {
      const id = `ser-${Date.now()}`;
      let totalEpisodes = 0;
      const seasons: SeasonDetail[] = input.seasons.map((s) => {
        const seasonId = `sea-${id}-${s.seasonNumber}`;
        const episodes: EpisodeDetail[] = Array.from({ length: s.episodeCount }, (_, idx) => {
          const epNum = idx + 1;
          const epTitle = (s.episodeTitles && s.episodeTitles[idx]) || `Episode ${epNum}`;
          totalEpisodes++;
          return {
            id: `ep-${id}-${s.seasonNumber}-${epNum}`,
            episodeNumber: epNum,
            title: epTitle,
            isCompleted: false,
          };
        });
        return {
          id: seasonId,
          seasonNumber: s.seasonNumber,
          title: `Season ${s.seasonNumber}`,
          episodes,
        };
      });

      const full: SeriesFull = {
        id,
        title: input.title,
        status: input.status || "watching",
        releaseYear: input.releaseYear,
        totalSeasons: input.seasons.length,
        totalEpisodes,
        completedEpisodes: 0,
        progressText: `0/${totalEpisodes} Episodes`,
        genres: input.genres || [],
        posterUrl: input.posterUrl,
        notes: input.notes,
        seasons,
      };

      const summary: SeriesDetail = {
        id: full.id,
        title: full.title,
        status: full.status,
        releaseYear: full.releaseYear,
        totalSeasons: full.totalSeasons,
        totalEpisodes: full.totalEpisodes,
        completedEpisodes: full.completedEpisodes,
        progressText: full.progressText,
        genres: full.genres,
        posterUrl: full.posterUrl,
        notes: full.notes,
      };

      this.localData.seriesSummary.unshift(summary);
      this.localData.seriesDetailMap[id] = full;
      return full;
    }

    return await invoke<SeriesFull>("create_series", { input });
  }

  static async updateSeries(input: UpdateSeriesInput): Promise<boolean> {
    if (!this.isTauri()) {
      const summary = this.localData.seriesSummary.find((s: SeriesDetail) => s.id === input.id);
      if (summary) {
        summary.title = input.title;
        summary.releaseYear = input.releaseYear;
        summary.status = input.status;
        summary.rating = input.rating;
        summary.notes = input.notes;
        summary.posterUrl = input.posterUrl;
        if (input.genres) summary.genres = input.genres;
      }
      const full = this.localData.seriesDetailMap[input.id];
      if (full) {
        full.title = input.title;
        full.releaseYear = input.releaseYear;
        full.status = input.status;
        full.rating = input.rating;
        full.notes = input.notes;
        full.posterUrl = input.posterUrl;
        if (input.genres) full.genres = input.genres;
      }
      return true;
    }

    return await invoke<boolean>("update_series", { input });
  }

  static async deleteSeries(seriesId: string): Promise<boolean> {
    if (!this.isTauri()) {
      this.localData.seriesSummary = this.localData.seriesSummary.filter((s: SeriesDetail) => s.id !== seriesId);
      delete this.localData.seriesDetailMap[seriesId];
      return true;
    }

    return await invoke<boolean>("delete_series", { seriesId });
  }

  static async updateEpisodeTitle(episodeId: string, title: string): Promise<boolean> {
    if (!this.isTauri()) {
      for (const sKey of Object.keys(this.localData.seriesDetailMap)) {
        const full: SeriesFull = this.localData.seriesDetailMap[sKey];
        for (const sea of full.seasons) {
          const ep = sea.episodes.find((e: EpisodeDetail) => e.id === episodeId);
          if (ep) {
            ep.title = title.trim();
            return true;
          }
        }
      }
      return true;
    }

    return await invoke<boolean>("update_episode_title", { episodeId, title });
  }

  static async toggleEpisodeCompletion(episodeId: string, isCompleted: boolean): Promise<ToggleEpisodeResult> {
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

            const seriesCompleted = full.totalEpisodes > 0 && completedCount === full.totalEpisodes;
            if (seriesCompleted) {
              full.status = "completed";
            } else if (!isCompleted && full.status === "completed") {
              full.status = "watching";
            }

            // Also update summary
            const summary = this.localData.seriesSummary.find((s: SeriesDetail) => s.id === full.id);
            if (summary) {
              summary.completedEpisodes = completedCount;
              summary.progressText = full.progressText;
              summary.status = full.status;
            }

            return {
              isCompleted,
              seriesCompleted,
              totalEpisodes: full.totalEpisodes,
              completedEpisodes: completedCount,
            };
          }
        }
      }
      return {
        isCompleted,
        seriesCompleted: false,
        totalEpisodes: 0,
        completedEpisodes: 0,
      };
    }
    return await invoke<ToggleEpisodeResult>("toggle_episode_completion", { episodeId, isCompleted });
  }

  static async rateSeries(seriesId: string, rating: number): Promise<boolean> {
    if (!this.isTauri()) {
      const summary = this.localData.seriesSummary.find((s: SeriesDetail) => s.id === seriesId);
      if (summary) summary.rating = rating;
      const full = this.localData.seriesDetailMap[seriesId];
      if (full) full.rating = rating;
      return true;
    }

    return await invoke<boolean>("rate_series", { seriesId, rating });
  }

  static async addSeason(seriesId: string, episodeCount: number): Promise<SeasonDetail> {
    if (!this.isTauri()) {
      const full = this.localData.seriesDetailMap[seriesId];
      const nextSeasonNum = (full?.seasons?.length || 0) + 1;
      const seasonId = `sea-${seriesId}-${nextSeasonNum}`;
      const episodes: EpisodeDetail[] = Array.from({ length: episodeCount }, (_, i) => ({
        id: `ep-${seriesId}-${nextSeasonNum}-${i + 1}`,
        episodeNumber: i + 1,
        title: `Episode ${i + 1}`,
        isCompleted: false,
      }));

      const newSeason: SeasonDetail = {
        id: seasonId,
        seasonNumber: nextSeasonNum,
        title: `Season ${nextSeasonNum}`,
        episodes,
      };

      if (full) {
        full.seasons.push(newSeason);
        full.totalSeasons = full.seasons.length;
        full.totalEpisodes += episodeCount;
        full.progressText = `${full.completedEpisodes}/${full.totalEpisodes} Episodes`;
      }
      const summary = this.localData.seriesSummary.find((s: SeriesDetail) => s.id === seriesId);
      if (summary && full) {
        summary.totalSeasons = full.totalSeasons;
        summary.totalEpisodes = full.totalEpisodes;
        summary.progressText = full.progressText;
      }
      return newSeason;
    }

    return await invoke<SeasonDetail>("add_season", { seriesId, episodeCount });
  }

  static async deleteSeason(seasonId: string): Promise<boolean> {
    if (!this.isTauri()) {
      for (const sKey of Object.keys(this.localData.seriesDetailMap)) {
        const full: SeriesFull = this.localData.seriesDetailMap[sKey];
        const idx = full.seasons.findIndex((s: SeasonDetail) => s.id === seasonId);
        if (idx !== -1) {
          const removed = full.seasons.splice(idx, 1)[0];
          const removedCompleted = removed.episodes.filter((e: EpisodeDetail) => e.isCompleted).length;
          full.totalSeasons = full.seasons.length;
          full.totalEpisodes -= removed.episodes.length;
          full.completedEpisodes -= removedCompleted;
          full.progressText = `${full.completedEpisodes}/${full.totalEpisodes} Episodes`;

          const summary = this.localData.seriesSummary.find((s: SeriesDetail) => s.id === full.id);
          if (summary) {
            summary.totalSeasons = full.totalSeasons;
            summary.totalEpisodes = full.totalEpisodes;
            summary.completedEpisodes = full.completedEpisodes;
            summary.progressText = full.progressText;
          }
          return true;
        }
      }
      return true;
    }

    return await invoke<boolean>("delete_season", { seasonId });
  }

  static async addEpisode(seasonId: string, title?: string): Promise<EpisodeDetail> {
    if (!this.isTauri()) {
      for (const sKey of Object.keys(this.localData.seriesDetailMap)) {
        const full: SeriesFull = this.localData.seriesDetailMap[sKey];
        const sea = full.seasons.find((s: SeasonDetail) => s.id === seasonId);
        if (sea) {
          const nextEpNum = sea.episodes.length + 1;
          const newEp: EpisodeDetail = {
            id: `ep-${sea.id}-${nextEpNum}`,
            episodeNumber: nextEpNum,
            title: title?.trim() || `Episode ${nextEpNum}`,
            isCompleted: false,
          };
          sea.episodes.push(newEp);
          full.totalEpisodes += 1;
          full.progressText = `${full.completedEpisodes}/${full.totalEpisodes} Episodes`;
          const summary = this.localData.seriesSummary.find((s: SeriesDetail) => s.id === full.id);
          if (summary) {
            summary.totalEpisodes = full.totalEpisodes;
            summary.progressText = full.progressText;
          }
          return newEp;
        }
      }
      return {
        id: `ep-${Date.now()}`,
        episodeNumber: 1,
        title: title || "Episode 1",
        isCompleted: false,
      };
    }

    return await invoke<EpisodeDetail>("add_episode", { seasonId, title });
  }

  static async deleteEpisode(episodeId: string): Promise<boolean> {
    if (!this.isTauri()) {
      for (const sKey of Object.keys(this.localData.seriesDetailMap)) {
        const full: SeriesFull = this.localData.seriesDetailMap[sKey];
        for (const sea of full.seasons) {
          const idx = sea.episodes.findIndex((e: EpisodeDetail) => e.id === episodeId);
          if (idx !== -1) {
            const removed = sea.episodes.splice(idx, 1)[0];
            if (removed.isCompleted) {
              full.completedEpisodes -= 1;
            }
            full.totalEpisodes -= 1;
            full.progressText = `${full.completedEpisodes}/${full.totalEpisodes} Episodes`;

            const summary = this.localData.seriesSummary.find((s: SeriesDetail) => s.id === full.id);
            if (summary) {
              summary.totalEpisodes = full.totalEpisodes;
              summary.completedEpisodes = full.completedEpisodes;
              summary.progressText = full.progressText;
            }
            return true;
          }
        }
      }
      return true;
    }

    return await invoke<boolean>("delete_episode", { episodeId });
  }

  // =============================================================
  // Entertainment Archive
  // =============================================================

  static async getArchiveData(filter: ArchiveFilter = "all"): Promise<ArchiveItem[]> {
    if (!this.isTauri()) {
      const all: ArchiveItem[] = this.localData.archiveItems;
      if (filter === "all") return all;
      if (filter === "movies" || filter === "movie") return all.filter((i: ArchiveItem) => i.type === "movie");
      if (filter === "series") return all.filter((i: ArchiveItem) => i.type === "series");
      return all;
    }
    return await invoke<ArchiveItem[]>("get_archive_data", {
      filter: filter === "all" ? null : filter,
    });
  }

  static async checkArchiveDuplicate(title: string, releaseYear: number | undefined, itemType: string): Promise<boolean> {
    if (!this.isTauri()) {
      const match = this.localData.archiveItems.some(
        (i: ArchiveItem) =>
          i.type === itemType &&
          i.title.toLowerCase() === title.toLowerCase().trim() &&
          (i.releaseYear === releaseYear || (!i.releaseYear && !releaseYear))
      );
      return match;
    }
    return await invoke<boolean>("check_archive_duplicate", { title, releaseYear, itemType });
  }

  static async addHistoricalEntry(input: AddHistoricalInput): Promise<ArchiveItem> {
    if (!this.isTauri()) {
      const id = `${input.itemType === "movie" ? "mov" : "ser"}-hist-${Date.now()}`;
      const newItem: ArchiveItem = {
        id,
        type: input.itemType,
        title: input.title.trim(),
        releaseYear: input.releaseYear,
        rating: input.rating,
        genres: input.genres || [],
        dateCompleted: input.dateCompleted || new Date().toISOString().slice(0, 10),
        isHistorical: true,
        notes: input.notes,
        totalSeasons: input.totalSeasons,
        totalEpisodes: input.totalEpisodes,
      };

      this.localData.archiveItems.unshift(newItem);
      return newItem;
    }

    return await invoke<ArchiveItem>("add_historical_entry", { input });
  }

  static async updateArchivedEntry(input: UpdateArchivedInput): Promise<boolean> {
    if (!this.isTauri()) {
      const item = this.localData.archiveItems.find((i: ArchiveItem) => i.id === input.id);
      if (item) {
        item.title = input.title.trim();
        item.releaseYear = input.releaseYear;
        item.rating = input.rating;
        if (input.dateCompleted) item.dateCompleted = input.dateCompleted;
        if (input.genres) item.genres = input.genres;
        item.notes = input.notes;
        item.totalSeasons = input.totalSeasons;
        item.totalEpisodes = input.totalEpisodes;
      }
      return true;
    }

    return await invoke<boolean>("update_archived_entry", { input });
  }

  static async deleteArchivedEntry(id: string, itemType: string): Promise<boolean> {
    if (!this.isTauri()) {
      this.localData.archiveItems = this.localData.archiveItems.filter((i: ArchiveItem) => i.id !== id);
      return true;
    }

    return await invoke<boolean>("delete_archived_entry", { id, itemType });
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

  static async createPlanItem(input: CreatePlanItemInput): Promise<PlanItem> {
    if (!this.isTauri()) {
      const id = `plan-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const itemsInPeriod = this.localData.planItems.filter(
        (p: PlanItem) => p.periodType === input.periodType && p.periodIdentifier === input.periodIdentifier
      );
      const maxPriority = itemsInPeriod.reduce((max: number, p: PlanItem) => Math.max(max, p.priorityOrder), 0);
      const priorityOrder = input.priorityOrder ?? maxPriority + 1;

      // Check if linked entity is completed
      let isCompleted = false;
      let completedAt: string | undefined = undefined;

      if (input.linkedTaskId) {
        const t = this.localData.tasks.find((task: TaskDetail) => task.id === input.linkedTaskId);
        if (t && t.isCompleted) {
          isCompleted = true;
          completedAt = new Date().toISOString();
        }
      } else if (input.linkedMovieId) {
        const m = this.localData.movies.find((mov: MovieDetail) => mov.id === input.linkedMovieId);
        if (m && m.status === "completed") {
          isCompleted = true;
          completedAt = new Date().toISOString();
        }
      } else if (input.linkedSeriesId) {
        const s = this.localData.seriesSummary.find((ser: SeriesDetail) => ser.id === input.linkedSeriesId);
        if (s && s.status === "completed") {
          isCompleted = true;
          completedAt = new Date().toISOString();
        }
      }

      const newItem: PlanItem = {
        id,
        periodType: input.periodType,
        periodIdentifier: input.periodIdentifier,
        category: input.category,
        customCategoryName: input.customCategoryName,
        title: input.title,
        description: input.description,
        priorityOrder,
        isCompleted,
        completedAt,
        linkedTaskId: input.linkedTaskId,
        linkedMovieId: input.linkedMovieId,
        linkedSeriesId: input.linkedSeriesId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      this.localData.planItems.push(newItem);
      return newItem;
    }

    return await invoke<PlanItem>("create_plan_item", { input });
  }

  static async updatePlanItem(input: UpdatePlanItemInput): Promise<boolean> {
    if (!this.isTauri()) {
      const item = this.localData.planItems.find((p: PlanItem) => p.id === input.id);
      if (item) {
        item.category = input.category;
        item.customCategoryName = input.customCategoryName;
        item.title = input.title;
        item.description = input.description;
        if (input.priorityOrder !== undefined) {
          item.priorityOrder = input.priorityOrder;
        }
        item.linkedTaskId = input.linkedTaskId;
        item.linkedMovieId = input.linkedMovieId;
        item.linkedSeriesId = input.linkedSeriesId;
        item.updatedAt = new Date().toISOString();

        if (input.linkedTaskId) {
          const t = this.localData.tasks.find((task: TaskDetail) => task.id === input.linkedTaskId);
          if (t && t.isCompleted && !item.isCompleted) {
            item.isCompleted = true;
            item.completedAt = new Date().toISOString();
          }
        } else if (input.linkedMovieId) {
          const m = this.localData.movies.find((mov: MovieDetail) => mov.id === input.linkedMovieId);
          if (m && m.status === "completed" && !item.isCompleted) {
            item.isCompleted = true;
            item.completedAt = new Date().toISOString();
          }
        } else if (input.linkedSeriesId) {
          const s = this.localData.seriesSummary.find((ser: SeriesDetail) => ser.id === input.linkedSeriesId);
          if (s && s.status === "completed" && !item.isCompleted) {
            item.isCompleted = true;
            item.completedAt = new Date().toISOString();
          }
        }
      }
      return true;
    }

    return await invoke<boolean>("update_plan_item", { input });
  }

  static async deletePlanItem(itemId: string): Promise<boolean> {
    if (!this.isTauri()) {
      this.localData.planItems = this.localData.planItems.filter((p: PlanItem) => p.id !== itemId);
      return true;
    }

    return await invoke<boolean>("delete_plan_item", { itemId });
  }

  static async reorderPlanItems(itemIds: string[]): Promise<boolean> {
    if (!this.isTauri()) {
      itemIds.forEach((id, index) => {
        const item = this.localData.planItems.find((p: PlanItem) => p.id === id);
        if (item) {
          item.priorityOrder = index + 1;
        }
      });
      return true;
    }

    return await invoke<boolean>("reorder_plan_items", { itemIds });
  }

  static async carryForwardPlanItems(
    fromPeriodType: PlanPeriod,
    fromPeriodId: string,
    toPeriodId: string
  ): Promise<number> {
    if (!this.isTauri()) {
      const unfinished = this.localData.planItems.filter(
        (p: PlanItem) => p.periodType === fromPeriodType && p.periodIdentifier === fromPeriodId && !p.isCompleted
      );

      let count = 0;
      for (const item of unfinished) {
        const exists = this.localData.planItems.some(
          (p: PlanItem) =>
            p.periodType === fromPeriodType &&
            p.periodIdentifier === toPeriodId &&
            p.title.toLowerCase() === item.title.toLowerCase()
        );

        if (!exists) {
          const itemsInTarget = this.localData.planItems.filter(
            (p: PlanItem) => p.periodType === fromPeriodType && p.periodIdentifier === toPeriodId
          );
          const maxP = itemsInTarget.reduce((max: number, p: PlanItem) => Math.max(max, p.priorityOrder), 0);

          const rolled: PlanItem = {
            id: `plan-${Date.now()}-${count}`,
            periodType: fromPeriodType,
            periodIdentifier: toPeriodId,
            category: item.category,
            customCategoryName: item.customCategoryName,
            title: item.title,
            description: item.description,
            priorityOrder: maxP + 1,
            isCompleted: false,
            linkedTaskId: item.linkedTaskId,
            linkedMovieId: item.linkedMovieId,
            linkedSeriesId: item.linkedSeriesId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          this.localData.planItems.push(rolled);
          count++;
        }
      }
      return count;
    }

    return await invoke<number>("carry_forward_plan_items", {
      fromPeriodType,
      fromPeriodId,
      toPeriodId,
    });
  }

  // =============================================================
  // Activity History & Statistics
  // =============================================================

  static async getActivityHistory(
    activityType: string = "all",
    dateFilter: string = "all",
    limit: number = 50
  ): Promise<ActivityHistoryItem[]> {
    if (!this.isTauri()) {
      let list = [...this.localData.activityHistory];
      if (activityType !== "all") {
        list = list.filter((a: ActivityHistoryItem) => a.activityType.startsWith(activityType));
      }
      if (dateFilter === "today") {
        list = list.filter((a: ActivityHistoryItem) => a.timestamp.startsWith("2026-11-16"));
      } else if (dateFilter === "week") {
        list = list.filter((a: ActivityHistoryItem) => a.timestamp >= "2026-11-09");
      } else if (dateFilter === "month") {
        list = list.filter((a: ActivityHistoryItem) => a.timestamp >= "2026-10-16");
      }
      return list.slice(0, limit);
    }
    return await invoke<ActivityHistoryItem[]>("get_activity_history", {
      activityType: activityType === "all" ? null : activityType,
      dateFilter: dateFilter === "all" ? null : dateFilter,
      limit,
    });
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

  // =============================================================
  // Database Backup & Restore (Phase 8)
  // =============================================================

  static async exportBackup(): Promise<string> {
    if (!this.isTauri()) {
      const payload: DatabaseBackupPayload = {
        app: "DAYMARK",
        version: "0.1.0",
        exportDate: new Date().toISOString(),
        tableCounts: {
          tasks: this.localData.tasks.length,
          movies: this.localData.movies.length,
          series: this.localData.series.length,
          planItems: this.localData.planItems.length,
          activityHistory: this.localData.activityHistory.length,
        },
        tables: {
          tasks: this.localData.tasks,
          movies: this.localData.movies,
          series: this.localData.series,
          plan_items: this.localData.planItems,
          activity_history: this.localData.activityHistory,
          app_settings: [this.localData.appSettings],
        },
      };
      return JSON.stringify(payload, null, 2);
    }
    return await invoke<string>("export_database_backup");
  }

  static async restoreBackup(backupJson: string): Promise<boolean> {
    if (!this.isTauri()) {
      try {
        const payload: DatabaseBackupPayload = JSON.parse(backupJson);
        if (payload.app !== "DAYMARK") {
          throw new Error("Invalid backup: app mismatch");
        }
        if (payload.tables.tasks) this.localData.tasks = payload.tables.tasks;
        if (payload.tables.movies) this.localData.movies = payload.tables.movies;
        if (payload.tables.series) this.localData.series = payload.tables.series;
        if (payload.tables.plan_items) this.localData.planItems = payload.tables.plan_items;
        if (payload.tables.activity_history) this.localData.activityHistory = payload.tables.activity_history;
        return true;
      } catch (e) {
        throw new Error(e instanceof Error ? e.message : "Failed to restore backup");
      }
    }
    return await invoke<boolean>("restore_database_backup", { backupJson });
  }
}
