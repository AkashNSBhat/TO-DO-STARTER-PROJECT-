use serde::{Deserialize, Serialize};

// =============================================================
// Diagnostics & System Telemetry (Phase 0 Compatibility)
// =============================================================
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TableStat {
    pub name: String,
    pub count: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DbStatusResponse {
    pub connected: bool,
    pub path: String,
    pub journal_mode: String,
    pub foreign_keys_enabled: bool,
    pub migration_version: i32,
    pub tables_count: usize,
    pub table_stats: Vec<TableStat>,
    pub ping_ms: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppInfoResponse {
    pub name: String,
    pub version: String,
    pub description: String,
    pub os: String,
    pub database_engine: String,
    pub sqlite_version: String,
}

// =============================================================
// Raw Entity Models (Preserved for Internal Use / Direct Queries)
// =============================================================
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskCategory {
    pub id: String,
    pub name: String,
    pub color: String,
    pub icon: String,
    pub position: i32,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Task {
    pub id: String,
    pub title: String,
    pub description: Option<String>,
    pub due_date: Option<String>,
    pub priority: String,
    pub category_id: Option<String>,
    pub status: String,
    pub is_completed: bool,
    pub completed_at: Option<String>,
    pub reminder_at: Option<String>,
    pub position: i32,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Subtask {
    pub id: String,
    pub task_id: String,
    pub title: String,
    pub is_completed: bool,
    pub completed_at: Option<String>,
    pub position: i32,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DailyGoal {
    pub id: String,
    pub date: String,
    pub target_tasks_count: i32,
    pub notes: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Movie {
    pub id: String,
    pub title: String,
    pub release_year: Option<i32>,
    pub poster_url: Option<String>,
    pub status: String,
    pub personal_rating: Option<f64>,
    pub date_watched: Option<String>,
    pub notes: Option<String>,
    pub is_historical: bool,
    pub archived_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Series {
    pub id: String,
    pub title: String,
    pub release_year: Option<i32>,
    pub poster_url: Option<String>,
    pub status: String,
    pub total_seasons: i32,
    pub personal_rating: Option<f64>,
    pub date_completed: Option<String>,
    pub notes: Option<String>,
    pub is_historical: bool,
    pub archived_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Season {
    pub id: String,
    pub series_id: String,
    pub season_number: i32,
    pub total_episodes: i32,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Episode {
    pub id: String,
    pub season_id: String,
    pub series_id: String,
    pub episode_number: i32,
    pub title: String,
    pub is_completed: bool,
    pub completed_at: Option<String>,
    pub notes: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Genre {
    pub id: String,
    pub name: String,
    pub created_at: String,
}

// =============================================================
// Home Dashboard Models
// =============================================================
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DashboardData {
    pub greeting: String,
    pub streak_count: i32,
    pub year_progress_pct: f64,
    pub month_progress_pct: f64,
    pub metrics: DashboardMetrics,
    pub daily_checklist: Vec<DailyChecklistItem>,
    pub today_goals: TodayGoals,
    pub schedule_slots: Vec<ScheduleSlot>,
    pub activity_spline: Vec<ActivitySplinePoint>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DashboardMetrics {
    pub completed_tasks_today: i64,
    pub pending_tasks_today: i64,
    pub total_movies_watched: i64,
    pub active_series_count: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DailyChecklistItem {
    pub id: String,
    pub title: String,
    pub category: String,
    pub priority: String,
    pub is_completed: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TodayGoals {
    pub target_tasks_count: i32,
    pub notes: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScheduleSlot {
    pub time: String,
    pub title: String,
    #[serde(rename = "type")]
    pub slot_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ActivitySplinePoint {
    pub date: String,
    pub completions: i64,
}

// =============================================================
// Task Detail Models
// =============================================================
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TaskDetail {
    pub id: String,
    pub title: String,
    pub description: Option<String>,
    pub category_id: String,
    pub category_name: String,
    pub category_color: String,
    pub priority: String,
    pub status: String,
    pub due_date: Option<String>,
    pub is_completed: bool,
    pub completed_at: Option<String>,
    pub subtasks_count: i64,
    pub completed_subtasks_count: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SubtaskDetail {
    pub id: String,
    pub task_id: String,
    pub title: String,
    pub is_completed: bool,
    pub completed_at: Option<String>,
    pub position: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CategoryDetail {
    pub id: String,
    pub name: String,
    pub color: String,
    pub icon: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateTaskInput {
    pub title: String,
    pub description: Option<String>,
    pub category_id: Option<String>,
    pub priority: Option<String>,
    pub due_date: Option<String>,
    pub subtasks: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateTaskInput {
    pub id: String,
    pub title: String,
    pub description: Option<String>,
    pub category_id: Option<String>,
    pub priority: Option<String>,
    pub due_date: Option<String>,
}

// =============================================================
// Movie Models
// =============================================================
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MovieDetail {
    pub id: String,
    pub title: String,
    pub release_year: Option<i32>,
    pub status: String,
    pub rating: Option<f64>,
    pub date_watched: Option<String>,
    pub is_historical: bool,
    pub genres: Vec<String>,
    pub poster_color: Option<String>,
    pub poster_url: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateMovieInput {
    pub title: String,
    pub release_year: Option<i32>,
    pub status: Option<String>,
    pub rating: Option<f64>,
    pub date_watched: Option<String>,
    pub is_historical: Option<bool>,
    pub genres: Option<Vec<String>>,
    pub poster_color: Option<String>,
    pub poster_url: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateMovieInput {
    pub id: String,
    pub title: String,
    pub release_year: Option<i32>,
    pub status: String,
    pub rating: Option<f64>,
    pub date_watched: Option<String>,
    pub genres: Option<Vec<String>>,
    pub poster_color: Option<String>,
    pub poster_url: Option<String>,
    pub notes: Option<String>,
}

// =============================================================
// Series & Episode Models
// =============================================================
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SeriesDetail {
    pub id: String,
    pub title: String,
    pub status: String,
    pub release_year: Option<i32>,
    pub total_seasons: i32,
    pub total_episodes: i64,
    pub completed_episodes: i64,
    pub progress_text: String,
    pub rating: Option<f64>,
    pub genres: Vec<String>,
    pub poster_url: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EpisodeDetail {
    pub id: String,
    pub episode_number: i32,
    pub title: String,
    pub is_completed: bool,
    pub completed_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SeasonDetail {
    pub id: String,
    pub season_number: i32,
    pub title: String,
    pub episodes: Vec<EpisodeDetail>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SeriesFull {
    pub id: String,
    pub title: String,
    pub status: String,
    pub release_year: Option<i32>,
    pub total_seasons: i32,
    pub total_episodes: i64,
    pub completed_episodes: i64,
    pub progress_text: String,
    pub rating: Option<f64>,
    pub genres: Vec<String>,
    pub poster_url: Option<String>,
    pub notes: Option<String>,
    pub seasons: Vec<SeasonDetail>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SeasonConfigInput {
    pub season_number: i32,
    pub episode_count: i32,
    pub episode_titles: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateSeriesInput {
    pub title: String,
    pub release_year: Option<i32>,
    pub status: Option<String>,
    pub genres: Option<Vec<String>>,
    pub poster_url: Option<String>,
    pub notes: Option<String>,
    pub seasons: Vec<SeasonConfigInput>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateSeriesInput {
    pub id: String,
    pub title: String,
    pub release_year: Option<i32>,
    pub status: String,
    pub rating: Option<f64>,
    pub notes: Option<String>,
    pub poster_url: Option<String>,
    pub genres: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ToggleEpisodeResult {
    pub is_completed: bool,
    pub series_completed: bool,
    pub total_episodes: i64,
    pub completed_episodes: i64,
}

// =============================================================
// Entertainment Archive Models
// =============================================================
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ArchiveItem {
    pub id: String,
    #[serde(rename = "type")]
    pub item_type: String,
    pub title: String,
    pub release_year: Option<i32>,
    pub rating: Option<f64>,
    pub genres: Vec<String>,
    pub date_completed: String,
    pub is_historical: bool,
}

// =============================================================
// Plan Models
// =============================================================
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PlanItem {
    pub id: String,
    pub period_type: String,
    pub period_identifier: String,
    pub category: String,
    pub custom_category_name: Option<String>,
    pub title: String,
    pub description: Option<String>,
    pub priority_order: i32,
    pub is_completed: bool,
    pub completed_at: Option<String>,
    pub linked_task_id: Option<String>,
    pub linked_movie_id: Option<String>,
    pub linked_series_id: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

// =============================================================
// Activity History Models
// =============================================================
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ActivityHistoryItem {
    pub id: String,
    pub activity_type: String,
    pub entity_type: String,
    pub entity_id: String,
    pub title: String,
    pub metadata_json: Option<String>,
    pub timestamp: String,
}

// =============================================================
// Statistics Models
// =============================================================
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CategoryStat {
    pub category: String,
    pub color: String,
    pub count: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DayOfWeekStat {
    pub day: String,
    pub completions: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MonthlyTrendStat {
    pub month: String,
    pub tasks: i64,
    pub media: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StatisticsData {
    pub total_tasks_completed: i64,
    pub tasks_completion_rate: f64,
    pub current_streak_days: i32,
    pub longest_streak_days: i32,
    pub total_movies_completed: i64,
    pub total_episodes_completed: i64,
    pub total_watch_time_hours: f64,
    pub completions_by_category: Vec<CategoryStat>,
    pub completions_by_day_of_week: Vec<DayOfWeekStat>,
    pub monthly_trend: Vec<MonthlyTrendStat>,
}
