pub mod migrations;
pub mod models;
pub mod schema;

use rusqlite::Connection;
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

pub fn resolve_db_path(app_handle: &AppHandle) -> Result<PathBuf, String> {
    let app_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to resolve AppData directory: {}", e))?;

    // Ensure the folder exists
    if !app_dir.exists() {
        fs::create_dir_all(&app_dir)
            .map_err(|e| format!("Failed to create AppData directory at {:?}: {}", app_dir, e))?;
    }

    Ok(app_dir.join("daymark.db"))
}

pub fn configure_connection(conn: &mut Connection) -> Result<(), String> {
    conn.execute_batch(
        r#"
        PRAGMA journal_mode = WAL;
        PRAGMA foreign_keys = ON;
        PRAGMA synchronous = NORMAL;
        PRAGMA busy_timeout = 5000;
        "#,
    )
    .map_err(|e| format!("Failed to set SQLite pragmas: {}", e))?;

    migrations::run_migrations(conn)
        .map_err(|e| format!("Failed to run database migrations: {}", e))?;

    Ok(())
}

pub fn init_database(app_handle: &AppHandle) -> Result<(Connection, PathBuf), String> {
    let db_path = resolve_db_path(app_handle)?;
    println!("[DB] Initializing SQLite database at {:?}", db_path);

    let mut conn = Connection::open(&db_path)
        .map_err(|e| format!("Failed to open SQLite database at {:?}: {}", db_path, e))?;

    configure_connection(&mut conn)?;

    println!("[DB] Database initialized and migrations successfully verified.");
    Ok((conn, db_path))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_in_memory_database_schema_and_migrations() {
        let mut conn = Connection::open_in_memory().expect("Failed to open in-memory DB");
        configure_connection(&mut conn).expect("Failed to configure connection");

        // Verify journal mode (memory DB defaults to memory, but pragmas executed cleanly)
        let fk: i32 = conn
            .query_row("PRAGMA foreign_keys", [], |r| r.get(0))
            .expect("Failed to query foreign_keys");
        assert_eq!(fk, 1, "Foreign keys should be enabled");

        // Verify migrations
        let mig_version: i32 = conn
            .query_row("SELECT MAX(version) FROM schema_migrations", [], |r| r.get(0))
            .expect("Failed to query migration version");
        assert_eq!(mig_version, 2, "Migration version should be 2");

        // Verify seeded task categories
        let cat_count: i64 = conn
            .query_row("SELECT COUNT(*) FROM task_categories", [], |r| r.get(0))
            .expect("Failed to query task_categories count");
        assert_eq!(cat_count, 5, "There should be 5 seeded categories");

        // Verify seeded genres
        let genre_count: i64 = conn
            .query_row("SELECT COUNT(*) FROM genres", [], |r| r.get(0))
            .expect("Failed to query genres count");
        assert_eq!(genre_count, 15, "There should be 15 seeded genres");

        // Verify relational task & subtask insertion and foreign key cascade
        conn.execute(
            "INSERT INTO tasks (id, title, priority, status) VALUES (?1, ?2, ?3, ?4)",
            rusqlite::params!["task-test-1", "Master Test Task", "high", "todo"],
        )
        .expect("Failed to insert task");

        conn.execute(
            "INSERT INTO subtasks (id, task_id, title) VALUES (?1, ?2, ?3)",
            rusqlite::params!["sub-1", "task-test-1", "Subtask A"],
        )
        .expect("Failed to insert subtask");

        let sub_count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM subtasks WHERE task_id = 'task-test-1'",
                [],
                |r| r.get(0),
            )
            .expect("Failed to count subtasks");
        assert_eq!(sub_count, 1);

        // Delete parent task -> cascade deletes subtask
        conn.execute("DELETE FROM tasks WHERE id = 'task-test-1'", [])
            .expect("Failed to delete task");

        let sub_after_delete: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM subtasks WHERE task_id = 'task-test-1'",
                [],
                |r| r.get(0),
            )
            .expect("Failed to count subtasks after cascade");
        assert_eq!(sub_after_delete, 0, "Subtask should be deleted via ON DELETE CASCADE");
    }

    #[test]
    fn test_series_seasons_episodes_hierarchy() {
        let mut conn = Connection::open_in_memory().expect("Failed to open DB");
        configure_connection(&mut conn).expect("Failed to configure DB");

        conn.execute(
            "INSERT INTO series (id, title, total_seasons, status) VALUES (?1, ?2, ?3, ?4)",
            rusqlite::params!["series-1", "Breaking Bad", 5, "completed"],
        )
        .expect("Insert series");

        conn.execute(
            "INSERT INTO seasons (id, series_id, season_number, total_episodes) VALUES (?1, ?2, ?3, ?4)",
            rusqlite::params!["season-1", "series-1", 1, 7],
        )
        .expect("Insert season");

        conn.execute(
            "INSERT INTO episodes (id, season_id, series_id, episode_number, title) VALUES (?1, ?2, ?3, ?4, ?5)",
            rusqlite::params!["ep-1", "season-1", "series-1", 1, "Pilot"],
        )
        .expect("Insert episode");

        let ep_title: String = conn
            .query_row(
                "SELECT title FROM episodes WHERE id = 'ep-1'",
                [],
                |r| r.get(0),
            )
            .expect("Query ep");
        assert_eq!(ep_title, "Pilot");
    }
}
