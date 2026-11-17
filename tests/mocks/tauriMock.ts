import { mockIPC } from "@tauri-apps/api/mocks";
import type {
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
  DbStatusResponse,
  AppInfoResponse,
} from "../../src/lib/db/types";

// =============================================================
// Seed Dataset Template (Frozen reference for resets)
// =============================================================

const INITIAL_APP_SETTINGS: AppSettings = {
  theme: "dark",
  streak_count: "14",
  streak_last_date: "2026-11-16",
  user_name: "Alex",
  app_version: "0.1.0",
  sidebar_collapsed: "false",
};

const INITIAL_DASHBOARD: DashboardData = {
  greeting: "It's Monday, November 16, 2026",
  streakCount: 14,
  yearProgressPct: 88.0,
  monthProgressPct: 53.3,
  metrics: {
    completedTasksToday: 4,
    pendingTasksToday: 2,
    totalMoviesWatched: 18,
    activeSeriesCount: 3,
  },
  dailyChecklist: [
    {
      id: "chk-1",
      title: "Review daily schedule and priority goals",
      category: "Focus",
      priority: "high",
      isCompleted: true,
    },
    {
      id: "chk-2",
      title: "Finalize Phase 1 Tauri IPC Bridge implementation",
      category: "Work",
      priority: "urgent",
      isCompleted: true,
    },
    {
      id: "chk-3",
      title: "5km interval cardio session",
      category: "Fitness",
      priority: "medium",
      isCompleted: false,
    },
    {
      id: "chk-4",
      title: "Design system token contrast audit",
      category: "Focus",
      priority: "high",
      isCompleted: false,
    },
    {
      id: "chk-5",
      title: "Log evening entertainment entry",
      category: "Entertainment",
      priority: "low",
      isCompleted: false,
    },
  ],
  todayGoals: {
    targetTasksCount: 6,
    notes: "Focus on Q4 architectural deliverables, Rust SQLite migrations, and evening 5km run.",
  },
  scheduleSlots: [
    { time: "09:00 AM", title: "Deep Work — Desktop Shell Architecture", type: "work" },
    { time: "11:30 AM", title: "Sprint Review & Sync", type: "meeting" },
    { time: "02:00 PM", title: "Rust IPC Bridge & Test Verification", type: "work" },
    { time: "05:00 PM", title: "Gym — Upper Body & Core", type: "personal" },
    { time: "08:00 PM", title: "Severance — Season 2 Episode 3", type: "entertainment" },
  ],
  activitySpline: [
    { date: "2026-11-10", completions: 5 },
    { date: "2026-11-11", completions: 7 },
    { date: "2026-11-12", completions: 6 },
    { date: "2026-11-13", completions: 8 },
    { date: "2026-11-14", completions: 4 },
    { date: "2026-11-15", completions: 9 },
    { date: "2026-11-16", completions: 5 },
  ],
};

const INITIAL_TASKS: TaskDetail[] = [
  // Urgent priority
  {
    id: "task-urgent-1",
    title: "Finalize Phase 1 Tauri IPC Bridge implementation",
    description: "Implement all Rust invoke handlers and verify connection pool with WAL mode",
    categoryId: "cat-work",
    categoryName: "Work",
    categoryColor: "#3b82f6",
    priority: "urgent",
    status: "in_progress",
    dueDate: "2026-11-16",
    isCompleted: false,
    subtasksCount: 3,
    completedSubtasksCount: 1,
  },
  {
    id: "task-urgent-2",
    title: "Submit Monthly Cloud Infrastructure Expense Report",
    description: "Consolidate AWS and Azure invoice receipts for finance review",
    categoryId: "cat-work",
    categoryName: "Work",
    categoryColor: "#3b82f6",
    priority: "urgent",
    status: "todo",
    dueDate: "2026-11-14", // overdue
    isCompleted: false,
    subtasksCount: 3,
    completedSubtasksCount: 1,
  },
  // High priority
  {
    id: "task-high-1",
    title: "Design System Token Audit",
    description: "Verify obsidian dark mode tokens and contrast ratios for UI cards",
    categoryId: "cat-focus",
    categoryName: "Focus",
    categoryColor: "#ec4899",
    priority: "high",
    status: "in_progress",
    dueDate: "2026-11-16",
    isCompleted: false,
    subtasksCount: 2,
    completedSubtasksCount: 1,
  },
  {
    id: "task-high-2",
    title: "Q4 Product Architecture Review",
    description: "Present desktop offline-first storage and sync strategies to the engineering leads",
    categoryId: "cat-work",
    categoryName: "Work",
    categoryColor: "#3b82f6",
    priority: "high",
    status: "todo",
    dueDate: "2026-11-18", // upcoming
    isCompleted: false,
    subtasksCount: 3,
    completedSubtasksCount: 0,
  },
  {
    id: "task-high-3",
    title: "Complete Tauri v2 IPC Migration Workshop",
    description: "Hands-on refactoring of legacy invoke calls to modern typed Tauri commands",
    categoryId: "cat-learning",
    categoryName: "Learning",
    categoryColor: "#8b5cf6",
    priority: "high",
    status: "completed",
    dueDate: "2026-11-16",
    isCompleted: true,
    completedAt: "2026-11-16 10:15:00",
    subtasksCount: 2,
    completedSubtasksCount: 2,
  },
  // Medium priority
  {
    id: "task-med-1",
    title: "5km Interval Cardio Session",
    description: "Warmup jog followed by 5x400m intervals on the track",
    categoryId: "cat-fitness",
    categoryName: "Fitness",
    categoryColor: "#f59e0b",
    priority: "medium",
    status: "todo",
    dueDate: "2026-11-16",
    isCompleted: false,
    subtasksCount: 3,
    completedSubtasksCount: 0,
  },
  {
    id: "task-med-2",
    title: "Morning Mobility Routine & Core Strength",
    description: "20-minute spinal flow, hip flexor stretches, and plank progressions",
    categoryId: "cat-fitness",
    categoryName: "Fitness",
    categoryColor: "#f59e0b",
    priority: "medium",
    status: "completed",
    dueDate: "2026-11-16",
    isCompleted: true,
    completedAt: "2026-11-16 07:45:00",
    subtasksCount: 2,
    completedSubtasksCount: 2,
  },
  // Low priority
  {
    id: "task-low-1",
    title: "Winter Travel Booking & Itinerary",
    description: "Finalize train reservations, mountain cabin accommodations, and gear checklist",
    categoryId: "cat-personal",
    categoryName: "Personal",
    categoryColor: "#14b8a6",
    priority: "low",
    status: "todo",
    dueDate: "2026-11-22",
    isCompleted: false,
    subtasksCount: 3,
    completedSubtasksCount: 0,
  },
  // Cancelled status
  {
    id: "task-cancelled-1",
    title: "Deprecated Legacy IPC Protocol Documentation",
    description: "Archived following Tauri v2 IPC command standardization",
    categoryId: "cat-learning",
    categoryName: "Learning",
    categoryColor: "#8b5cf6",
    priority: "low",
    status: "cancelled",
    isCompleted: false,
    subtasksCount: 1,
    completedSubtasksCount: 0,
  },
];

const INITIAL_MOVIES: MovieDetail[] = [
  {
    id: "mov-1",
    title: "Dune: Part Two",
    releaseYear: 2024,
    status: "completed",
    rating: 9.2,
    dateWatched: "2026-11-10",
    isHistorical: false,
    genres: ["Sci-Fi", "Adventure", "Drama"],
    posterColor: "#8b5cf6",
  },
  {
    id: "mov-2",
    title: "Oppenheimer",
    releaseYear: 2023,
    status: "completed",
    rating: 9.5,
    dateWatched: "2026-11-05",
    isHistorical: true,
    genres: ["Drama", "Documentary", "Thriller"],
    posterColor: "#8b5cf6",
  },
  {
    id: "mov-3",
    title: "Spider-Man: Across the Spider-Verse",
    releaseYear: 2023,
    status: "completed",
    rating: 9.4,
    dateWatched: "2026-10-28",
    isHistorical: false,
    genres: ["Animation", "Action", "Adventure"],
    posterColor: "#8b5cf6",
  },
  {
    id: "mov-4",
    title: "Interstellar",
    releaseYear: 2014,
    status: "completed",
    rating: 9.8,
    dateWatched: "2026-10-15",
    isHistorical: true,
    genres: ["Sci-Fi", "Drama", "Adventure"],
    posterColor: "#8b5cf6",
  },
  {
    id: "mov-5",
    title: "Blade Runner 2049",
    releaseYear: 2017,
    status: "watching",
    isHistorical: false,
    genres: ["Sci-Fi", "Mystery", "Thriller"],
    posterColor: "#8b5cf6",
  },
  {
    id: "mov-6",
    title: "The Batman: Part II",
    releaseYear: 2026,
    status: "planned",
    isHistorical: false,
    genres: ["Action", "Crime", "Drama"],
    posterColor: "#8b5cf6",
  },
];

const INITIAL_SERIES: SeriesDetail[] = [
  {
    id: "ser-severance",
    title: "Severance",
    status: "watching",
    totalSeasons: 2,
    totalEpisodes: 19,
    completedEpisodes: 11,
    progressText: "2/10 Episodes",
    rating: 9.5,
    genres: ["Sci-Fi", "Mystery", "Thriller"],
  },
  {
    id: "ser-arcane",
    title: "Arcane",
    status: "watching",
    totalSeasons: 2,
    totalEpisodes: 18,
    completedEpisodes: 12,
    progressText: "3/9 Episodes",
    rating: 9.6,
    genres: ["Animation", "Action", "Fantasy"],
  },
  {
    id: "ser-breaking-bad",
    title: "Breaking Bad",
    status: "completed",
    totalSeasons: 5,
    totalEpisodes: 62,
    completedEpisodes: 62,
    progressText: "Completed",
    rating: 9.9,
    genres: ["Crime", "Drama", "Thriller"],
  },
  {
    id: "ser-succession",
    title: "Succession",
    status: "completed",
    totalSeasons: 4,
    totalEpisodes: 39,
    completedEpisodes: 39,
    progressText: "Completed",
    rating: 9.7,
    genres: ["Drama"],
  },
  {
    id: "ser-tlou",
    title: "The Last of Us",
    status: "watching",
    totalSeasons: 2,
    totalEpisodes: 16,
    completedEpisodes: 9,
    progressText: "0/7 Episodes",
    rating: 9.1,
    genres: ["Drama", "Action", "Sci-Fi"],
  },
];

const INITIAL_SERIES_DETAILS: Record<string, SeriesFull> = {
  "ser-severance": {
    ...INITIAL_SERIES[0],
    seasons: [
      {
        id: "sea-sev-1",
        seasonNumber: 1,
        title: "Season 1",
        episodes: [
          { id: "ep-sev-1-1", episodeNumber: 1, title: "Good News About Hell", isCompleted: true },
          { id: "ep-sev-1-2", episodeNumber: 2, title: "Half Loop", isCompleted: true },
          { id: "ep-sev-1-3", episodeNumber: 3, title: "In Perpetuity", isCompleted: true },
          { id: "ep-sev-1-4", episodeNumber: 4, title: "The You You Are", isCompleted: true },
          { id: "ep-sev-1-5", episodeNumber: 5, title: "The Grim Barbarity of Optics and Design", isCompleted: true },
          { id: "ep-sev-1-6", episodeNumber: 6, title: "Hide and Seek", isCompleted: true },
          { id: "ep-sev-1-7", episodeNumber: 7, title: "Defiant Jazz", isCompleted: true },
          { id: "ep-sev-1-8", episodeNumber: 8, title: "What's for Dinner?", isCompleted: true },
          { id: "ep-sev-1-9", episodeNumber: 9, title: "The We We Are", isCompleted: true },
        ],
      },
      {
        id: "sea-sev-2",
        seasonNumber: 2,
        title: "Season 2",
        episodes: [
          { id: "ep-sev-2-1", episodeNumber: 1, title: "Hello Ms. Cobel", isCompleted: true },
          { id: "ep-sev-2-2", episodeNumber: 2, title: "Severance Protocol", isCompleted: true },
          { id: "ep-sev-2-3", episodeNumber: 3, title: "The Board In Session", isCompleted: false },
          { id: "ep-sev-2-4", episodeNumber: 4, title: "Woe", isCompleted: false },
          { id: "ep-sev-2-5", episodeNumber: 5, title: "Tether", isCompleted: false },
          { id: "ep-sev-2-6", episodeNumber: 6, title: "The Reintegration", isCompleted: false },
          { id: "ep-sev-2-7", episodeNumber: 7, title: "Chime", isCompleted: false },
          { id: "ep-sev-2-8", episodeNumber: 8, title: "Kier's Chamber", isCompleted: false },
          { id: "ep-sev-2-9", episodeNumber: 9, title: "Cold Harbor", isCompleted: false },
          { id: "ep-sev-2-10", episodeNumber: 10, title: "The Deepening", isCompleted: false },
        ],
      },
    ],
  },
};

const INITIAL_ARCHIVE_ITEMS: ArchiveItem[] = [
  {
    id: "mov-1",
    type: "movie",
    title: "Dune: Part Two",
    releaseYear: 2024,
    rating: 9.2,
    genres: ["Sci-Fi", "Adventure", "Drama"],
    dateCompleted: "2026-11-10",
    isHistorical: false,
  },
  {
    id: "mov-2",
    type: "movie",
    title: "Oppenheimer",
    releaseYear: 2023,
    rating: 9.5,
    genres: ["Drama", "Documentary", "Thriller"],
    dateCompleted: "2026-11-05",
    isHistorical: true,
  },
  {
    id: "mov-4",
    type: "movie",
    title: "Interstellar",
    releaseYear: 2014,
    rating: 9.8,
    genres: ["Sci-Fi", "Drama", "Adventure"],
    dateCompleted: "2026-10-15",
    isHistorical: true,
  },
  {
    id: "ser-breaking-bad",
    type: "series",
    title: "Breaking Bad",
    releaseYear: 2008,
    rating: 9.9,
    genres: ["Crime", "Drama", "Thriller"],
    dateCompleted: "2026-09-12",
    isHistorical: false,
  },
  {
    id: "ser-succession",
    type: "series",
    title: "Succession",
    releaseYear: 2018,
    rating: 9.7,
    genres: ["Drama"],
    dateCompleted: "2026-10-04",
    isHistorical: false,
  },
];

const INITIAL_PLAN_ITEMS: PlanItem[] = [
  {
    id: "plan-week-1",
    periodType: "weekly",
    periodIdentifier: "2026-W47",
    category: "projects",
    title: "Ship Milestone T0 Test Harness",
    priorityOrder: 1,
    isCompleted: true,
    completedAt: "2026-11-16 11:00:00",
  },
  {
    id: "plan-week-2",
    periodType: "weekly",
    periodIdentifier: "2026-W47",
    category: "personal_goals",
    title: "Complete 25km cumulative running mileage",
    priorityOrder: 2,
    isCompleted: false,
  },
  {
    id: "plan-month-1",
    periodType: "monthly",
    periodIdentifier: "2026-11",
    category: "projects",
    title: "Deliver DAYMARK Phase 1 E2E Test Suite",
    priorityOrder: 1,
    isCompleted: false,
  },
  {
    id: "plan-month-2",
    periodType: "monthly",
    periodIdentifier: "2026-11",
    category: "entertainment",
    title: "Finish Severance Season 2",
    priorityOrder: 2,
    isCompleted: false,
  },
  {
    id: "plan-year-1",
    periodType: "yearly",
    periodIdentifier: "2026",
    category: "learning",
    title: "Master Rust Systems Programming & Concurrency",
    priorityOrder: 1,
    isCompleted: false,
  },
  {
    id: "plan-year-2",
    periodType: "yearly",
    periodIdentifier: "2026",
    category: "personal_goals",
    title: "Maintain 100+ day productivity streak",
    priorityOrder: 2,
    isCompleted: false,
  },
];

const INITIAL_ACTIVITY_HISTORY: ActivityHistoryItem[] = [
  {
    id: "act-1",
    activityType: "task_completed",
    entityType: "task",
    entityId: "task-comp-1",
    title: "Completed 'Complete Tauri v2 IPC Migration Workshop'",
    timestamp: "2026-11-16T10:15:00Z",
  },
  {
    id: "act-2",
    activityType: "task_completed",
    entityType: "task",
    entityId: "task-comp-2",
    title: "Completed 'Morning Mobility Routine & Core Strength'",
    timestamp: "2026-11-16T07:45:00Z",
  },
  {
    id: "act-3",
    activityType: "episode_completed",
    entityType: "episode",
    entityId: "ep-sev-2-2",
    title: "Watched Severance S2 E2: 'Severance Protocol'",
    timestamp: "2026-11-15T22:30:00Z",
  },
  {
    id: "act-4",
    activityType: "movie_completed",
    entityType: "movie",
    entityId: "mov-1",
    title: "Watched 'Dune: Part Two'",
    timestamp: "2026-11-10T23:15:00Z",
  },
];

const INITIAL_STATISTICS: StatisticsData = {
  totalTasksCompleted: 42,
  tasksCompletionRate: 87.5,
  currentStreakDays: 14,
  longestStreakDays: 28,
  totalMoviesCompleted: 18,
  totalEpisodesCompleted: 94,
  totalWatchTimeHours: 142.5,
  completionsByCategory: [
    { category: "Work", color: "#3b82f6", count: 18 },
    { category: "Fitness", color: "#f59e0b", count: 12 },
    { category: "Focus", color: "#ec4899", count: 8 },
    { category: "Learning", color: "#8b5cf6", count: 4 },
  ],
  completionsByDayOfWeek: [
    { day: "Mon", completions: 8 },
    { day: "Tue", completions: 7 },
    { day: "Wed", completions: 9 },
    { day: "Thu", completions: 6 },
    { day: "Fri", completions: 7 },
    { day: "Sat", completions: 4 },
    { day: "Sun", completions: 5 },
  ],
  monthlyTrend: [
    { month: "Aug", tasks: 28, media: 12 },
    { month: "Sep", tasks: 34, media: 14 },
    { month: "Oct", tasks: 38, media: 16 },
    { month: "Nov", tasks: 42, media: 18 },
  ],
};

// =============================================================
// Active In-Memory State
// =============================================================

let activeAppSettings = JSON.parse(JSON.stringify(INITIAL_APP_SETTINGS));
let activeDashboard = JSON.parse(JSON.stringify(INITIAL_DASHBOARD));
let activeTasks: TaskDetail[] = JSON.parse(JSON.stringify(INITIAL_TASKS));
let activeMovies: MovieDetail[] = JSON.parse(JSON.stringify(INITIAL_MOVIES));
let activeSeries: SeriesDetail[] = JSON.parse(JSON.stringify(INITIAL_SERIES));
let activeSeriesDetails: Record<string, SeriesFull> = JSON.parse(JSON.stringify(INITIAL_SERIES_DETAILS));
let activeArchive: ArchiveItem[] = JSON.parse(JSON.stringify(INITIAL_ARCHIVE_ITEMS));
let activePlanItems: PlanItem[] = JSON.parse(JSON.stringify(INITIAL_PLAN_ITEMS));
let activeActivityHistory: ActivityHistoryItem[] = JSON.parse(JSON.stringify(INITIAL_ACTIVITY_HISTORY));
let activeStatistics: StatisticsData = JSON.parse(JSON.stringify(INITIAL_STATISTICS));

/**
 * Resets the in-memory SQLite mock database to its pristine initial seed state.
 */
export function resetMockDb() {
  activeAppSettings = JSON.parse(JSON.stringify(INITIAL_APP_SETTINGS));
  activeDashboard = JSON.parse(JSON.stringify(INITIAL_DASHBOARD));
  activeTasks = JSON.parse(JSON.stringify(INITIAL_TASKS));
  activeMovies = JSON.parse(JSON.stringify(INITIAL_MOVIES));
  activeSeries = JSON.parse(JSON.stringify(INITIAL_SERIES));
  activeSeriesDetails = JSON.parse(JSON.stringify(INITIAL_SERIES_DETAILS));
  activeArchive = JSON.parse(JSON.stringify(INITIAL_ARCHIVE_ITEMS));
  activePlanItems = JSON.parse(JSON.stringify(INITIAL_PLAN_ITEMS));
  activeActivityHistory = JSON.parse(JSON.stringify(INITIAL_ACTIVITY_HISTORY));
  activeStatistics = JSON.parse(JSON.stringify(INITIAL_STATISTICS));
}

/**
 * Dispatches IPC commands conforming strictly to PROJECT.md § Interface Contracts.
 */
export function handleIpcCommand(cmd: string, args: Record<string, any> = {}): any {
  switch (cmd) {
    // -------------------------------------------------------------
    // System & Diagnostics Telemetry
    // -------------------------------------------------------------
    case "get_app_info": {
      const resp: AppInfoResponse = {
        name: "DAYMARK",
        version: "0.1.0",
        description: "Every day counts. Every completion stays.",
        os: "windows x86_64",
        database_engine: "SQLite 3 (Embedded WAL)",
        sqlite_version: "3.45.0",
      };
      return resp;
    }

    case "get_db_status": {
      const resp: DbStatusResponse = {
        connected: true,
        path: "C:\\Users\\Alex\\AppData\\Roaming\\com.daymark.app\\daymark.db",
        journal_mode: "wal",
        foreign_keys_enabled: true,
        migration_version: 2,
        tables_count: 15,
        table_stats: [
          { name: "tasks", count: activeTasks.length },
          { name: "movies", count: activeMovies.length },
          { name: "series", count: activeSeries.length },
          { name: "plan_items", count: activePlanItems.length },
          { name: "activity_history", count: activeActivityHistory.length },
        ],
        ping_ms: 1,
      };
      return resp;
    }

    case "ping_db": {
      return 1;
    }

    case "get_app_settings": {
      return { ...activeAppSettings };
    }

    case "set_app_setting": {
      const key = args.key;
      const value = args.value;
      if (key) {
        activeAppSettings[key] = String(value);
      }
      return true;
    }

    // -------------------------------------------------------------
    // Home Dashboard
    // -------------------------------------------------------------
    case "get_dashboard_data": {
      return JSON.parse(JSON.stringify(activeDashboard));
    }

    // -------------------------------------------------------------
    // Daily Tasks
    // -------------------------------------------------------------
    case "get_tasks": {
      const filter: TaskFilter = args.filter || "all";
      const referenceDate = "2026-11-16";
      let list = [...activeTasks];

      if (filter === "today") {
        list = list.filter((t) => t.dueDate === referenceDate || (!t.isCompleted && (!t.dueDate || t.dueDate <= referenceDate)));
      } else if (filter === "upcoming") {
        list = list.filter((t) => !t.isCompleted && t.dueDate && t.dueDate > referenceDate);
      } else if (filter === "overdue") {
        list = list.filter((t) => !t.isCompleted && t.dueDate && t.dueDate < referenceDate);
      } else if (filter === "completed") {
        list = list.filter((t) => t.isCompleted);
      }
      return JSON.parse(JSON.stringify(list));
    }

    case "toggle_task_completion": {
      const taskId = args.taskId ?? args.task_id;
      const isCompleted = args.isCompleted ?? args.is_completed ?? false;
      const task = activeTasks.find((t) => t.id === taskId);
      if (task) {
        task.isCompleted = isCompleted;
        task.status = isCompleted ? "completed" : "todo";
        task.completedAt = isCompleted ? "2026-11-16 12:00:00" : undefined;
        if (isCompleted) {
          task.completedSubtasksCount = task.subtasksCount;
        }
      }
      return true;
    }

    case "create_task": {
      const input = args.input;
      const subtasksList = input.subtasks || [];
      const newTask: TaskDetail = {
        id: `task-${Date.now()}`,
        title: input.title,
        description: input.description,
        categoryId: input.categoryId || "cat-1",
        categoryName: "Deep Work",
        categoryColor: "#14b8a6",
        priority: input.priority || "medium",
        status: "todo",
        dueDate: input.dueDate,
        isCompleted: false,
        completedAt: undefined,
        subtasksCount: subtasksList.length,
        completedSubtasksCount: 0,
      };
      activeTasks.unshift(newTask);
      return JSON.parse(JSON.stringify(newTask));
    }

    case "update_task": {
      const input = args.input;
      const task = activeTasks.find((t) => t.id === input.id);
      if (task) {
        task.title = input.title;
        task.description = input.description;
        task.priority = input.priority || task.priority;
        task.dueDate = input.dueDate;
        if (input.categoryId) task.categoryId = input.categoryId;
      }
      return true;
    }

    case "delete_task": {
      const taskId = args.taskId ?? args.task_id;
      const idx = activeTasks.findIndex((t) => t.id === taskId);
      if (idx !== -1) {
        activeTasks.splice(idx, 1);
      }
      return true;
    }

    case "get_subtasks": {
      return [
        {
          id: "sub-1",
          taskId: args.taskId ?? "task-1",
          title: "Write integration tests",
          isCompleted: true,
          position: 0,
        },
        {
          id: "sub-2",
          taskId: args.taskId ?? "task-1",
          title: "Verify SQLite persistence",
          isCompleted: false,
          position: 1,
        },
      ];
    }

    case "toggle_subtask_completion": {
      return true;
    }

    case "add_subtask": {
      return {
        id: `sub-${Date.now()}`,
        taskId: args.taskId,
        title: args.title,
        isCompleted: false,
        position: 0,
      };
    }

    case "delete_subtask": {
      return true;
    }

    case "get_task_categories": {
      return [
        { id: "cat-1", name: "Deep Work", color: "#14b8a6", icon: "briefcase" },
        { id: "cat-2", name: "Engineering", color: "#3b82f6", icon: "code" },
        { id: "cat-3", name: "Health & Fitness", color: "#10b981", icon: "activity" },
        { id: "cat-4", name: "Personal", color: "#f59e0b", icon: "user" },
      ];
    }

    case "get_daily_goal": {
      return {
        targetTasksCount: 5,
        notes: "Focus on deep work blocks and high impact items",
      };
    }

    case "update_daily_goal": {
      return true;
    }

    // -------------------------------------------------------------
    // Movies & Series
    // -------------------------------------------------------------
    case "get_movies": {
      const filter: MovieFilter = args.filter || "all";
      let list = [...activeMovies];
      if (filter !== "all") {
        list = list.filter((m) => m.status === filter);
      }
      return JSON.parse(JSON.stringify(list));
    }

    case "create_movie": {
      const input = args.input;
      const movie: MovieDetail = {
        id: `mov-${Date.now()}`,
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
      activeMovies.unshift(movie);
      return JSON.parse(JSON.stringify(movie));
    }

    case "update_movie": {
      const input = args.input;
      const movie = activeMovies.find((m) => m.id === input.id);
      if (movie) {
        movie.title = input.title;
        movie.releaseYear = input.releaseYear;
        movie.status = input.status;
        movie.rating = input.rating;
        movie.dateWatched = input.dateWatched;
        if (input.genres) movie.genres = input.genres;
        movie.notes = input.notes;
        movie.posterUrl = input.posterUrl;
        if (input.posterColor) movie.posterColor = input.posterColor;
      }
      return true;
    }

    case "delete_movie": {
      const movieId = args.movieId ?? args.movie_id;
      const idx = activeMovies.findIndex((m) => m.id === movieId);
      if (idx !== -1) {
        activeMovies.splice(idx, 1);
      }
      return true;
    }

    case "get_all_genres": {
      const set = new Set<string>();
      for (const m of activeMovies) {
        for (const g of m.genres) set.add(g);
      }
      return Array.from(set).sort();
    }

    case "get_series": {
      return JSON.parse(JSON.stringify(activeSeries));
    }

    case "get_series_detail": {
      const seriesId = args.seriesId ?? args.series_id;
      const full = activeSeriesDetails[seriesId];
      if (full) {
        return JSON.parse(JSON.stringify(full));
      }
      // If series exists in summary but detail map doesn't have custom entry, build default
      const summary = activeSeries.find((s) => s.id === seriesId);
      if (summary) {
        const generated: SeriesFull = {
          ...summary,
          seasons: [
            {
              id: `sea-${summary.id}-1`,
              seasonNumber: 1,
              title: "Season 1",
              episodes: [
                { id: `ep-${summary.id}-1-1`, episodeNumber: 1, title: "Pilot", isCompleted: true },
                { id: `ep-${summary.id}-1-2`, episodeNumber: 2, title: "Episode 2", isCompleted: false },
              ],
            },
          ],
        };
        return generated;
      }
      throw new Error(`Series with id '${seriesId}' not found.`);
    }

    case "toggle_episode_completion": {
      const episodeId = args.episodeId ?? args.episode_id;
      const isCompleted = args.isCompleted ?? args.is_completed ?? false;

      for (const seriesKey of Object.keys(activeSeriesDetails)) {
        const full = activeSeriesDetails[seriesKey];
        for (const season of full.seasons) {
          const ep = season.episodes.find((e) => e.id === episodeId);
          if (ep) {
            ep.isCompleted = isCompleted;
            ep.completedAt = isCompleted ? "2026-11-16 12:00:00" : undefined;

            let completed = 0;
            for (const s of full.seasons) {
              for (const e of s.episodes) {
                if (e.isCompleted) completed++;
              }
            }
            full.completedEpisodes = completed;
            full.progressText = `${completed}/${full.totalEpisodes} Episodes`;

            const seriesCompleted = full.totalEpisodes > 0 && completed === full.totalEpisodes;
            if (seriesCompleted) {
              full.status = "completed";
            } else if (!isCompleted && full.status === "completed") {
              full.status = "watching";
            }

            const summary = activeSeries.find((s) => s.id === full.id);
            if (summary) {
              summary.completedEpisodes = completed;
              summary.progressText = full.progressText;
              summary.status = full.status;
            }

            return {
              isCompleted,
              seriesCompleted,
              totalEpisodes: full.totalEpisodes,
              completedEpisodes: completed,
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

    case "create_series": {
      const input = args.input;
      const id = `ser-${Date.now()}`;
      let totalEpisodes = 0;
      const seasons = (input.seasons || []).map((s: any) => {
        const seasonId = `sea-${id}-${s.seasonNumber}`;
        const episodes = Array.from({ length: s.episodeCount }, (_, idx) => {
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
        totalSeasons: input.seasons ? input.seasons.length : 1,
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

      activeSeries.unshift(summary);
      activeSeriesDetails[id] = full;
      return JSON.parse(JSON.stringify(full));
    }

    case "update_series": {
      const input = args.input;
      const summary = activeSeries.find((s) => s.id === input.id);
      if (summary) {
        summary.title = input.title;
        summary.releaseYear = input.releaseYear;
        summary.status = input.status;
        summary.rating = input.rating;
        summary.notes = input.notes;
        summary.posterUrl = input.posterUrl;
        if (input.genres) summary.genres = input.genres;
      }
      const full = activeSeriesDetails[input.id];
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

    case "delete_series": {
      const seriesId = args.seriesId ?? args.series_id;
      const idx = activeSeries.findIndex((s) => s.id === seriesId);
      if (idx !== -1) {
        activeSeries.splice(idx, 1);
      }
      delete activeSeriesDetails[seriesId];
      return true;
    }

    case "update_episode_title": {
      const episodeId = args.episodeId ?? args.episode_id;
      const title = args.title;
      for (const sKey of Object.keys(activeSeriesDetails)) {
        const full = activeSeriesDetails[sKey];
        for (const sea of full.seasons) {
          const ep = sea.episodes.find((e) => e.id === episodeId);
          if (ep) {
            ep.title = title;
            return true;
          }
        }
      }
      return true;
    }

    case "rate_series": {
      const seriesId = args.seriesId ?? args.series_id;
      const rating = args.rating;
      const summary = activeSeries.find((s) => s.id === seriesId);
      if (summary) summary.rating = rating;
      const full = activeSeriesDetails[seriesId];
      if (full) full.rating = rating;
      return true;
    }

    case "add_season": {
      const seriesId = args.seriesId ?? args.series_id;
      const episodeCount = args.episodeCount ?? args.episode_count ?? 10;
      const full = activeSeriesDetails[seriesId];
      const nextSeasonNum = (full?.seasons?.length || 0) + 1;
      const seasonId = `sea-${seriesId}-${nextSeasonNum}`;
      const episodes = Array.from({ length: episodeCount }, (_, i) => ({
        id: `ep-${seriesId}-${nextSeasonNum}-${i + 1}`,
        episodeNumber: i + 1,
        title: `Episode ${i + 1}`,
        isCompleted: false,
      }));
      const newSeason = {
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
      const summary = activeSeries.find((s) => s.id === seriesId);
      if (summary && full) {
        summary.totalSeasons = full.totalSeasons;
        summary.totalEpisodes = full.totalEpisodes;
        summary.progressText = full.progressText;
      }
      return JSON.parse(JSON.stringify(newSeason));
    }

    case "delete_season": {
      const seasonId = args.seasonId ?? args.season_id;
      for (const sKey of Object.keys(activeSeriesDetails)) {
        const full = activeSeriesDetails[sKey];
        const idx = full.seasons.findIndex((s) => s.id === seasonId);
        if (idx !== -1) {
          const removed = full.seasons.splice(idx, 1)[0];
          const removedCompleted = removed.episodes.filter((e) => e.isCompleted).length;
          full.totalSeasons = full.seasons.length;
          full.totalEpisodes -= removed.episodes.length;
          full.completedEpisodes -= removedCompleted;
          full.progressText = `${full.completedEpisodes}/${full.totalEpisodes} Episodes`;

          const summary = activeSeries.find((s) => s.id === full.id);
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

    case "add_episode": {
      const seasonId = args.seasonId ?? args.season_id;
      const title = args.title;
      for (const sKey of Object.keys(activeSeriesDetails)) {
        const full = activeSeriesDetails[sKey];
        const sea = full.seasons.find((s) => s.id === seasonId);
        if (sea) {
          const nextEpNum = sea.episodes.length + 1;
          const newEp = {
            id: `ep-${sea.id}-${nextEpNum}`,
            episodeNumber: nextEpNum,
            title: title?.trim() || `Episode ${nextEpNum}`,
            isCompleted: false,
          };
          sea.episodes.push(newEp);
          full.totalEpisodes += 1;
          full.progressText = `${full.completedEpisodes}/${full.totalEpisodes} Episodes`;
          const summary = activeSeries.find((s) => s.id === full.id);
          if (summary) {
            summary.totalEpisodes = full.totalEpisodes;
            summary.progressText = full.progressText;
          }
          return JSON.parse(JSON.stringify(newEp));
        }
      }
      return {
        id: `ep-${Date.now()}`,
        episodeNumber: 1,
        title: title || "Episode 1",
        isCompleted: false,
      };
    }

    case "delete_episode": {
      const episodeId = args.episodeId ?? args.episode_id;
      for (const sKey of Object.keys(activeSeriesDetails)) {
        const full = activeSeriesDetails[sKey];
        for (const sea of full.seasons) {
          const idx = sea.episodes.findIndex((e) => e.id === episodeId);
          if (idx !== -1) {
            const removed = sea.episodes.splice(idx, 1)[0];
            if (removed.isCompleted) {
              full.completedEpisodes -= 1;
            }
            full.totalEpisodes -= 1;
            full.progressText = `${full.completedEpisodes}/${full.totalEpisodes} Episodes`;

            const summary = activeSeries.find((s) => s.id === full.id);
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

    // -------------------------------------------------------------
    // Entertainment Archive
    // -------------------------------------------------------------
    case "get_archive_data": {
      const filter: ArchiveFilter = args.filter || "all";
      let list = [...activeArchive];
      if (filter === "movies" || filter === "movie") {
        list = list.filter((a) => a.type === "movie");
      } else if (filter === "series") {
        list = list.filter((a) => a.type === "series");
      }
      return JSON.parse(JSON.stringify(list));
    }

    // -------------------------------------------------------------
    // Plan Module
    // -------------------------------------------------------------
    case "get_plan_items": {
      const periodType: PlanPeriod | null = args.periodType ?? args.period_type ?? null;
      const periodId: string | null = args.periodId ?? args.period_id ?? null;
      let list = [...activePlanItems];

      if (periodType) {
        list = list.filter((p) => p.periodType === periodType);
      }
      if (periodId) {
        list = list.filter((p) => p.periodIdentifier === periodId);
      }
      list.sort((a, b) => a.priorityOrder - b.priorityOrder);
      return JSON.parse(JSON.stringify(list));
    }

    case "toggle_plan_item_completion": {
      const itemId = args.itemId ?? args.item_id;
      const isCompleted = args.isCompleted ?? args.is_completed ?? false;
      const item = activePlanItems.find((p) => p.id === itemId);
      if (item) {
        item.isCompleted = isCompleted;
        item.completedAt = isCompleted ? "2026-11-16 12:00:00" : undefined;
      }
      return true;
    }

    // -------------------------------------------------------------
    // Activity History & Statistics
    // -------------------------------------------------------------
    case "get_activity_history": {
      const limit = typeof args.limit === "number" ? args.limit : 50;
      return JSON.parse(JSON.stringify(activeActivityHistory.slice(0, limit)));
    }

    case "get_statistics": {
      return JSON.parse(JSON.stringify(activeStatistics));
    }

    default:
      console.warn(`[Tauri Mock IPC] Unhandled command: '${cmd}'`, args);
      return null;
  }
}

/**
 * Initializes Tauri IPC interceptor with mock data handlers.
 */
export function setupTauriIpcMock() {
  if (typeof globalThis.window === "undefined") {
    (globalThis as any).window = globalThis;
  }

  mockIPC((cmd: string, args: Record<string, any> = {}) => {
    return handleIpcCommand(cmd, args);
  });
}
