// =============================================================
// DAYMARK - Unified Database & Tauri IPC Type Definitions
// =============================================================

// -------------------------------------------------------------
// Diagnostics & System Telemetry (Phase 0 Compatibility)
// -------------------------------------------------------------
export interface TableStat {
  name: string;
  count: number;
}

export interface DbStatusResponse {
  connected: boolean;
  path: string;
  journal_mode: string;
  foreign_keys_enabled: boolean;
  migration_version: number;
  tables_count: number;
  table_stats: TableStat[];
  ping_ms: number;
}

export interface AppInfoResponse {
  name: string;
  version: string;
  description: string;
  os: string;
  database_engine: string;
  sqlite_version: string;
}

// -------------------------------------------------------------
// Primitive Enums & Filter Types
// -------------------------------------------------------------
export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'cancelled';
export type TaskFilter = 'all' | 'today' | 'upcoming' | 'overdue' | 'completed';

export type MovieStatus = 'planned' | 'watching' | 'completed';
export type MovieFilter = 'all' | 'planned' | 'watching' | 'completed';

export type SeriesStatus = 'planned' | 'watching' | 'completed';
export type SeriesFilter = 'all' | 'planned' | 'watching' | 'completed';

export type ArchiveFilter = 'all' | 'movies' | 'movie' | 'series';

export type PlanPeriod = 'weekly' | 'monthly' | 'yearly';
export type PlanCategory = 'entertainment' | 'learning' | 'personal_goals' | 'projects' | 'custom';

export type ActivityType = 
  | 'task_completed' 
  | 'movie_completed' 
  | 'episode_completed' 
  | 'series_completed' 
  | 'plan_completed' 
  | 'historical_added';

// -------------------------------------------------------------
// Home Dashboard Contracts (PROJECT.md § Interface Contracts 3)
// -------------------------------------------------------------
export interface DashboardMetrics {
  completedTasksToday: number;
  pendingTasksToday: number;
  totalMoviesWatched: number;
  activeSeriesCount: number;
}

export interface DailyChecklistItem {
  id: string;
  title: string;
  category: string;
  priority: string;
  isCompleted: boolean;
}

export interface TodayGoals {
  targetTasksCount: number;
  notes: string;
}

export interface ScheduleSlot {
  time: string;
  title: string;
  type: string;
}

export interface ActivitySplinePoint {
  date: string;
  completions: number;
}

export interface DashboardData {
  greeting: string;
  streakCount: number;
  yearProgressPct: number;
  monthProgressPct: number;
  metrics: DashboardMetrics;
  dailyChecklist: DailyChecklistItem[];
  todayGoals: TodayGoals;
  scheduleSlots: ScheduleSlot[];
  activitySpline: ActivitySplinePoint[];
}

// -------------------------------------------------------------
// Daily Tasks Contracts
// -------------------------------------------------------------
export interface TaskDetail {
  id: string;
  title: string;
  description?: string;
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  priority: Priority;
  status: TaskStatus;
  dueDate?: string;
  isCompleted: boolean;
  completedAt?: string;
  subtasksCount: number;
  completedSubtasksCount: number;
}

export interface SubtaskDetail {
  id: string;
  taskId: string;
  title: string;
  isCompleted: boolean;
  completedAt?: string;
  position: number;
}

export interface CategoryDetail {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  categoryId?: string;
  priority?: Priority;
  dueDate?: string;
  subtasks?: string[];
}

export interface UpdateTaskInput {
  id: string;
  title: string;
  description?: string;
  categoryId?: string;
  priority?: Priority;
  dueDate?: string;
}

// -------------------------------------------------------------
// Movies Contracts
// -------------------------------------------------------------
export interface MovieDetail {
  id: string;
  title: string;
  releaseYear?: number;
  status: MovieStatus;
  rating?: number;
  dateWatched?: string;
  isHistorical: boolean;
  genres: string[];
  posterColor?: string;
  posterUrl?: string;
  notes?: string;
}

export interface CreateMovieInput {
  title: string;
  releaseYear?: number;
  status?: MovieStatus;
  rating?: number;
  dateWatched?: string;
  isHistorical?: boolean;
  genres?: string[];
  posterColor?: string;
  posterUrl?: string;
  notes?: string;
}

export interface UpdateMovieInput {
  id: string;
  title: string;
  releaseYear?: number;
  status: MovieStatus;
  rating?: number;
  dateWatched?: string;
  genres?: string[];
  posterColor?: string;
  posterUrl?: string;
  notes?: string;
}

// -------------------------------------------------------------
// Series & Episodes Contracts
// -------------------------------------------------------------
export interface EpisodeDetail {
  id: string;
  episodeNumber: number;
  title: string;
  isCompleted: boolean;
  completedAt?: string;
  notes?: string;
}

export interface SeasonDetail {
  id: string;
  seasonNumber: number;
  title: string;
  episodes: EpisodeDetail[];
}

export interface SeriesDetail {
  id: string;
  title: string;
  status: SeriesStatus;
  releaseYear?: number;
  totalSeasons: number;
  totalEpisodes: number;
  completedEpisodes: number;
  progressText: string; // e.g. "2/10 Episodes"
  rating?: number;
  genres: string[];
  posterColor?: string;
  posterUrl?: string;
  notes?: string;
}

export interface SeriesFull extends SeriesDetail {
  seasons: SeasonDetail[];
}

export interface SeasonConfigInput {
  seasonNumber: number;
  episodeCount: number;
  episodeTitles?: string[];
}

export interface CreateSeriesInput {
  title: string;
  releaseYear?: number;
  status?: SeriesStatus;
  genres?: string[];
  posterUrl?: string;
  notes?: string;
  seasons: SeasonConfigInput[];
}

export interface UpdateSeriesInput {
  id: string;
  title: string;
  releaseYear?: number;
  status: SeriesStatus;
  rating?: number;
  notes?: string;
  posterUrl?: string;
  genres?: string[];
}

export interface ToggleEpisodeResult {
  isCompleted: boolean;
  seriesCompleted: boolean;
  totalEpisodes: number;
  completedEpisodes: number;
}

// -------------------------------------------------------------
// Entertainment Archive Contracts
// -------------------------------------------------------------
export interface ArchiveItem {
  id: string;
  type: 'movie' | 'series';
  title: string;
  releaseYear?: number;
  rating?: number;
  genres: string[];
  dateCompleted: string;
  isHistorical: boolean;
  notes?: string;
  totalSeasons?: number;
  totalEpisodes?: number;
}

export interface AddHistoricalInput {
  itemType: 'movie' | 'series';
  title: string;
  releaseYear?: number;
  rating?: number;
  genres?: string[];
  dateCompleted?: string;
  totalSeasons?: number;
  totalEpisodes?: number;
  notes?: string;
  posterUrl?: string;
}

export interface UpdateArchivedInput {
  id: string;
  itemType: 'movie' | 'series';
  title: string;
  releaseYear?: number;
  rating?: number;
  dateCompleted?: string;
  genres?: string[];
  notes?: string;
  totalSeasons?: number;
  totalEpisodes?: number;
}

// -------------------------------------------------------------
// Horizon Planning (PLAN) Contracts
// -------------------------------------------------------------
export interface PlanItem {
  id: string;
  periodType: PlanPeriod;
  periodIdentifier: string;
  category: PlanCategory;
  customCategoryName?: string;
  title: string;
  description?: string;
  priorityOrder: number;
  isCompleted: boolean;
  completedAt?: string;
  linkedTaskId?: string;
  linkedMovieId?: string;
  linkedSeriesId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePlanItemInput {
  periodType: PlanPeriod;
  periodIdentifier: string;
  category: PlanCategory;
  customCategoryName?: string;
  title: string;
  description?: string;
  priorityOrder?: number;
  linkedTaskId?: string;
  linkedMovieId?: string;
  linkedSeriesId?: string;
}

export interface UpdatePlanItemInput {
  id: string;
  category: PlanCategory;
  customCategoryName?: string;
  title: string;
  description?: string;
  priorityOrder?: number;
  linkedTaskId?: string;
  linkedMovieId?: string;
  linkedSeriesId?: string;
}

// -------------------------------------------------------------
// Activity History & Statistics Contracts
// -------------------------------------------------------------
export interface ActivityHistoryItem {
  id: string;
  activityType: ActivityType;
  entityType: string;
  entityId: string;
  title: string;
  metadataJson?: string;
  timestamp: string;
}

export interface CategoryStat {
  category: string;
  color: string;
  count: number;
}

export interface DayOfWeekStat {
  day: string;
  completions: number;
}

export interface MonthlyTrendStat {
  month: string;
  tasks: number;
  media: number;
}

export interface StatisticsData {
  totalTasksCompleted: number;
  tasksCompletionRate: number;
  currentStreakDays: number;
  longestStreakDays: number;
  totalMoviesCompleted: number;
  totalEpisodesCompleted: number;
  totalWatchTimeHours: number;
  completionsByCategory: CategoryStat[];
  completionsByDayOfWeek: DayOfWeekStat[];
  monthlyTrend: MonthlyTrendStat[];
}

// -------------------------------------------------------------
// App Settings Contract
// -------------------------------------------------------------
export type AppSettings = Record<string, string>;

// -------------------------------------------------------------
// Legacy Entity Row Types (Preserved for internal DB mapping)
// -------------------------------------------------------------
export interface TaskCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
  position: number;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  due_date?: string;
  priority: Priority;
  category_id?: string;
  status: TaskStatus;
  is_completed: boolean;
  completed_at?: string;
  reminder_at?: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface Subtask {
  id: string;
  task_id: string;
  title: string;
  is_completed: boolean;
  completed_at?: string;
  position: number;
  created_at: string;
}

export interface DailyGoal {
  id: string;
  date: string;
  target_tasks_count: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Movie {
  id: string;
  title: string;
  release_year?: number;
  poster_url?: string;
  status: MovieStatus;
  personal_rating?: number;
  date_watched?: string;
  notes?: string;
  is_historical: boolean;
  archived_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Series {
  id: string;
  title: string;
  release_year?: number;
  poster_url?: string;
  status: SeriesStatus;
  total_seasons: number;
  personal_rating?: number;
  date_completed?: string;
  notes?: string;
  is_historical: boolean;
  archived_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Season {
  id: string;
  series_id: string;
  season_number: number;
  total_episodes: number;
  created_at: string;
}

export interface Episode {
  id: string;
  season_id: string;
  series_id: string;
  episode_number: number;
  title: string;
  is_completed: boolean;
  completed_at?: string;
  notes?: string;
  created_at: string;
}

export interface Genre {
  id: string;
  name: string;
  created_at: string;
}
