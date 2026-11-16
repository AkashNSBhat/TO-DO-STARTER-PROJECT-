use serde::{Deserialize, Serialize};

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

// Core Entity Models for Daymark
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

#[derive(Debug, Clone, Serialize, Deserialize)]
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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActivityHistoryItem {
    pub id: String,
    pub activity_type: String,
    pub entity_type: String,
    pub entity_id: String,
    pub title: String,
    pub metadata_json: Option<String>,
    pub timestamp: String,
}
