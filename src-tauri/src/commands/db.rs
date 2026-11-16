use crate::db::models::{DbStatusResponse, TableStat};
use crate::state::AppState;
use std::time::Instant;
use tauri::State;

#[tauri::command]
pub fn get_db_status(state: State<'_, AppState>) -> Result<DbStatusResponse, String> {
    let start = Instant::now();
    let conn = state
        .db
        .lock()
        .map_err(|e| format!("Failed to acquire database lock: {}", e))?;

    // Verify journal mode
    let mut stmt = conn
        .prepare("PRAGMA journal_mode")
        .map_err(|e| format!("Query error: {}", e))?;
    let journal_mode: String = stmt
        .query_row([], |row| row.get(0))
        .unwrap_or_else(|_| "unknown".to_string());

    // Verify foreign keys
    let mut fk_stmt = conn
        .prepare("PRAGMA foreign_keys")
        .map_err(|e| format!("Query error: {}", e))?;
    let fk_val: i32 = fk_stmt.query_row([], |row| row.get(0)).unwrap_or(0);

    // Get current migration version
    let mut mig_stmt = conn
        .prepare("SELECT COALESCE(MAX(version), 0) FROM schema_migrations")
        .map_err(|e| format!("Query error: {}", e))?;
    let migration_version: i32 = mig_stmt.query_row([], |row| row.get(0)).unwrap_or(0);

    // Collect table row counts
    let table_names = vec![
        "schema_migrations",
        "app_settings",
        "genres",
        "task_categories",
        "tasks",
        "subtasks",
        "daily_goals",
        "movies",
        "movie_genres",
        "series",
        "series_genres",
        "seasons",
        "episodes",
        "plan_items",
        "activity_history",
    ];

    let mut table_stats = Vec::new();
    for name in &table_names {
        let count_query = format!("SELECT COUNT(*) FROM {}", name);
        if let Ok(mut count_stmt) = conn.prepare(&count_query) {
            let count: i64 = count_stmt.query_row([], |r| r.get(0)).unwrap_or(0);
            table_stats.push(TableStat {
                name: name.to_string(),
                count,
            });
        }
    }

    let elapsed = start.elapsed().as_millis() as u64;

    Ok(DbStatusResponse {
        connected: true,
        path: state.db_path.to_string_lossy().to_string(),
        journal_mode,
        foreign_keys_enabled: fk_val == 1,
        migration_version,
        tables_count: table_stats.len(),
        table_stats,
        ping_ms: elapsed,
    })
}

#[tauri::command]
pub fn ping_db(state: State<'_, AppState>) -> Result<u64, String> {
    let start = Instant::now();
    let conn = state
        .db
        .lock()
        .map_err(|e| format!("Database lock error: {}", e))?;

    let mut stmt = conn
        .prepare("SELECT 1")
        .map_err(|e| format!("Query error: {}", e))?;
    let val: i32 = stmt
        .query_row([], |r| r.get(0))
        .map_err(|e| format!("Ping error: {}", e))?;

    if val == 1 {
        Ok(start.elapsed().as_millis() as u64)
    } else {
        Err("Unexpected ping response".to_string())
    }
}
