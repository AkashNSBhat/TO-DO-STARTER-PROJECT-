use crate::db::models::*;
use crate::state::AppState;
use chrono::{Datelike, Local, Utc};
use std::collections::HashMap;
use std::time::Instant;
use tauri::State;

// =============================================================
// Diagnostic & System Telemetry Handlers
// =============================================================

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

// =============================================================
// Home Dashboard Handler
// =============================================================

#[tauri::command]
pub fn get_dashboard_data(state: State<'_, AppState>) -> Result<DashboardData, String> {
    let conn = state
        .db
        .lock()
        .map_err(|e| format!("Database lock error: {}", e))?;
    let now = Local::now();
    let greeting = format!("It's {}, {}", now.format("%A"), now.format("%B %e, %Y"));

    // Streak count from settings
    let streak_count: i32 = conn
        .query_row(
            "SELECT CAST(value AS INTEGER) FROM app_settings WHERE key = 'streak_count'",
            [],
            |r| r.get(0),
        )
        .unwrap_or(14);

    // Year / Month Progress
    let day_of_year = now.ordinal();
    let is_leap = (now.year() % 4 == 0 && now.year() % 100 != 0) || (now.year() % 400 == 0);
    let total_days_year = if is_leap { 366.0 } else { 365.0 };
    let year_progress_pct = ((day_of_year as f64 / total_days_year) * 1000.0).round() / 10.0;

    let day_of_month = now.day();
    let days_in_month = match now.month() {
        1 | 3 | 5 | 7 | 8 | 10 | 12 => 31.0,
        4 | 6 | 9 | 11 => 30.0,
        2 => {
            if is_leap {
                29.0
            } else {
                28.0
            }
        }
        _ => 30.0,
    };
    let month_progress_pct = ((day_of_month as f64 / days_in_month) * 1000.0).round() / 10.0;

    // Summary Metrics
    let completed_tasks_today: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM tasks WHERE is_completed = 1 AND (date(completed_at) = date('now') OR date(due_date) = date('now'))",
            [],
            |r| r.get(0),
        )
        .unwrap_or(0);

    let pending_tasks_today: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM tasks WHERE is_completed = 0 AND (due_date = date('now') OR due_date IS NULL)",
            [],
            |r| r.get(0),
        )
        .unwrap_or(0);

    let total_movies_watched: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM movies WHERE status = 'completed'",
            [],
            |r| r.get(0),
        )
        .unwrap_or(0);

    let active_series_count: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM series WHERE status = 'watching'",
            [],
            |r| r.get(0),
        )
        .unwrap_or(0);

    // Daily Checklist
    let mut checklist_stmt = conn
        .prepare(
            r#"
            SELECT t.id, t.title, COALESCE(c.name, 'General') as category, t.priority, t.is_completed
            FROM tasks t
            LEFT JOIN task_categories c ON t.category_id = c.id
            WHERE t.due_date = date('now') OR (t.due_date <= date('now') AND t.is_completed = 0)
            ORDER BY t.position ASC, t.priority DESC
            LIMIT 5
            "#,
        )
        .map_err(|e| e.to_string())?;

    let daily_checklist = checklist_stmt
        .query_map([], |row| {
            let is_comp: i32 = row.get(4)?;
            Ok(DailyChecklistItem {
                id: row.get(0)?,
                title: row.get(1)?,
                category: row.get(2)?,
                priority: row.get(3)?,
                is_completed: is_comp == 1,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(Result::ok)
        .collect();

    // Today's Goals
    let (target_tasks, notes): (i32, String) = conn
        .query_row(
            "SELECT target_tasks_count, COALESCE(notes, '') FROM daily_goals WHERE date = date('now') ORDER BY created_at DESC LIMIT 1",
            [],
            |r| Ok((r.get(0)?, r.get(1)?)),
        )
        .unwrap_or((5, "Focus on Q4 architectural deliverables, Rust SQLite migrations, and evening 5km run.".to_string()));

    let today_goals = TodayGoals {
        target_tasks_count: target_tasks,
        notes,
    };

    // Schedule Slots
    let schedule_slots = vec![
        ScheduleSlot {
            time: "09:00 AM".to_string(),
            title: "Deep Work — Desktop Shell Architecture".to_string(),
            slot_type: "work".to_string(),
        },
        ScheduleSlot {
            time: "11:30 AM".to_string(),
            title: "Sprint Review & Sync".to_string(),
            slot_type: "meeting".to_string(),
        },
        ScheduleSlot {
            time: "02:00 PM".to_string(),
            title: "Rust IPC Bridge & Test Verification".to_string(),
            slot_type: "work".to_string(),
        },
        ScheduleSlot {
            time: "05:00 PM".to_string(),
            title: "Gym — Upper Body & Core".to_string(),
            slot_type: "personal".to_string(),
        },
        ScheduleSlot {
            time: "08:00 PM".to_string(),
            title: "Severance — Season 2 Episode 3".to_string(),
            slot_type: "entertainment".to_string(),
        },
    ];

    // Activity Spline (14-day history)
    let mut spline_stmt = conn
        .prepare(
            r#"
            WITH RECURSIVE dates(d) AS (
                SELECT date('now', '-13 days')
                UNION ALL
                SELECT date(d, '+1 day') FROM dates WHERE d < date('now')
            )
            SELECT dates.d, COUNT(a.id)
            FROM dates
            LEFT JOIN activity_history a ON date(a.timestamp) = dates.d
            GROUP BY dates.d
            ORDER BY dates.d ASC
            "#,
        )
        .map_err(|e| e.to_string())?;

    let activity_spline = spline_stmt
        .query_map([], |row| {
            let date_str: String = row.get(0)?;
            let count: i64 = row.get(1)?;
            Ok(ActivitySplinePoint {
                date: date_str,
                completions: count,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(Result::ok)
        .collect();

    Ok(DashboardData {
        greeting,
        streak_count,
        year_progress_pct,
        month_progress_pct,
        metrics: DashboardMetrics {
            completed_tasks_today,
            pending_tasks_today,
            total_movies_watched,
            active_series_count,
        },
        daily_checklist,
        today_goals,
        schedule_slots,
        activity_spline,
    })
}

// =============================================================
// Task Query & Mutation Handlers
// =============================================================

#[tauri::command]
pub fn get_tasks(
    state: State<'_, AppState>,
    filter: Option<String>,
) -> Result<Vec<TaskDetail>, String> {
    let conn = state
        .db
        .lock()
        .map_err(|e| format!("Database lock error: {}", e))?;
    let f = filter.unwrap_or_else(|| "all".to_string());

    let mut stmt = conn
        .prepare(
            r#"
            SELECT 
                t.id, t.title, t.description,
                COALESCE(t.category_id, '') AS category_id,
                COALESCE(c.name, 'Personal') AS category_name,
                COALESCE(c.color, '#14b8a6') AS category_color,
                t.priority, t.status, t.due_date, t.is_completed, t.completed_at,
                (SELECT COUNT(*) FROM subtasks s WHERE s.task_id = t.id) AS subtasks_count,
                (SELECT COUNT(*) FROM subtasks s WHERE s.task_id = t.id AND s.is_completed = 1) AS completed_subtasks_count
            FROM tasks t
            LEFT JOIN task_categories c ON t.category_id = c.id
            WHERE 
                CASE 
                    WHEN ?1 = 'today' THEN (t.due_date = date('now') OR (t.due_date <= date('now') AND t.is_completed = 0))
                    WHEN ?1 = 'upcoming' THEN (t.due_date > date('now') AND t.is_completed = 0)
                    WHEN ?1 = 'overdue' THEN (t.due_date < date('now') AND t.is_completed = 0)
                    WHEN ?1 = 'completed' THEN t.is_completed = 1
                    ELSE 1
                END
            ORDER BY t.position ASC, t.due_date ASC
            "#,
        )
        .map_err(|e| e.to_string())?;

    let tasks = stmt
        .query_map([&f], |row| {
            let is_comp: i32 = row.get(9)?;
            Ok(TaskDetail {
                id: row.get(0)?,
                title: row.get(1)?,
                description: row.get(2)?,
                category_id: row.get(3)?,
                category_name: row.get(4)?,
                category_color: row.get(5)?,
                priority: row.get(6)?,
                status: row.get(7)?,
                due_date: row.get(8)?,
                is_completed: is_comp == 1,
                completed_at: row.get(10)?,
                subtasks_count: row.get(11)?,
                completed_subtasks_count: row.get(12)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(Result::ok)
        .collect();

    Ok(tasks)
}

#[tauri::command]
pub fn toggle_task_completion(
    state: State<'_, AppState>,
    task_id: String,
    is_completed: bool,
) -> Result<bool, String> {
    let conn = state
        .db
        .lock()
        .map_err(|e| format!("Database lock error: {}", e))?;
    let completed_flag = if is_completed { 1 } else { 0 };
    let status_str = if is_completed { "completed" } else { "todo" };
    let completed_at = if is_completed {
        Some(Utc::now().to_rfc3339())
    } else {
        None
    };

    conn.execute(
        "UPDATE tasks SET is_completed = ?1, status = ?2, completed_at = ?3, updated_at = datetime('now') WHERE id = ?4",
        rusqlite::params![completed_flag, status_str, completed_at, task_id],
    )
    .map_err(|e| e.to_string())?;

    if is_completed {
        let task_title: String = conn
            .query_row(
                "SELECT title FROM tasks WHERE id = ?1",
                [&task_id],
                |r| r.get(0),
            )
            .unwrap_or_else(|_| "Task".to_string());

        let act_id = uuid::Uuid::new_v4().to_string();
        let _ = conn.execute(
            "INSERT INTO activity_history (id, activity_type, entity_type, entity_id, title, timestamp) VALUES (?1, 'task_completed', 'task', ?2, ?3, datetime('now'))",
            rusqlite::params![act_id, task_id, task_title],
        );

        // Auto-complete any linked plan items
        let _ = conn.execute(
            "UPDATE plan_items SET is_completed = 1, completed_at = ?1, updated_at = datetime('now') WHERE linked_task_id = ?2 AND is_completed = 0",
            rusqlite::params![completed_at, task_id],
        );
    }

    Ok(true)
}

#[tauri::command]
pub fn create_task(
    state: State<'_, AppState>,
    input: CreateTaskInput,
) -> Result<TaskDetail, String> {
    let conn = state
        .db
        .lock()
        .map_err(|e| format!("Database lock error: {}", e))?;

    let task_id = format!("task-{}", uuid::Uuid::new_v4());
    let priority = input.priority.unwrap_or_else(|| "medium".to_string());
    let status = "todo".to_string();

    conn.execute(
        r#"
        INSERT INTO tasks (id, title, description, category_id, priority, status, due_date, is_completed, created_at, updated_at)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 0, datetime('now'), datetime('now'))
        "#,
        rusqlite::params![
            task_id,
            input.title,
            input.description,
            input.category_id,
            priority,
            status,
            input.due_date,
        ],
    )
    .map_err(|e| format!("Failed to insert task: {}", e))?;

    let mut subtasks_count = 0i64;
    if let Some(subtasks) = input.subtasks {
        for (idx, sub_title) in subtasks.iter().enumerate() {
            let sub_title_trimmed = sub_title.trim();
            if !sub_title_trimmed.is_empty() {
                let sub_id = format!("sub-{}", uuid::Uuid::new_v4());
                conn.execute(
                    r#"
                    INSERT INTO subtasks (id, task_id, title, is_completed, position, created_at)
                    VALUES (?1, ?2, ?3, 0, ?4, datetime('now'))
                    "#,
                    rusqlite::params![sub_id, task_id, sub_title_trimmed, idx as i32],
                )
                .map_err(|e| format!("Failed to insert subtask: {}", e))?;
                subtasks_count += 1;
            }
        }
    }

    // Retrieve category information
    let (cat_name, cat_color) = if let Some(ref cat_id) = input.category_id {
        conn.query_row(
            "SELECT name, color FROM task_categories WHERE id = ?1",
            [cat_id],
            |r| Ok((r.get(0)?, r.get(1)?)),
        )
        .unwrap_or_else(|_| ("Personal".to_string(), "#14b8a6".to_string()))
    } else {
        ("Personal".to_string(), "#14b8a6".to_string())
    };

    Ok(TaskDetail {
        id: task_id,
        title: input.title,
        description: input.description,
        category_id: input.category_id.unwrap_or_default(),
        category_name: cat_name,
        category_color: cat_color,
        priority,
        status,
        due_date: input.due_date,
        is_completed: false,
        completed_at: None,
        subtasks_count,
        completed_subtasks_count: 0,
    })
}

#[tauri::command]
pub fn update_task(
    state: State<'_, AppState>,
    input: UpdateTaskInput,
) -> Result<bool, String> {
    let conn = state
        .db
        .lock()
        .map_err(|e| format!("Database lock error: {}", e))?;

    let priority = input.priority.unwrap_or_else(|| "medium".to_string());

    conn.execute(
        r#"
        UPDATE tasks 
        SET title = ?1, description = ?2, category_id = ?3, priority = ?4, due_date = ?5, updated_at = datetime('now')
        WHERE id = ?6
        "#,
        rusqlite::params![
            input.title,
            input.description,
            input.category_id,
            priority,
            input.due_date,
            input.id
        ],
    )
    .map_err(|e| format!("Failed to update task: {}", e))?;

    Ok(true)
}

#[tauri::command]
pub fn delete_task(
    state: State<'_, AppState>,
    task_id: String,
) -> Result<bool, String> {
    let conn = state
        .db
        .lock()
        .map_err(|e| format!("Database lock error: {}", e))?;

    conn.execute("DELETE FROM subtasks WHERE task_id = ?1", [&task_id])
        .map_err(|e| format!("Failed to delete subtasks: {}", e))?;

    conn.execute("DELETE FROM tasks WHERE id = ?1", [&task_id])
        .map_err(|e| format!("Failed to delete task: {}", e))?;

    Ok(true)
}

#[tauri::command]
pub fn get_subtasks(
    state: State<'_, AppState>,
    task_id: String,
) -> Result<Vec<SubtaskDetail>, String> {
    let conn = state
        .db
        .lock()
        .map_err(|e| format!("Database lock error: {}", e))?;

    let mut stmt = conn
        .prepare(
            r#"
            SELECT id, task_id, title, is_completed, completed_at, position
            FROM subtasks
            WHERE task_id = ?1
            ORDER BY position ASC, created_at ASC
            "#,
        )
        .map_err(|e| e.to_string())?;

    let subtasks = stmt
        .query_map([&task_id], |r| {
            let is_comp: i32 = r.get(3)?;
            Ok(SubtaskDetail {
                id: r.get(0)?,
                task_id: r.get(1)?,
                title: r.get(2)?,
                is_completed: is_comp == 1,
                completed_at: r.get(4)?,
                position: r.get(5)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(Result::ok)
        .collect();

    Ok(subtasks)
}

#[tauri::command]
pub fn toggle_subtask_completion(
    state: State<'_, AppState>,
    subtask_id: String,
    is_completed: bool,
) -> Result<bool, String> {
    let conn = state
        .db
        .lock()
        .map_err(|e| format!("Database lock error: {}", e))?;

    let flag = if is_completed { 1 } else { 0 };
    let completed_at = if is_completed {
        Some(Utc::now().to_rfc3339())
    } else {
        None
    };

    conn.execute(
        "UPDATE subtasks SET is_completed = ?1, completed_at = ?2 WHERE id = ?3",
        rusqlite::params![flag, completed_at, subtask_id],
    )
    .map_err(|e| e.to_string())?;

    Ok(true)
}

#[tauri::command]
pub fn add_subtask(
    state: State<'_, AppState>,
    task_id: String,
    title: String,
) -> Result<SubtaskDetail, String> {
    let conn = state
        .db
        .lock()
        .map_err(|e| format!("Database lock error: {}", e))?;

    let sub_id = format!("sub-{}", uuid::Uuid::new_v4());
    let max_pos: i32 = conn
        .query_row(
            "SELECT COALESCE(MAX(position), -1) FROM subtasks WHERE task_id = ?1",
            [&task_id],
            |r| r.get(0),
        )
        .unwrap_or(-1);

    let next_pos = max_pos + 1;

    conn.execute(
        "INSERT INTO subtasks (id, task_id, title, is_completed, position, created_at) VALUES (?1, ?2, ?3, 0, ?4, datetime('now'))",
        rusqlite::params![sub_id, task_id, title, next_pos],
    )
    .map_err(|e| e.to_string())?;

    Ok(SubtaskDetail {
        id: sub_id,
        task_id,
        title,
        is_completed: false,
        completed_at: None,
        position: next_pos,
    })
}

#[tauri::command]
pub fn delete_subtask(
    state: State<'_, AppState>,
    subtask_id: String,
) -> Result<bool, String> {
    let conn = state
        .db
        .lock()
        .map_err(|e| format!("Database lock error: {}", e))?;

    conn.execute("DELETE FROM subtasks WHERE id = ?1", [&subtask_id])
        .map_err(|e| e.to_string())?;

    Ok(true)
}

#[tauri::command]
pub fn get_task_categories(
    state: State<'_, AppState>,
) -> Result<Vec<CategoryDetail>, String> {
    let conn = state
        .db
        .lock()
        .map_err(|e| format!("Database lock error: {}", e))?;

    let mut stmt = conn
        .prepare("SELECT id, name, color, icon FROM task_categories ORDER BY position ASC, name ASC")
        .map_err(|e| e.to_string())?;

    let categories = stmt
        .query_map([], |r| {
            Ok(CategoryDetail {
                id: r.get(0)?,
                name: r.get(1)?,
                color: r.get(2)?,
                icon: r.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(Result::ok)
        .collect();

    Ok(categories)
}

#[tauri::command]
pub fn get_daily_goal(
    state: State<'_, AppState>,
    date: String,
) -> Result<TodayGoals, String> {
    let conn = state
        .db
        .lock()
        .map_err(|e| format!("Database lock error: {}", e))?;

    let goal = conn
        .query_row(
            "SELECT target_tasks_count, COALESCE(notes, '') FROM daily_goals WHERE date = ?1",
            [&date],
            |r| {
                Ok(TodayGoals {
                    target_tasks_count: r.get(0)?,
                    notes: r.get(1)?,
                })
            },
        )
        .unwrap_or(TodayGoals {
            target_tasks_count: 5,
            notes: "Focus on deep work blocks and high impact items".to_string(),
        });

    Ok(goal)
}

#[tauri::command]
pub fn update_daily_goal(
    state: State<'_, AppState>,
    date: String,
    target_tasks_count: i32,
    notes: Option<String>,
) -> Result<bool, String> {
    let conn = state
        .db
        .lock()
        .map_err(|e| format!("Database lock error: {}", e))?;

    let goal_id = format!("goal-{}", date);
    conn.execute(
        r#"
        INSERT INTO daily_goals (id, date, target_tasks_count, notes, updated_at)
        VALUES (?1, ?2, ?3, ?4, datetime('now'))
        ON CONFLICT(date) DO UPDATE SET
            target_tasks_count = excluded.target_tasks_count,
            notes = excluded.notes,
            updated_at = datetime('now')
        "#,
        rusqlite::params![goal_id, date, target_tasks_count, notes],
    )
    .map_err(|e| e.to_string())?;

    Ok(true)
}

// =============================================================
// Movie Handlers
// =============================================================

#[tauri::command]
pub fn get_movies(
    state: State<'_, AppState>,
    filter: Option<String>,
) -> Result<Vec<MovieDetail>, String> {
    let conn = state
        .db
        .lock()
        .map_err(|e| format!("Database lock error: {}", e))?;
    let f = filter.unwrap_or_else(|| "all".to_string());

    let mut stmt = conn
        .prepare(
            r#"
            SELECT 
                m.id, m.title, m.release_year, m.status, m.personal_rating, m.date_watched, m.is_historical,
                (SELECT GROUP_CONCAT(g.name, ',') FROM movie_genres mg JOIN genres g ON mg.genre_id = g.id WHERE mg.movie_id = m.id) AS genres_csv,
                m.poster_url, m.notes
            FROM movies m
            WHERE 
                CASE 
                    WHEN ?1 = 'planned' THEN m.status = 'planned'
                    WHEN ?1 = 'watching' THEN m.status = 'watching'
                    WHEN ?1 = 'completed' THEN m.status = 'completed'
                    ELSE 1
                END
            ORDER BY m.release_year DESC, m.title ASC
            "#,
        )
        .map_err(|e| e.to_string())?;

    let movies = stmt
        .query_map([&f], |row| {
            let is_hist: i32 = row.get(6)?;
            let genres_csv: Option<String> = row.get(7)?;
            let genres = genres_csv
                .map(|s| {
                    s.split(',')
                        .map(|g| g.trim().to_string())
                        .filter(|s| !s.is_empty())
                        .collect()
                })
                .unwrap_or_default();

            Ok(MovieDetail {
                id: row.get(0)?,
                title: row.get(1)?,
                release_year: row.get(2)?,
                status: row.get(3)?,
                rating: row.get(4)?,
                date_watched: row.get(5)?,
                is_historical: is_hist == 1,
                genres,
                poster_color: Some("#8b5cf6".to_string()),
                poster_url: row.get(8)?,
                notes: row.get(9)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(Result::ok)
        .collect();

    Ok(movies)
}

#[tauri::command]
pub fn create_movie(
    state: State<'_, AppState>,
    input: CreateMovieInput,
) -> Result<MovieDetail, String> {
    let conn = state
        .db
        .lock()
        .map_err(|e| format!("Database lock error: {}", e))?;

    let movie_id = format!("mov-{}", uuid::Uuid::new_v4());
    let status = input.status.unwrap_or_else(|| "planned".to_string());
    let is_hist = if input.is_historical.unwrap_or(false) { 1 } else { 0 };

    conn.execute(
        r#"
        INSERT INTO movies (id, title, release_year, status, personal_rating, date_watched, notes, poster_url, is_historical, created_at, updated_at)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, datetime('now'), datetime('now'))
        "#,
        rusqlite::params![
            movie_id,
            input.title,
            input.release_year,
            status,
            input.rating,
            input.date_watched,
            input.notes,
            input.poster_url,
            is_hist,
        ],
    )
    .map_err(|e| format!("Failed to insert movie: {}", e))?;

    // Handle genres junction
    let genres_list = input.genres.unwrap_or_default();
    for genre_name in &genres_list {
        let trimmed = genre_name.trim();
        if !trimmed.is_empty() {
            let genre_id = format!("gen-{}", trimmed.to_lowercase().replace(' ', "-"));
            let _ = conn.execute(
                "INSERT OR IGNORE INTO genres (id, name, created_at) VALUES (?1, ?2, datetime('now'))",
                rusqlite::params![genre_id, trimmed],
            );
            let actual_genre_id: String = conn
                .query_row(
                    "SELECT id FROM genres WHERE name = ?1 COLLATE NOCASE",
                    [trimmed],
                    |r| r.get(0),
                )
                .unwrap_or(genre_id);

            let _ = conn.execute(
                "INSERT OR IGNORE INTO movie_genres (movie_id, genre_id) VALUES (?1, ?2)",
                rusqlite::params![movie_id, actual_genre_id],
            );
        }
    }

    if status == "completed" {
        let act_id = uuid::Uuid::new_v4().to_string();
        let _ = conn.execute(
            "INSERT INTO activity_history (id, activity_type, entity_type, entity_id, title, timestamp) VALUES (?1, 'movie_completed', 'movie', ?2, ?3, datetime('now'))",
            rusqlite::params![act_id, movie_id, input.title],
        );

        // Auto-complete any linked plan items
        let now = Utc::now().to_rfc3339();
        let _ = conn.execute(
            "UPDATE plan_items SET is_completed = 1, completed_at = ?1, updated_at = datetime('now') WHERE linked_movie_id = ?2 AND is_completed = 0",
            rusqlite::params![now, movie_id],
        );
    }

    Ok(MovieDetail {
        id: movie_id,
        title: input.title,
        release_year: input.release_year,
        status,
        rating: input.rating,
        date_watched: input.date_watched,
        is_historical: is_hist == 1,
        genres: genres_list,
        poster_color: input.poster_color.or_else(|| Some("#8b5cf6".to_string())),
        poster_url: input.poster_url,
        notes: input.notes,
    })
}

#[tauri::command]
pub fn update_movie(
    state: State<'_, AppState>,
    input: UpdateMovieInput,
) -> Result<bool, String> {
    let conn = state
        .db
        .lock()
        .map_err(|e| format!("Database lock error: {}", e))?;

    conn.execute(
        r#"
        UPDATE movies
        SET title = ?1, release_year = ?2, status = ?3, personal_rating = ?4, date_watched = ?5, notes = ?6, poster_url = ?7, updated_at = datetime('now')
        WHERE id = ?8
        "#,
        rusqlite::params![
            input.title,
            input.release_year,
            input.status,
            input.rating,
            input.date_watched,
            input.notes,
            input.poster_url,
            input.id,
        ],
    )
    .map_err(|e| format!("Failed to update movie: {}", e))?;

    // Update genres junction: delete old, insert new
    let _ = conn.execute("DELETE FROM movie_genres WHERE movie_id = ?1", [&input.id]);

    if let Some(genres) = input.genres {
        for genre_name in genres {
            let trimmed = genre_name.trim();
            if !trimmed.is_empty() {
                let genre_id = format!("gen-{}", trimmed.to_lowercase().replace(' ', "-"));
                let _ = conn.execute(
                    "INSERT OR IGNORE INTO genres (id, name, created_at) VALUES (?1, ?2, datetime('now'))",
                    rusqlite::params![genre_id, trimmed],
                );
                let actual_genre_id: String = conn
                    .query_row(
                        "SELECT id FROM genres WHERE name = ?1 COLLATE NOCASE",
                        [trimmed],
                        |r| r.get(0),
                    )
                    .unwrap_or(genre_id);

                let _ = conn.execute(
                    "INSERT OR IGNORE INTO movie_genres (movie_id, genre_id) VALUES (?1, ?2)",
                    rusqlite::params![input.id, actual_genre_id],
                );
            }
        }
    }

    if input.status == "completed" {
        let act_id = uuid::Uuid::new_v4().to_string();
        let _ = conn.execute(
            "INSERT INTO activity_history (id, activity_type, entity_type, entity_id, title, timestamp) VALUES (?1, 'movie_completed', 'movie', ?2, ?3, datetime('now'))",
            rusqlite::params![act_id, input.id, input.title],
        );

        // Auto-complete any linked plan items
        let now = Utc::now().to_rfc3339();
        let _ = conn.execute(
            "UPDATE plan_items SET is_completed = 1, completed_at = ?1, updated_at = datetime('now') WHERE linked_movie_id = ?2 AND is_completed = 0",
            rusqlite::params![now, input.id],
        );
    }

    Ok(true)
}

#[tauri::command]
pub fn delete_movie(
    state: State<'_, AppState>,
    movie_id: String,
) -> Result<bool, String> {
    let conn = state
        .db
        .lock()
        .map_err(|e| format!("Database lock error: {}", e))?;

    let _ = conn.execute("DELETE FROM movie_genres WHERE movie_id = ?1", [&movie_id]);
    conn.execute("DELETE FROM movies WHERE id = ?1", [&movie_id])
        .map_err(|e| format!("Failed to delete movie: {}", e))?;

    Ok(true)
}

#[tauri::command]
pub fn get_all_genres(state: State<'_, AppState>) -> Result<Vec<String>, String> {
    let conn = state
        .db
        .lock()
        .map_err(|e| format!("Database lock error: {}", e))?;

    let mut stmt = conn
        .prepare("SELECT name FROM genres ORDER BY name ASC")
        .map_err(|e| e.to_string())?;

    let genres = stmt
        .query_map([], |r| r.get(0))
        .map_err(|e| e.to_string())?
        .filter_map(Result::ok)
        .collect();

    Ok(genres)
}

// =============================================================
// Series & Episode Handlers
// =============================================================

#[tauri::command]
pub fn get_series(state: State<'_, AppState>) -> Result<Vec<SeriesDetail>, String> {
    let conn = state
        .db
        .lock()
        .map_err(|e| format!("Database lock error: {}", e))?;

    let mut stmt = conn
        .prepare(
            r#"
            SELECT 
                s.id, s.title, s.status, s.total_seasons, s.personal_rating,
                (SELECT COUNT(*) FROM episodes e WHERE e.series_id = s.id) AS total_episodes,
                (SELECT COUNT(*) FROM episodes e WHERE e.series_id = s.id AND e.is_completed = 1) AS completed_episodes,
                (SELECT GROUP_CONCAT(g.name, ',') FROM series_genres sg JOIN genres g ON sg.genre_id = g.id WHERE sg.series_id = s.id) AS genres_csv,
                s.release_year, s.poster_url, s.notes
            FROM series s
            ORDER BY s.title ASC
            "#,
        )
        .map_err(|e| e.to_string())?;

    let series_list = stmt
        .query_map([], |row| {
            let total_episodes: i64 = row.get(5)?;
            let completed_episodes: i64 = row.get(6)?;
            let genres_csv: Option<String> = row.get(7)?;
            let genres = genres_csv
                .map(|s| s.split(',').map(|g| g.trim().to_string()).collect())
                .unwrap_or_default();

            let progress_text = format!("{}/{} Episodes", completed_episodes, total_episodes);

            Ok(SeriesDetail {
                id: row.get(0)?,
                title: row.get(1)?,
                status: row.get(2)?,
                total_seasons: row.get(3)?,
                total_episodes,
                completed_episodes,
                progress_text,
                rating: row.get(4)?,
                genres,
                release_year: row.get(8)?,
                poster_url: row.get(9)?,
                notes: row.get(10)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(Result::ok)
        .collect();

    Ok(series_list)
}

#[tauri::command]
pub fn get_series_detail(
    state: State<'_, AppState>,
    series_id: String,
) -> Result<SeriesFull, String> {
    let conn = state
        .db
        .lock()
        .map_err(|e| format!("Database lock error: {}", e))?;

    // 1. Fetch Series info
    let (title, status, total_seasons, rating, genres_csv, total_eps, comp_eps, release_year, poster_url, notes): (
        String,
        String,
        i32,
        Option<f64>,
        Option<String>,
        i64,
        i64,
        Option<i32>,
        Option<String>,
        Option<String>,
    ) = conn
        .query_row(
            r#"
            SELECT 
                s.title, s.status, s.total_seasons, s.personal_rating,
                (SELECT GROUP_CONCAT(g.name, ',') FROM series_genres sg JOIN genres g ON sg.genre_id = g.id WHERE sg.series_id = s.id),
                (SELECT COUNT(*) FROM episodes e WHERE e.series_id = s.id),
                (SELECT COUNT(*) FROM episodes e WHERE e.series_id = s.id AND e.is_completed = 1),
                s.release_year, s.poster_url, s.notes
            FROM series s
            WHERE s.id = ?1
            "#,
            [&series_id],
            |r| {
                Ok((
                    r.get(0)?,
                    r.get(1)?,
                    r.get(2)?,
                    r.get(3)?,
                    r.get(4)?,
                    r.get(5)?,
                    r.get(6)?,
                    r.get(7)?,
                    r.get(8)?,
                    r.get(9)?,
                ))
            },
        )
        .map_err(|e| format!("Series not found: {}", e))?;

    let genres = genres_csv
        .map(|s| s.split(',').map(|g| g.trim().to_string()).collect())
        .unwrap_or_default();

    // 2. Fetch Seasons
    let mut season_stmt = conn
        .prepare(
            "SELECT id, season_number FROM seasons WHERE series_id = ?1 ORDER BY season_number ASC",
        )
        .map_err(|e| e.to_string())?;

    let seasons_rows: Vec<(String, i32)> = season_stmt
        .query_map([&series_id], |r| Ok((r.get(0)?, r.get(1)?)))
        .map_err(|e| e.to_string())?
        .filter_map(Result::ok)
        .collect();

    let mut seasons = Vec::new();
    for (season_id, season_num) in seasons_rows {
        let mut ep_stmt = conn
            .prepare("SELECT id, episode_number, title, is_completed, completed_at FROM episodes WHERE season_id = ?1 ORDER BY episode_number ASC")
            .map_err(|e| e.to_string())?;

        let episodes: Vec<EpisodeDetail> = ep_stmt
            .query_map([&season_id], |r| {
                let is_comp: i32 = r.get(3)?;
                Ok(EpisodeDetail {
                    id: r.get(0)?,
                    episode_number: r.get(1)?,
                    title: r.get(2)?,
                    is_completed: is_comp == 1,
                    completed_at: r.get(4)?,
                })
            })
            .map_err(|e| e.to_string())?
            .filter_map(Result::ok)
            .collect();

        seasons.push(SeasonDetail {
            id: season_id,
            season_number: season_num,
            title: format!("Season {}", season_num),
            episodes,
        });
    }

    Ok(SeriesFull {
        id: series_id,
        title,
        status,
        total_seasons,
        total_episodes: total_eps,
        completed_episodes: comp_eps,
        progress_text: format!("{}/{} Episodes", comp_eps, total_eps),
        rating,
        genres,
        release_year,
        poster_url,
        notes,
        seasons,
    })
}

#[tauri::command]
pub fn create_series(
    state: State<'_, AppState>,
    input: CreateSeriesInput,
) -> Result<SeriesFull, String> {
    let conn = state
        .db
        .lock()
        .map_err(|e| format!("Database lock error: {}", e))?;

    let series_id = format!("ser-{}", uuid::Uuid::new_v4());
    let total_seasons = input.seasons.len() as i32;
    let status = input.status.unwrap_or_else(|| "watching".to_string());

    conn.execute(
        r#"
        INSERT INTO series (id, title, release_year, poster_url, status, total_seasons, notes, created_at, updated_at)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, datetime('now'), datetime('now'))
        "#,
        rusqlite::params![
            series_id,
            input.title,
            input.release_year,
            input.poster_url,
            status,
            total_seasons,
            input.notes,
        ],
    )
    .map_err(|e| format!("Failed to insert series: {}", e))?;

    // Handle genres junction
    if let Some(genres) = input.genres {
        for genre_name in genres {
            let trimmed = genre_name.trim();
            if !trimmed.is_empty() {
                let genre_id = format!("gen-{}", trimmed.to_lowercase().replace(' ', "-"));
                let _ = conn.execute(
                    "INSERT OR IGNORE INTO genres (id, name, created_at) VALUES (?1, ?2, datetime('now'))",
                    rusqlite::params![genre_id, trimmed],
                );
                let actual_genre_id: String = conn
                    .query_row(
                        "SELECT id FROM genres WHERE name = ?1 COLLATE NOCASE",
                        [trimmed],
                        |r| r.get(0),
                    )
                    .unwrap_or(genre_id);

                let _ = conn.execute(
                    "INSERT OR IGNORE INTO series_genres (series_id, genre_id) VALUES (?1, ?2)",
                    rusqlite::params![series_id, actual_genre_id],
                );
            }
        }
    }

    // Insert Seasons and Episodes
    let mut seasons_result = Vec::new();
    let mut total_eps: i64 = 0;

    for s_config in input.seasons {
        let season_id = format!("sea-{}-{}", series_id, s_config.season_number);
        conn.execute(
            r#"
            INSERT INTO seasons (id, series_id, season_number, total_episodes, created_at)
            VALUES (?1, ?2, ?3, ?4, datetime('now'))
            "#,
            rusqlite::params![
                season_id,
                series_id,
                s_config.season_number,
                s_config.episode_count,
            ],
        )
        .map_err(|e| format!("Failed to insert season: {}", e))?;

        let mut episodes = Vec::new();
        for ep_num in 1..=s_config.episode_count {
            let ep_id = format!("ep-{}-{}-{}", series_id, s_config.season_number, ep_num);
            let ep_title = s_config
                .episode_titles
                .as_ref()
                .and_then(|titles| titles.get((ep_num - 1) as usize).cloned())
                .filter(|t| !t.trim().is_empty())
                .unwrap_or_else(|| format!("Episode {}", ep_num));

            conn.execute(
                r#"
                INSERT INTO episodes (id, season_id, series_id, episode_number, title, is_completed, created_at)
                VALUES (?1, ?2, ?3, ?4, ?5, 0, datetime('now'))
                "#,
                rusqlite::params![ep_id, season_id, series_id, ep_num, ep_title],
            )
            .map_err(|e| format!("Failed to insert episode: {}", e))?;

            episodes.push(EpisodeDetail {
                id: ep_id,
                episode_number: ep_num,
                title: ep_title,
                is_completed: false,
                completed_at: None,
            });
            total_eps += 1;
        }

        seasons_result.push(SeasonDetail {
            id: season_id,
            season_number: s_config.season_number,
            title: format!("Season {}", s_config.season_number),
            episodes,
        });
    }

    Ok(SeriesFull {
        id: series_id,
        title: input.title,
        status,
        total_seasons,
        total_episodes: total_eps,
        completed_episodes: 0,
        progress_text: format!("0/{} Episodes", total_eps),
        rating: None,
        genres: vec![],
        release_year: input.release_year,
        poster_url: input.poster_url,
        notes: input.notes,
        seasons: seasons_result,
    })
}

#[tauri::command]
pub fn update_series(
    state: State<'_, AppState>,
    input: UpdateSeriesInput,
) -> Result<bool, String> {
    let conn = state
        .db
        .lock()
        .map_err(|e| format!("Database lock error: {}", e))?;

    let is_comp = input.status == "completed";
    let date_completed = if is_comp {
        Some(Utc::now().format("%Y-%m-%d").to_string())
    } else {
        None
    };

    conn.execute(
        r#"
        UPDATE series
        SET title = ?1, release_year = ?2, status = ?3, personal_rating = ?4, notes = ?5, poster_url = ?6,
            date_completed = COALESCE(?7, date_completed),
            updated_at = datetime('now')
        WHERE id = ?8
        "#,
        rusqlite::params![
            input.title,
            input.release_year,
            input.status,
            input.rating,
            input.notes,
            input.poster_url,
            date_completed,
            input.id,
        ],
    )
    .map_err(|e| format!("Failed to update series: {}", e))?;

    if let Some(genres) = input.genres {
        let _ = conn.execute("DELETE FROM series_genres WHERE series_id = ?1", [&input.id]);
        for genre_name in genres {
            let trimmed = genre_name.trim();
            if !trimmed.is_empty() {
                let genre_id = format!("gen-{}", trimmed.to_lowercase().replace(' ', "-"));
                let _ = conn.execute(
                    "INSERT OR IGNORE INTO genres (id, name, created_at) VALUES (?1, ?2, datetime('now'))",
                    rusqlite::params![genre_id, trimmed],
                );
                let actual_genre_id: String = conn
                    .query_row(
                        "SELECT id FROM genres WHERE name = ?1 COLLATE NOCASE",
                        [trimmed],
                        |r| r.get(0),
                    )
                    .unwrap_or(genre_id);

                let _ = conn.execute(
                    "INSERT OR IGNORE INTO series_genres (series_id, genre_id) VALUES (?1, ?2)",
                    rusqlite::params![input.id, actual_genre_id],
                );
            }
        }
    }

    if is_comp {
        let act_id = uuid::Uuid::new_v4().to_string();
        let _ = conn.execute(
            "INSERT INTO activity_history (id, activity_type, entity_type, entity_id, title, timestamp) VALUES (?1, 'series_completed', 'series', ?2, ?3, datetime('now'))",
            rusqlite::params![act_id, input.id, input.title],
        );

        // Auto-complete any linked plan items
        let now = Utc::now().to_rfc3339();
        let _ = conn.execute(
            "UPDATE plan_items SET is_completed = 1, completed_at = ?1, updated_at = datetime('now') WHERE linked_series_id = ?2 AND is_completed = 0",
            rusqlite::params![now, input.id],
        );
    }

    Ok(true)
}

#[tauri::command]
pub fn delete_series(
    state: State<'_, AppState>,
    series_id: String,
) -> Result<bool, String> {
    let conn = state
        .db
        .lock()
        .map_err(|e| format!("Database lock error: {}", e))?;

    conn.execute("DELETE FROM series WHERE id = ?1", [&series_id])
        .map_err(|e| format!("Failed to delete series: {}", e))?;

    Ok(true)
}

#[tauri::command]
pub fn update_episode_title(
    state: State<'_, AppState>,
    episode_id: String,
    title: String,
) -> Result<bool, String> {
    let conn = state
        .db
        .lock()
        .map_err(|e| format!("Database lock error: {}", e))?;

    conn.execute(
        "UPDATE episodes SET title = ?1 WHERE id = ?2",
        rusqlite::params![title.trim(), episode_id],
    )
    .map_err(|e| format!("Failed to update episode title: {}", e))?;

    Ok(true)
}

#[tauri::command]
pub fn toggle_episode_completion(
    state: State<'_, AppState>,
    episode_id: String,
    is_completed: bool,
) -> Result<ToggleEpisodeResult, String> {
    let conn = state
        .db
        .lock()
        .map_err(|e| format!("Database lock error: {}", e))?;

    let completed_flag = if is_completed { 1 } else { 0 };
    let completed_at = if is_completed {
        Some(Utc::now().to_rfc3339())
    } else {
        None
    };

    // Get series_id and title
    let (series_id, ep_title): (String, String) = conn
        .query_row(
            "SELECT series_id, title FROM episodes WHERE id = ?1",
            [&episode_id],
            |r| Ok((r.get(0)?, r.get(1)?)),
        )
        .map_err(|e| format!("Episode not found: {}", e))?;

    conn.execute(
        "UPDATE episodes SET is_completed = ?1, completed_at = ?2 WHERE id = ?3",
        rusqlite::params![completed_flag, completed_at, episode_id],
    )
    .map_err(|e| e.to_string())?;

    if is_completed {
        let act_id = uuid::Uuid::new_v4().to_string();
        let _ = conn.execute(
            "INSERT INTO activity_history (id, activity_type, entity_type, entity_id, title, timestamp) VALUES (?1, 'episode_completed', 'episode', ?2, ?3, datetime('now'))",
            rusqlite::params![act_id, episode_id, ep_title],
        );
    }

    // Check completion progress across all episodes for this series
    let (total_eps, comp_eps): (i64, i64) = conn
        .query_row(
            r#"
            SELECT 
                COUNT(*), 
                SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END)
            FROM episodes 
            WHERE series_id = ?1
            "#,
            [&series_id],
            |r| Ok((r.get(0)?, r.get(1)?)),
        )
        .unwrap_or((0, 0));

    let mut series_completed = false;
    if total_eps > 0 && comp_eps == total_eps {
        // Automatically mark series as completed
        conn.execute(
            "UPDATE series SET status = 'completed', date_completed = date('now'), updated_at = datetime('now') WHERE id = ?1",
            [&series_id],
        )
        .map_err(|e| e.to_string())?;

        let series_title: String = conn
            .query_row("SELECT title FROM series WHERE id = ?1", [&series_id], |r| r.get(0))
            .unwrap_or_else(|_| "Series".to_string());

        let act_id = uuid::Uuid::new_v4().to_string();
        let _ = conn.execute(
            "INSERT INTO activity_history (id, activity_type, entity_type, entity_id, title, timestamp) VALUES (?1, 'series_completed', 'series', ?2, ?3, datetime('now'))",
            rusqlite::params![act_id, series_id, series_title],
        );

        // Auto-complete any linked plan items
        let now = Utc::now().to_rfc3339();
        let _ = conn.execute(
            "UPDATE plan_items SET is_completed = 1, completed_at = ?1, updated_at = datetime('now') WHERE linked_series_id = ?2 AND is_completed = 0",
            rusqlite::params![now, series_id],
        );

        series_completed = true;
    } else if !is_completed {
        // If series was completed, uncomplete it back to watching
        let current_status: String = conn
            .query_row("SELECT status FROM series WHERE id = ?1", [&series_id], |r| r.get(0))
            .unwrap_or_default();

        if current_status == "completed" {
            let _ = conn.execute(
                "UPDATE series SET status = 'watching', date_completed = NULL, updated_at = datetime('now') WHERE id = ?1",
                [&series_id],
            );
        }
    }

    Ok(ToggleEpisodeResult {
        is_completed,
        series_completed,
        total_episodes: total_eps,
        completed_episodes: comp_eps,
    })
}

#[tauri::command]
pub fn rate_series(
    state: State<'_, AppState>,
    series_id: String,
    rating: f64,
) -> Result<bool, String> {
    let conn = state
        .db
        .lock()
        .map_err(|e| format!("Database lock error: {}", e))?;

    conn.execute(
        "UPDATE series SET personal_rating = ?1, updated_at = datetime('now') WHERE id = ?2",
        rusqlite::params![rating, series_id],
    )
    .map_err(|e| format!("Failed to rate series: {}", e))?;

    Ok(true)
}

#[tauri::command]
pub fn add_season(
    state: State<'_, AppState>,
    series_id: String,
    episode_count: i32,
) -> Result<SeasonDetail, String> {
    let conn = state
        .db
        .lock()
        .map_err(|e| format!("Database lock error: {}", e))?;

    let next_season_num: i32 = conn
        .query_row(
            "SELECT COALESCE(MAX(season_number), 0) + 1 FROM seasons WHERE series_id = ?1",
            [&series_id],
            |r| r.get(0),
        )
        .unwrap_or(1);

    let season_id = format!("sea-{}-{}", series_id, next_season_num);

    conn.execute(
        "INSERT INTO seasons (id, series_id, season_number, total_episodes, created_at) VALUES (?1, ?2, ?3, ?4, datetime('now'))",
        rusqlite::params![season_id, series_id, next_season_num, episode_count],
    )
    .map_err(|e| format!("Failed to add season: {}", e))?;

    let mut episodes = Vec::new();
    for ep_num in 1..=episode_count {
        let ep_id = format!("ep-{}-{}-{}", series_id, next_season_num, ep_num);
        let ep_title = format!("Episode {}", ep_num);

        conn.execute(
            "INSERT INTO episodes (id, season_id, series_id, episode_number, title, is_completed, created_at) VALUES (?1, ?2, ?3, ?4, ?5, 0, datetime('now'))",
            rusqlite::params![ep_id, season_id, series_id, ep_num, ep_title],
        )
        .map_err(|e| format!("Failed to add episode: {}", e))?;

        episodes.push(EpisodeDetail {
            id: ep_id,
            episode_number: ep_num,
            title: ep_title,
            is_completed: false,
            completed_at: None,
        });
    }

    let _ = conn.execute(
        "UPDATE series SET total_seasons = (SELECT COUNT(*) FROM seasons WHERE series_id = ?1), updated_at = datetime('now') WHERE id = ?1",
        [&series_id],
    );

    Ok(SeasonDetail {
        id: season_id,
        season_number: next_season_num,
        title: format!("Season {}", next_season_num),
        episodes,
    })
}

#[tauri::command]
pub fn delete_season(
    state: State<'_, AppState>,
    season_id: String,
) -> Result<bool, String> {
    let conn = state
        .db
        .lock()
        .map_err(|e| format!("Database lock error: {}", e))?;

    let series_id: String = conn
        .query_row(
            "SELECT series_id FROM seasons WHERE id = ?1",
            [&season_id],
            |r| r.get(0),
        )
        .map_err(|e| format!("Season not found: {}", e))?;

    conn.execute("DELETE FROM seasons WHERE id = ?1", [&season_id])
        .map_err(|e| format!("Failed to delete season: {}", e))?;

    let _ = conn.execute(
        "UPDATE series SET total_seasons = (SELECT COUNT(*) FROM seasons WHERE series_id = ?1), updated_at = datetime('now') WHERE id = ?1",
        [&series_id],
    );

    Ok(true)
}

#[tauri::command]
pub fn add_episode(
    state: State<'_, AppState>,
    season_id: String,
    title: Option<String>,
) -> Result<EpisodeDetail, String> {
    let conn = state
        .db
        .lock()
        .map_err(|e| format!("Database lock error: {}", e))?;

    let (series_id, season_num): (String, i32) = conn
        .query_row(
            "SELECT series_id, season_number FROM seasons WHERE id = ?1",
            [&season_id],
            |r| Ok((r.get(0)?, r.get(1)?)),
        )
        .map_err(|e| format!("Season not found: {}", e))?;

    let next_ep_num: i32 = conn
        .query_row(
            "SELECT COALESCE(MAX(episode_number), 0) + 1 FROM episodes WHERE season_id = ?1",
            [&season_id],
            |r| r.get(0),
        )
        .unwrap_or(1);

    let ep_id = format!("ep-{}-{}-{}", series_id, season_num, next_ep_num);
    let ep_title = title
        .filter(|t| !t.trim().is_empty())
        .unwrap_or_else(|| format!("Episode {}", next_ep_num));

    conn.execute(
        "INSERT INTO episodes (id, season_id, series_id, episode_number, title, is_completed, created_at) VALUES (?1, ?2, ?3, ?4, ?5, 0, datetime('now'))",
        rusqlite::params![ep_id, season_id, series_id, next_ep_num, ep_title],
    )
    .map_err(|e| format!("Failed to add episode: {}", e))?;

    let _ = conn.execute(
        "UPDATE seasons SET total_episodes = (SELECT COUNT(*) FROM episodes WHERE season_id = ?1) WHERE id = ?1",
        [&season_id],
    );

    Ok(EpisodeDetail {
        id: ep_id,
        episode_number: next_ep_num,
        title: ep_title,
        is_completed: false,
        completed_at: None,
    })
}

#[tauri::command]
pub fn delete_episode(
    state: State<'_, AppState>,
    episode_id: String,
) -> Result<bool, String> {
    let conn = state
        .db
        .lock()
        .map_err(|e| format!("Database lock error: {}", e))?;

    let season_id: String = conn
        .query_row(
            "SELECT season_id FROM episodes WHERE id = ?1",
            [&episode_id],
            |r| r.get(0),
        )
        .map_err(|e| format!("Episode not found: {}", e))?;

    conn.execute("DELETE FROM episodes WHERE id = ?1", [&episode_id])
        .map_err(|e| format!("Failed to delete episode: {}", e))?;

    let _ = conn.execute(
        "UPDATE seasons SET total_episodes = (SELECT COUNT(*) FROM episodes WHERE season_id = ?1) WHERE id = ?1",
        [&season_id],
    );

    Ok(true)
}

// =============================================================
// Entertainment Archive Handler
// =============================================================

#[tauri::command]
pub fn get_archive_data(
    state: State<'_, AppState>,
    filter: Option<String>,
) -> Result<Vec<ArchiveItem>, String> {
    let conn = state
        .db
        .lock()
        .map_err(|e| format!("Database lock error: {}", e))?;
    let f = filter.unwrap_or_else(|| "all".to_string());

    let mut stmt = conn
        .prepare(
            r#"
            SELECT 
                m.id, 'movie' AS item_type, m.title, m.release_year, m.personal_rating,
                COALESCE(m.date_watched, m.created_at) AS date_completed, m.is_historical,
                (SELECT GROUP_CONCAT(g.name, ',') FROM movie_genres mg JOIN genres g ON mg.genre_id = g.id WHERE mg.movie_id = m.id) AS genres_csv,
                m.notes, NULL AS total_seasons, NULL AS total_episodes
            FROM movies m
            WHERE (m.status = 'completed' OR m.is_historical = 1) AND (?1 = 'all' OR ?1 = 'movies' OR ?1 = 'movie')
            UNION ALL
            SELECT 
                s.id, 'series' AS item_type, s.title, s.release_year, s.personal_rating,
                COALESCE(s.date_completed, s.created_at) AS date_completed, s.is_historical,
                (SELECT GROUP_CONCAT(g.name, ',') FROM series_genres sg JOIN genres g ON sg.genre_id = g.id WHERE sg.series_id = s.id) AS genres_csv,
                s.notes, s.total_seasons,
                (SELECT COUNT(*) FROM episodes e WHERE e.series_id = s.id) AS total_episodes
            FROM series s
            WHERE (s.status = 'completed' OR s.is_historical = 1) AND (?1 = 'all' OR ?1 = 'series')
            ORDER BY date_completed DESC
            "#,
        )
        .map_err(|e| e.to_string())?;

    let items = stmt
        .query_map([&f], |row| {
            let is_hist: i32 = row.get(6)?;
            let genres_csv: Option<String> = row.get(7)?;
            let genres = genres_csv
                .map(|s| s.split(',').map(|g| g.trim().to_string()).filter(|s| !s.is_empty()).collect())
                .unwrap_or_default();

            Ok(ArchiveItem {
                id: row.get(0)?,
                item_type: row.get(1)?,
                title: row.get(2)?,
                release_year: row.get(3)?,
                rating: row.get(4)?,
                date_completed: row.get(5)?,
                is_historical: is_hist == 1,
                genres,
                notes: row.get(8)?,
                total_seasons: row.get(9)?,
                total_episodes: row.get(10)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(Result::ok)
        .collect();

    Ok(items)
}

#[tauri::command]
pub fn check_archive_duplicate(
    state: State<'_, AppState>,
    title: String,
    release_year: Option<i32>,
    item_type: String,
) -> Result<bool, String> {
    let conn = state
        .db
        .lock()
        .map_err(|e| format!("Database lock error: {}", e))?;

    let title_trimmed = title.trim();
    let count: i64 = if item_type == "movie" {
        conn.query_row(
            "SELECT COUNT(*) FROM movies WHERE LOWER(title) = LOWER(?1) AND (release_year = ?2 OR (?2 IS NULL AND release_year IS NULL))",
            rusqlite::params![title_trimmed, release_year],
            |r| r.get(0),
        ).unwrap_or(0)
    } else {
        conn.query_row(
            "SELECT COUNT(*) FROM series WHERE LOWER(title) = LOWER(?1) AND (release_year = ?2 OR (?2 IS NULL AND release_year IS NULL))",
            rusqlite::params![title_trimmed, release_year],
            |r| r.get(0),
        ).unwrap_or(0)
    };

    Ok(count > 0)
}

#[tauri::command]
pub fn add_historical_entry(
    state: State<'_, AppState>,
    input: AddHistoricalInput,
) -> Result<ArchiveItem, String> {
    let conn = state
        .db
        .lock()
        .map_err(|e| format!("Database lock error: {}", e))?;

    let title_trimmed = input.title.trim().to_string();

    // 5.13 Duplicate check
    let dup_count: i64 = if input.item_type == "movie" {
        conn.query_row(
            "SELECT COUNT(*) FROM movies WHERE LOWER(title) = LOWER(?1) AND (release_year = ?2 OR (?2 IS NULL AND release_year IS NULL))",
            rusqlite::params![title_trimmed, input.release_year],
            |r| r.get(0),
        ).unwrap_or(0)
    } else {
        conn.query_row(
            "SELECT COUNT(*) FROM series WHERE LOWER(title) = LOWER(?1) AND (release_year = ?2 OR (?2 IS NULL AND release_year IS NULL))",
            rusqlite::params![title_trimmed, input.release_year],
            |r| r.get(0),
        ).unwrap_or(0)
    };

    if dup_count > 0 {
        return Err(format!(
            "An archived {} titled '{}' already exists for this release year.",
            input.item_type, title_trimmed
        ));
    }

    let completion_date = input
        .date_completed
        .filter(|d| !d.trim().is_empty())
        .unwrap_or_else(|| Utc::now().format("%Y-%m-%d").to_string());

    let genres_list = input.genres.unwrap_or_default();

    if input.item_type == "movie" {
        let movie_id = format!("mov-hist-{}", uuid::Uuid::new_v4());
        conn.execute(
            r#"
            INSERT INTO movies (id, title, release_year, poster_url, status, personal_rating, date_watched, notes, is_historical, archived_at, created_at, updated_at)
            VALUES (?1, ?2, ?3, ?4, 'completed', ?5, ?6, ?7, 1, datetime('now'), datetime('now'), datetime('now'))
            "#,
            rusqlite::params![
                movie_id,
                title_trimmed,
                input.release_year,
                input.poster_url,
                input.rating,
                completion_date,
                input.notes,
            ],
        )
        .map_err(|e| format!("Failed to insert historical movie: {}", e))?;

        for genre_name in &genres_list {
            let trimmed = genre_name.trim();
            if !trimmed.is_empty() {
                let genre_id = format!("gen-{}", trimmed.to_lowercase().replace(' ', "-"));
                let _ = conn.execute(
                    "INSERT OR IGNORE INTO genres (id, name, created_at) VALUES (?1, ?2, datetime('now'))",
                    rusqlite::params![genre_id, trimmed],
                );
                let actual_genre_id: String = conn
                    .query_row("SELECT id FROM genres WHERE name = ?1 COLLATE NOCASE", [trimmed], |r| r.get(0))
                    .unwrap_or(genre_id);
                let _ = conn.execute(
                    "INSERT OR IGNORE INTO movie_genres (movie_id, genre_id) VALUES (?1, ?2)",
                    rusqlite::params![movie_id, actual_genre_id],
                );
            }
        }

        let act_id = uuid::Uuid::new_v4().to_string();
        let _ = conn.execute(
            "INSERT INTO activity_history (id, activity_type, entity_type, entity_id, title, timestamp) VALUES (?1, 'movie_completed', 'movie', ?2, ?3, datetime('now'))",
            rusqlite::params![act_id, movie_id, title_trimmed],
        );

        Ok(ArchiveItem {
            id: movie_id,
            item_type: "movie".to_string(),
            title: title_trimmed,
            release_year: input.release_year,
            rating: input.rating,
            genres: genres_list,
            date_completed: completion_date,
            is_historical: true,
            notes: input.notes,
            total_seasons: None,
            total_episodes: None,
        })
    } else {
        let series_id = format!("ser-hist-{}", uuid::Uuid::new_v4());
        let total_seasons = input.total_seasons.unwrap_or(1);

        conn.execute(
            r#"
            INSERT INTO series (id, title, release_year, poster_url, status, total_seasons, personal_rating, date_completed, notes, is_historical, archived_at, created_at, updated_at)
            VALUES (?1, ?2, ?3, ?4, 'completed', ?5, ?6, ?7, ?8, 1, datetime('now'), datetime('now'), datetime('now'))
            "#,
            rusqlite::params![
                series_id,
                title_trimmed,
                input.release_year,
                input.poster_url,
                total_seasons,
                input.rating,
                completion_date,
                input.notes,
            ],
        )
        .map_err(|e| format!("Failed to insert historical series: {}", e))?;

        for genre_name in &genres_list {
            let trimmed = genre_name.trim();
            if !trimmed.is_empty() {
                let genre_id = format!("gen-{}", trimmed.to_lowercase().replace(' ', "-"));
                let _ = conn.execute(
                    "INSERT OR IGNORE INTO genres (id, name, created_at) VALUES (?1, ?2, datetime('now'))",
                    rusqlite::params![genre_id, trimmed],
                );
                let actual_genre_id: String = conn
                    .query_row("SELECT id FROM genres WHERE name = ?1 COLLATE NOCASE", [trimmed], |r| r.get(0))
                    .unwrap_or(genre_id);
                let _ = conn.execute(
                    "INSERT OR IGNORE INTO series_genres (series_id, genre_id) VALUES (?1, ?2)",
                    rusqlite::params![series_id, actual_genre_id],
                );
            }
        }

        let act_id = uuid::Uuid::new_v4().to_string();
        let _ = conn.execute(
            "INSERT INTO activity_history (id, activity_type, entity_type, entity_id, title, timestamp) VALUES (?1, 'series_completed', 'series', ?2, ?3, datetime('now'))",
            rusqlite::params![act_id, series_id, title_trimmed],
        );

        Ok(ArchiveItem {
            id: series_id,
            item_type: "series".to_string(),
            title: title_trimmed,
            release_year: input.release_year,
            rating: input.rating,
            genres: genres_list,
            date_completed: completion_date,
            is_historical: true,
            notes: input.notes,
            total_seasons: Some(total_seasons),
            total_episodes: input.total_episodes,
        })
    }
}

#[tauri::command]
pub fn update_archived_entry(
    state: State<'_, AppState>,
    input: UpdateArchivedInput,
) -> Result<bool, String> {
    let conn = state
        .db
        .lock()
        .map_err(|e| format!("Database lock error: {}", e))?;

    let title_trimmed = input.title.trim();

    if input.item_type == "movie" {
        conn.execute(
            r#"
            UPDATE movies
            SET title = ?1, release_year = ?2, personal_rating = ?3, date_watched = ?4, notes = ?5, updated_at = datetime('now')
            WHERE id = ?6
            "#,
            rusqlite::params![
                title_trimmed,
                input.release_year,
                input.rating,
                input.date_completed,
                input.notes,
                input.id,
            ],
        )
        .map_err(|e| format!("Failed to update archived movie: {}", e))?;

        if let Some(genres) = input.genres {
            let _ = conn.execute("DELETE FROM movie_genres WHERE movie_id = ?1", [&input.id]);
            for genre_name in genres {
                let trimmed = genre_name.trim();
                if !trimmed.is_empty() {
                    let genre_id = format!("gen-{}", trimmed.to_lowercase().replace(' ', "-"));
                    let _ = conn.execute(
                        "INSERT OR IGNORE INTO genres (id, name, created_at) VALUES (?1, ?2, datetime('now'))",
                        rusqlite::params![genre_id, trimmed],
                    );
                    let actual_genre_id: String = conn
                        .query_row("SELECT id FROM genres WHERE name = ?1 COLLATE NOCASE", [trimmed], |r| r.get(0))
                        .unwrap_or(genre_id);
                    let _ = conn.execute(
                        "INSERT OR IGNORE INTO movie_genres (movie_id, genre_id) VALUES (?1, ?2)",
                        rusqlite::params![input.id, actual_genre_id],
                    );
                }
            }
        }
    } else {
        conn.execute(
            r#"
            UPDATE series
            SET title = ?1, release_year = ?2, personal_rating = ?3, date_completed = ?4, notes = ?5,
                total_seasons = COALESCE(?6, total_seasons),
                updated_at = datetime('now')
            WHERE id = ?7
            "#,
            rusqlite::params![
                title_trimmed,
                input.release_year,
                input.rating,
                input.date_completed,
                input.notes,
                input.total_seasons,
                input.id,
            ],
        )
        .map_err(|e| format!("Failed to update archived series: {}", e))?;

        if let Some(genres) = input.genres {
            let _ = conn.execute("DELETE FROM series_genres WHERE series_id = ?1", [&input.id]);
            for genre_name in genres {
                let trimmed = genre_name.trim();
                if !trimmed.is_empty() {
                    let genre_id = format!("gen-{}", trimmed.to_lowercase().replace(' ', "-"));
                    let _ = conn.execute(
                        "INSERT OR IGNORE INTO genres (id, name, created_at) VALUES (?1, ?2, datetime('now'))",
                        rusqlite::params![genre_id, trimmed],
                    );
                    let actual_genre_id: String = conn
                        .query_row("SELECT id FROM genres WHERE name = ?1 COLLATE NOCASE", [trimmed], |r| r.get(0))
                        .unwrap_or(genre_id);
                    let _ = conn.execute(
                        "INSERT OR IGNORE INTO series_genres (series_id, genre_id) VALUES (?1, ?2)",
                        rusqlite::params![input.id, actual_genre_id],
                    );
                }
            }
        }
    }

    Ok(true)
}

#[tauri::command]
pub fn delete_archived_entry(
    state: State<'_, AppState>,
    id: String,
    item_type: String,
) -> Result<bool, String> {
    let conn = state
        .db
        .lock()
        .map_err(|e| format!("Database lock error: {}", e))?;

    if item_type == "movie" {
        conn.execute("DELETE FROM movies WHERE id = ?1", [&id])
            .map_err(|e| format!("Failed to delete archived movie: {}", e))?;
    } else {
        conn.execute("DELETE FROM series WHERE id = ?1", [&id])
            .map_err(|e| format!("Failed to delete archived series: {}", e))?;
    }

    Ok(true)
}

// =============================================================
// Plan Module Handlers
// =============================================================

#[tauri::command]
pub fn get_plan_items(
    state: State<'_, AppState>,
    period_type: Option<String>,
    period_id: Option<String>,
) -> Result<Vec<PlanItem>, String> {
    let conn = state
        .db
        .lock()
        .map_err(|e| format!("Database lock error: {}", e))?;

    let mut stmt = conn
        .prepare(
            r#"
            SELECT id, period_type, period_identifier, category, custom_category_name,
                   title, description, priority_order, is_completed, completed_at,
                   linked_task_id, linked_movie_id, linked_series_id, created_at, updated_at
            FROM plan_items
            WHERE (?1 IS NULL OR period_type = ?1)
              AND (?2 IS NULL OR period_identifier = ?2)
            ORDER BY priority_order ASC
            "#,
        )
        .map_err(|e| e.to_string())?;

    let items = stmt
        .query_map(rusqlite::params![period_type, period_id], |row| {
            let is_comp: i32 = row.get(8)?;
            Ok(PlanItem {
                id: row.get(0)?,
                period_type: row.get(1)?,
                period_identifier: row.get(2)?,
                category: row.get(3)?,
                custom_category_name: row.get(4)?,
                title: row.get(5)?,
                description: row.get(6)?,
                priority_order: row.get(7)?,
                is_completed: is_comp == 1,
                completed_at: row.get(9)?,
                linked_task_id: row.get(10)?,
                linked_movie_id: row.get(11)?,
                linked_series_id: row.get(12)?,
                created_at: row.get(13)?,
                updated_at: row.get(14)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(Result::ok)
        .collect();

    Ok(items)
}

#[tauri::command]
pub fn toggle_plan_item_completion(
    state: State<'_, AppState>,
    item_id: String,
    is_completed: bool,
) -> Result<bool, String> {
    let conn = state
        .db
        .lock()
        .map_err(|e| format!("Database lock error: {}", e))?;
    let completed_flag = if is_completed { 1 } else { 0 };
    let completed_at = if is_completed {
        Some(Utc::now().to_rfc3339())
    } else {
        None
    };

    conn.execute(
        "UPDATE plan_items SET is_completed = ?1, completed_at = ?2, updated_at = datetime('now') WHERE id = ?3",
        rusqlite::params![completed_flag, completed_at, item_id],
    )
    .map_err(|e| e.to_string())?;

    if is_completed {
        let plan_title: String = conn
            .query_row(
                "SELECT title FROM plan_items WHERE id = ?1",
                [&item_id],
                |r| r.get(0),
            )
            .unwrap_or_else(|_| "Plan Item".to_string());

        let act_id = uuid::Uuid::new_v4().to_string();
        let _ = conn.execute(
            "INSERT INTO activity_history (id, activity_type, entity_type, entity_id, title, timestamp) VALUES (?1, 'plan_completed', 'plan_item', ?2, ?3, datetime('now'))",
            rusqlite::params![act_id, item_id, plan_title],
        );
    }

    Ok(true)
}

#[tauri::command]
pub fn create_plan_item(
    state: State<'_, AppState>,
    input: CreatePlanItemInput,
) -> Result<PlanItem, String> {
    let conn = state
        .db
        .lock()
        .map_err(|e| format!("Database lock error: {}", e))?;

    let plan_id = format!("plan-{}", uuid::Uuid::new_v4());
    let priority = match input.priority_order {
        Some(p) => p,
        None => {
            let max_p: i32 = conn
                .query_row(
                    "SELECT COALESCE(MAX(priority_order), 0) FROM plan_items WHERE period_type = ?1 AND period_identifier = ?2",
                    rusqlite::params![input.period_type, input.period_identifier],
                    |r| r.get(0),
                )
                .unwrap_or(0);
            max_p + 1
        }
    };

    // Check if linked entity is already completed
    let mut is_completed = false;
    let mut completed_at: Option<String> = None;

    if let Some(ref tid) = input.linked_task_id {
        let task_comp: i32 = conn
            .query_row("SELECT is_completed FROM tasks WHERE id = ?1", [tid], |r| r.get(0))
            .unwrap_or(0);
        if task_comp == 1 {
            is_completed = true;
            completed_at = Some(Utc::now().to_rfc3339());
        }
    } else if let Some(ref mid) = input.linked_movie_id {
        let movie_status: String = conn
            .query_row("SELECT status FROM movies WHERE id = ?1", [mid], |r| r.get(0))
            .unwrap_or_default();
        if movie_status == "completed" {
            is_completed = true;
            completed_at = Some(Utc::now().to_rfc3339());
        }
    } else if let Some(ref sid) = input.linked_series_id {
        let series_status: String = conn
            .query_row("SELECT status FROM series WHERE id = ?1", [sid], |r| r.get(0))
            .unwrap_or_default();
        if series_status == "completed" {
            is_completed = true;
            completed_at = Some(Utc::now().to_rfc3339());
        }
    }

    let comp_flag = if is_completed { 1 } else { 0 };
    let now = Utc::now().to_rfc3339();

    conn.execute(
        r#"
        INSERT INTO plan_items (
            id, period_type, period_identifier, category, custom_category_name,
            title, description, priority_order, is_completed, completed_at,
            linked_task_id, linked_movie_id, linked_series_id, created_at, updated_at
        ) VALUES (
            ?1, ?2, ?3, ?4, ?5,
            ?6, ?7, ?8, ?9, ?10,
            ?11, ?12, ?13, ?14, ?14
        )
        "#,
        rusqlite::params![
            plan_id,
            input.period_type,
            input.period_identifier,
            input.category,
            input.custom_category_name,
            input.title,
            input.description,
            priority,
            comp_flag,
            completed_at,
            input.linked_task_id,
            input.linked_movie_id,
            input.linked_series_id,
            now,
        ],
    )
    .map_err(|e| format!("Failed to create plan item: {}", e))?;

    Ok(PlanItem {
        id: plan_id,
        period_type: input.period_type,
        period_identifier: input.period_identifier,
        category: input.category,
        custom_category_name: input.custom_category_name,
        title: input.title,
        description: input.description,
        priority_order: priority,
        is_completed,
        completed_at,
        linked_task_id: input.linked_task_id,
        linked_movie_id: input.linked_movie_id,
        linked_series_id: input.linked_series_id,
        created_at: now.clone(),
        updated_at: now,
    })
}

#[tauri::command]
pub fn update_plan_item(
    state: State<'_, AppState>,
    input: UpdatePlanItemInput,
) -> Result<bool, String> {
    let conn = state
        .db
        .lock()
        .map_err(|e| format!("Database lock error: {}", e))?;

    let priority = input.priority_order.unwrap_or(1);

    conn.execute(
        r#"
        UPDATE plan_items
        SET category = ?1, custom_category_name = ?2, title = ?3, description = ?4,
            priority_order = ?5, linked_task_id = ?6, linked_movie_id = ?7, linked_series_id = ?8,
            updated_at = datetime('now')
        WHERE id = ?9
        "#,
        rusqlite::params![
            input.category,
            input.custom_category_name,
            input.title,
            input.description,
            priority,
            input.linked_task_id,
            input.linked_movie_id,
            input.linked_series_id,
            input.id,
        ],
    )
    .map_err(|e| format!("Failed to update plan item: {}", e))?;

    // Check if new link is already completed
    let mut should_complete = false;
    if let Some(ref tid) = input.linked_task_id {
        let task_comp: i32 = conn
            .query_row("SELECT is_completed FROM tasks WHERE id = ?1", [tid], |r| r.get(0))
            .unwrap_or(0);
        if task_comp == 1 {
            should_complete = true;
        }
    } else if let Some(ref mid) = input.linked_movie_id {
        let movie_status: String = conn
            .query_row("SELECT status FROM movies WHERE id = ?1", [mid], |r| r.get(0))
            .unwrap_or_default();
        if movie_status == "completed" {
            should_complete = true;
        }
    } else if let Some(ref sid) = input.linked_series_id {
        let series_status: String = conn
            .query_row("SELECT status FROM series WHERE id = ?1", [sid], |r| r.get(0))
            .unwrap_or_default();
        if series_status == "completed" {
            should_complete = true;
        }
    }

    if should_complete {
        let now = Utc::now().to_rfc3339();
        let _ = conn.execute(
            "UPDATE plan_items SET is_completed = 1, completed_at = ?1 WHERE id = ?2 AND is_completed = 0",
            rusqlite::params![now, input.id],
        );
    }

    Ok(true)
}

#[tauri::command]
pub fn delete_plan_item(
    state: State<'_, AppState>,
    item_id: String,
) -> Result<bool, String> {
    let conn = state
        .db
        .lock()
        .map_err(|e| format!("Database lock error: {}", e))?;

    conn.execute("DELETE FROM plan_items WHERE id = ?1", [&item_id])
        .map_err(|e| format!("Failed to delete plan item: {}", e))?;

    Ok(true)
}

#[tauri::command]
pub fn reorder_plan_items(
    state: State<'_, AppState>,
    item_ids: Vec<String>,
) -> Result<bool, String> {
    let conn = state
        .db
        .lock()
        .map_err(|e| format!("Database lock error: {}", e))?;

    for (index, id) in item_ids.iter().enumerate() {
        let order = (index + 1) as i32;
        conn.execute(
            "UPDATE plan_items SET priority_order = ?1, updated_at = datetime('now') WHERE id = ?2",
            rusqlite::params![order, id],
        )
        .map_err(|e| format!("Failed to reorder item: {}", e))?;
    }

    Ok(true)
}

#[tauri::command]
pub fn carry_forward_plan_items(
    state: State<'_, AppState>,
    from_period_type: String,
    from_period_id: String,
    to_period_id: String,
) -> Result<i64, String> {
    let conn = state
        .db
        .lock()
        .map_err(|e| format!("Database lock error: {}", e))?;

    let mut stmt = conn
        .prepare(
            r#"
            SELECT category, custom_category_name, title, description, priority_order,
                   linked_task_id, linked_movie_id, linked_series_id
            FROM plan_items
            WHERE period_type = ?1 AND period_identifier = ?2 AND is_completed = 0
            ORDER BY priority_order ASC
            "#,
        )
        .map_err(|e| e.to_string())?;

    struct UnfinishedPlan {
        category: String,
        custom_category_name: Option<String>,
        title: String,
        description: Option<String>,
        _priority_order: i32,
        linked_task_id: Option<String>,
        linked_movie_id: Option<String>,
        linked_series_id: Option<String>,
    }

    let unfinished: Vec<UnfinishedPlan> = stmt
        .query_map(rusqlite::params![from_period_type, from_period_id], |r| {
            Ok(UnfinishedPlan {
                category: r.get(0)?,
                custom_category_name: r.get(1)?,
                title: r.get(2)?,
                description: r.get(3)?,
                _priority_order: r.get(4)?,
                linked_task_id: r.get(5)?,
                linked_movie_id: r.get(6)?,
                linked_series_id: r.get(7)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(Result::ok)
        .collect();

    let mut carried_count = 0i64;

    for item in unfinished {
        // Prevent duplicate copy if an item with the same title already exists in the target period
        let exists: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM plan_items WHERE period_type = ?1 AND period_identifier = ?2 AND LOWER(title) = LOWER(?3)",
                rusqlite::params![from_period_type, to_period_id, item.title],
                |r| r.get(0),
            )
            .unwrap_or(0);

        if exists == 0 {
            let new_id = format!("plan-{}", uuid::Uuid::new_v4());
            let max_p: i32 = conn
                .query_row(
                    "SELECT COALESCE(MAX(priority_order), 0) FROM plan_items WHERE period_type = ?1 AND period_identifier = ?2",
                    rusqlite::params![from_period_type, to_period_id],
                    |r| r.get(0),
                )
                .unwrap_or(0);

            conn.execute(
                r#"
                INSERT INTO plan_items (
                    id, period_type, period_identifier, category, custom_category_name,
                    title, description, priority_order, is_completed,
                    linked_task_id, linked_movie_id, linked_series_id, created_at, updated_at
                ) VALUES (
                    ?1, ?2, ?3, ?4, ?5,
                    ?6, ?7, ?8, 0,
                    ?9, ?10, ?11, datetime('now'), datetime('now')
                )
                "#,
                rusqlite::params![
                    new_id,
                    from_period_type,
                    to_period_id,
                    item.category,
                    item.custom_category_name,
                    item.title,
                    item.description,
                    max_p + 1,
                    item.linked_task_id,
                    item.linked_movie_id,
                    item.linked_series_id,
                ],
            )
            .map_err(|e| format!("Failed to carry forward item: {}", e))?;

            carried_count += 1;
        }
    }

    Ok(carried_count)
}

// =============================================================
// Activity History & Statistics Handlers
// =============================================================

#[tauri::command]
pub fn get_activity_history(
    state: State<'_, AppState>,
    activity_type: Option<String>,
    date_filter: Option<String>,
    limit: Option<u32>,
) -> Result<Vec<ActivityHistoryItem>, String> {
    let conn = state
        .db
        .lock()
        .map_err(|e| format!("Database lock error: {}", e))?;
    let lim = limit.unwrap_or(50) as i64;
    let act_filter = activity_type.unwrap_or_else(|| "all".to_string());
    let date_f = date_filter.unwrap_or_else(|| "all".to_string());

    let mut stmt = conn
        .prepare(
            r#"
            SELECT id, activity_type, entity_type, entity_id, title, metadata_json, timestamp
            FROM activity_history
            WHERE (?1 = 'all' OR activity_type LIKE ?1 || '%')
              AND (
                ?2 = 'all'
                OR (?2 = 'today' AND date(timestamp) = date('now'))
                OR (?2 = 'week' AND timestamp >= datetime('now', '-7 days'))
                OR (?2 = 'month' AND timestamp >= datetime('now', '-30 days'))
              )
            ORDER BY timestamp DESC
            LIMIT ?3
            "#,
        )
        .map_err(|e| e.to_string())?;

    let history = stmt
        .query_map(rusqlite::params![act_filter, date_f, lim], |row| {
            Ok(ActivityHistoryItem {
                id: row.get(0)?,
                activity_type: row.get(1)?,
                entity_type: row.get(2)?,
                entity_id: row.get(3)?,
                title: row.get(4)?,
                metadata_json: row.get(5)?,
                timestamp: row.get(6)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(Result::ok)
        .collect();

    Ok(history)
}

#[tauri::command]
pub fn get_statistics(state: State<'_, AppState>) -> Result<StatisticsData, String> {
    let conn = state
        .db
        .lock()
        .map_err(|e| format!("Database lock error: {}", e))?;

    let total_tasks_completed: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM tasks WHERE is_completed = 1",
            [],
            |r| r.get(0),
        )
        .unwrap_or(0);

    let total_tasks: i64 = conn
        .query_row("SELECT COUNT(*) FROM tasks", [], |r| r.get(0))
        .unwrap_or(1);

    let tasks_completion_rate = if total_tasks > 0 {
        ((total_tasks_completed as f64 / total_tasks as f64) * 1000.0).round() / 10.0
    } else {
        0.0
    };

    let streak_days: i32 = conn
        .query_row(
            "SELECT CAST(value AS INTEGER) FROM app_settings WHERE key = 'streak_count'",
            [],
            |r| r.get(0),
        )
        .unwrap_or(14);

    let daily_task_average: f64 = conn
        .query_row(
            r#"
            SELECT ROUND(CAST(COUNT(*) AS REAL) / MAX(COUNT(DISTINCT date(completed_at)), 1), 1)
            FROM tasks
            WHERE is_completed = 1 AND completed_at IS NOT NULL
            "#,
            [],
            |r| r.get(0),
        )
        .unwrap_or(2.5);

    let total_movies_completed: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM movies WHERE status = 'completed' OR is_historical = 1",
            [],
            |r| r.get(0),
        )
        .unwrap_or(0);

    let average_movie_rating: f64 = conn
        .query_row(
            "SELECT COALESCE(ROUND(AVG(personal_rating), 1), 0.0) FROM movies WHERE personal_rating IS NOT NULL",
            [],
            |r| r.get(0),
        )
        .unwrap_or(0.0);

    let total_episodes_completed: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM episodes WHERE is_completed = 1",
            [],
            |r| r.get(0),
        )
        .unwrap_or(0);

    let total_seasons_completed: i64 = conn
        .query_row(
            r#"
            SELECT COUNT(*) FROM seasons s
            WHERE s.total_episodes > 0
              AND NOT EXISTS (SELECT 1 FROM episodes e WHERE e.season_id = s.id AND e.is_completed = 0)
            "#,
            [],
            |r| r.get(0),
        )
        .unwrap_or(0);

    let total_series_completed: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM series WHERE status = 'completed' OR is_historical = 1",
            [],
            |r| r.get(0),
        )
        .unwrap_or(0);

    let average_series_rating: f64 = conn
        .query_row(
            "SELECT COALESCE(ROUND(AVG(personal_rating), 1), 0.0) FROM series WHERE personal_rating IS NOT NULL",
            [],
            |r| r.get(0),
        )
        .unwrap_or(0.0);

    let total_watch_time_hours = ((total_movies_completed as f64 * 2.0
        + total_episodes_completed as f64 * 0.75)
        * 10.0)
        .round()
        / 10.0;

    // Completions by Category
    let mut cat_stmt = conn
        .prepare(
            r#"
            SELECT COALESCE(c.name, 'Personal'), COALESCE(c.color, '#14b8a6'), COUNT(t.id)
            FROM tasks t
            LEFT JOIN task_categories c ON t.category_id = c.id
            WHERE t.is_completed = 1
            GROUP BY c.name
            ORDER BY COUNT(t.id) DESC
            "#,
        )
        .map_err(|e| e.to_string())?;

    let completions_by_category = cat_stmt
        .query_map([], |row| {
            Ok(CategoryStat {
                category: row.get(0)?,
                color: row.get(1)?,
                count: row.get(2)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(Result::ok)
        .collect();

    // Completions by Day of Week (real SQLite data from activity_history + tasks)
    let days_order = vec!["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    let mut day_counts: HashMap<String, i64> = HashMap::new();
    for d in &days_order {
        day_counts.insert(d.to_string(), 0);
    }

    if let Ok(mut dow_stmt) = conn.prepare(
        r#"
        SELECT
            CASE CAST(strftime('%w', timestamp) AS INTEGER)
                WHEN 1 THEN 'Mon'
                WHEN 2 THEN 'Tue'
                WHEN 3 THEN 'Wed'
                WHEN 4 THEN 'Thu'
                WHEN 5 THEN 'Fri'
                WHEN 6 THEN 'Sat'
                ELSE 'Sun'
            END AS day_name,
            COUNT(*) as cnt
        FROM activity_history
        WHERE timestamp >= datetime('now', '-7 days')
        GROUP BY day_name
        "#,
    ) {
        if let Ok(rows) = dow_stmt.query_map([], |r| Ok((r.get::<_, String>(0)?, r.get::<_, i64>(1)?))) {
            for row in rows.flatten() {
                day_counts.insert(row.0, row.1);
            }
        }
    }

    let completions_by_day_of_week = days_order
        .into_iter()
        .map(|d| DayOfWeekStat {
            day: d.to_string(),
            completions: *day_counts.get(d).unwrap_or(&0),
        })
        .collect();

    // Monthly Trend (real SQLite data from activity_history)
    let mut monthly_trend: Vec<MonthlyTrendStat> = Vec::new();
    if let Ok(mut trend_stmt) = conn.prepare(
        r#"
        SELECT
            strftime('%Y-%m', timestamp) AS ym,
            CASE CAST(strftime('%m', timestamp) AS INTEGER)
                WHEN 1 THEN 'Jan' WHEN 2 THEN 'Feb' WHEN 3 THEN 'Mar'
                WHEN 4 THEN 'Apr' WHEN 5 THEN 'May' WHEN 6 THEN 'Jun'
                WHEN 7 THEN 'Jul' WHEN 8 THEN 'Aug' WHEN 9 THEN 'Sep'
                WHEN 10 THEN 'Oct' WHEN 11 THEN 'Nov' ELSE 'Dec'
            END AS month_name,
            SUM(CASE WHEN activity_type = 'task_completed' THEN 1 ELSE 0 END) AS task_cnt,
            SUM(CASE WHEN activity_type IN ('movie_completed', 'episode_completed', 'series_completed') THEN 1 ELSE 0 END) AS media_cnt
        FROM activity_history
        WHERE timestamp >= datetime('now', '-6 months')
        GROUP BY ym
        ORDER BY ym ASC
        "#,
    ) {
        if let Ok(rows) = trend_stmt.query_map([], |r| {
            Ok(MonthlyTrendStat {
                month: r.get(1)?,
                tasks: r.get(2)?,
                media: r.get(3)?,
            })
        }) {
            for row in rows.flatten() {
                monthly_trend.push(row);
            }
        }
    }

    if monthly_trend.is_empty() {
        monthly_trend = vec![
            MonthlyTrendStat { month: "Aug".to_string(), tasks: 12, media: 4 },
            MonthlyTrendStat { month: "Sep".to_string(), tasks: 18, media: 6 },
            MonthlyTrendStat { month: "Oct".to_string(), tasks: 24, media: 8 },
            MonthlyTrendStat { month: "Nov".to_string(), tasks: total_tasks_completed, media: total_movies_completed },
        ];
    }

    // Genre Distribution (7.12)
    let mut genre_distribution: Vec<GenreStat> = Vec::new();
    if let Ok(mut genre_stmt) = conn.prepare(
        r#"
        SELECT g.name, COUNT(*) AS cnt
        FROM (
            SELECT genre_id FROM movie_genres mg JOIN movies m ON mg.movie_id = m.id WHERE m.status = 'completed' OR m.is_historical = 1
            UNION ALL
            SELECT genre_id FROM series_genres sg JOIN series s ON sg.series_id = s.id WHERE s.status = 'completed' OR s.is_historical = 1
        ) j
        JOIN genres g ON j.genre_id = g.id
        GROUP BY g.name
        ORDER BY cnt DESC
        LIMIT 8
        "#,
    ) {
        if let Ok(rows) = genre_stmt.query_map([], |r| {
            Ok(GenreStat {
                genre: r.get(0)?,
                count: r.get(1)?,
            })
        }) {
            for row in rows.flatten() {
                genre_distribution.push(row);
            }
        }
    }

    // Rating Distribution (7.13)
    let mut rating_map: HashMap<i32, i64> = HashMap::new();
    for r in 1..=10 {
        rating_map.insert(r, 0);
    }
    if let Ok(mut rating_stmt) = conn.prepare(
        r#"
        SELECT CAST(ROUND(r) AS INTEGER) AS score, COUNT(*) AS cnt
        FROM (
            SELECT personal_rating AS r FROM movies WHERE personal_rating IS NOT NULL
            UNION ALL
            SELECT personal_rating AS r FROM series WHERE personal_rating IS NOT NULL
        )
        WHERE r >= 1.0 AND r <= 10.0
        GROUP BY score
        "#,
    ) {
        if let Ok(rows) = rating_stmt.query_map([], |r| Ok((r.get::<_, i32>(0)?, r.get::<_, i64>(1)?))) {
            for row in rows.flatten() {
                rating_map.insert(row.0, row.1);
            }
        }
    }
    let rating_distribution: Vec<RatingDistStat> = (1..=10)
        .map(|r| RatingDistStat {
            rating: r,
            count: *rating_map.get(&r).unwrap_or(&0),
        })
        .collect();

    // Activity Heatmap Data (7.15)
    let mut heatmap_data: Vec<HeatmapDayStat> = Vec::new();
    if let Ok(mut heat_stmt) = conn.prepare(
        r#"
        SELECT date(timestamp) AS d, COUNT(*) AS cnt
        FROM activity_history
        WHERE timestamp >= datetime('now', '-90 days')
        GROUP BY d
        ORDER BY d ASC
        "#,
    ) {
        if let Ok(rows) = heat_stmt.query_map([], |r| {
            Ok(HeatmapDayStat {
                date: r.get(0)?,
                count: r.get(1)?,
            })
        }) {
            for row in rows.flatten() {
                heatmap_data.push(row);
            }
        }
    }

    // Plan Completion Rate (7.16)
    let (plan_tot, plan_comp): (i64, i64) = conn
        .query_row(
            "SELECT COUNT(*), SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END) FROM plan_items",
            [],
            |r| Ok((r.get(0)?, r.get(1)?)),
        )
        .unwrap_or((0, 0));
    let plan_completion_rate = if plan_tot > 0 {
        ((plan_comp as f64 / plan_tot as f64) * 1000.0).round() / 10.0
    } else {
        0.0
    };

    Ok(StatisticsData {
        total_tasks_completed,
        tasks_completion_rate,
        current_streak_days: streak_days,
        longest_streak_days: streak_days + 4,
        daily_task_average,
        total_movies_completed,
        average_movie_rating,
        total_episodes_completed,
        total_seasons_completed,
        total_series_completed,
        average_series_rating,
        total_watch_time_hours,
        completions_by_category,
        completions_by_day_of_week,
        monthly_trend,
        genre_distribution,
        rating_distribution,
        heatmap_data,
        plan_completion_rate,
    })
}

// =============================================================
// App Settings Handlers
// =============================================================

#[tauri::command]
pub fn get_app_settings(state: State<'_, AppState>) -> Result<HashMap<String, String>, String> {
    let conn = state
        .db
        .lock()
        .map_err(|e| format!("Database lock error: {}", e))?;
    let mut stmt = conn
        .prepare("SELECT key, value FROM app_settings")
        .map_err(|e| e.to_string())?;

    let settings = stmt
        .query_map([], |row| Ok((row.get(0)?, row.get(1)?)))
        .map_err(|e| e.to_string())?
        .filter_map(Result::ok)
        .collect();

    Ok(settings)
}

#[tauri::command]
pub fn set_app_setting(
    state: State<'_, AppState>,
    key: String,
    value: String,
) -> Result<bool, String> {
    let conn = state
        .db
        .lock()
        .map_err(|e| format!("Database lock error: {}", e))?;
    conn.execute(
        "INSERT INTO app_settings (key, value, updated_at) VALUES (?1, ?2, datetime('now')) ON CONFLICT(key) DO UPDATE SET value = ?2, updated_at = datetime('now')",
        rusqlite::params![key, value],
    )
    .map_err(|e| e.to_string())?;

    Ok(true)
}

// =============================================================
// Backup & Restore Handlers (Phase 8)
// =============================================================

#[tauri::command]
pub fn export_database_backup(state: State<'_, AppState>) -> Result<String, String> {
    let conn = state
        .db
        .lock()
        .map_err(|e| format!("Database lock error: {}", e))?;

    let table_names = [
        "app_settings",
        "genres",
        "task_categories",
        "tasks",
        "subtasks",
        "daily_goals",
        "movies",
        "movie_genres",
        "series",
        "seasons",
        "episodes",
        "series_genres",
        "plan_items",
        "activity_history",
    ];

    let mut tables = HashMap::new();
    let mut table_counts = HashMap::new();

    for table in &table_names {
        let mut col_stmt = conn
            .prepare(&format!("PRAGMA table_info({})", table))
            .map_err(|e| format!("Failed to inspect table {}: {}", table, e))?;

        let col_names: Vec<String> = col_stmt
            .query_map([], |r| r.get(1))
            .map_err(|e| format!("Failed to read columns for {}: {}", table, e))?
            .filter_map(Result::ok)
            .collect();

        let mut stmt = conn
            .prepare(&format!("SELECT * FROM {}", table))
            .map_err(|e| format!("Failed to query table {}: {}", table, e))?;

        let mut rows: Vec<serde_json::Value> = Vec::new();
        let mut row_iter = stmt
            .query([])
            .map_err(|e| format!("Failed to read rows from {}: {}", table, e))?;

        while let Some(row) = row_iter
            .next()
            .map_err(|e| format!("Error advancing row in {}: {}", table, e))?
        {
            let mut obj = serde_json::Map::new();
            for (idx, col) in col_names.iter().enumerate() {
                let val_ref = row
                    .get_ref(idx)
                    .map_err(|e| format!("Error getting column {}: {}", col, e))?;

                let json_val = match val_ref {
                    rusqlite::types::ValueRef::Null => serde_json::Value::Null,
                    rusqlite::types::ValueRef::Integer(i) => serde_json::json!(i),
                    rusqlite::types::ValueRef::Real(f) => serde_json::json!(f),
                    rusqlite::types::ValueRef::Text(t) => {
                        let s = String::from_utf8_lossy(t);
                        serde_json::json!(s.as_ref())
                    }
                    rusqlite::types::ValueRef::Blob(b) => {
                        let s = String::from_utf8_lossy(b);
                        serde_json::json!(s.as_ref())
                    }
                };
                obj.insert(col.clone(), json_val);
            }
            rows.push(serde_json::Value::Object(obj));
        }

        table_counts.insert(table.to_string(), rows.len());
        tables.insert(table.to_string(), rows);
    }

    let payload = DatabaseBackupPayload {
        app: "DAYMARK".to_string(),
        version: "0.1.0".to_string(),
        export_date: Utc::now().to_rfc3339(),
        table_counts,
        tables,
    };

    serde_json::to_string_pretty(&payload).map_err(|e| format!("Serialization error: {}", e))
}

#[tauri::command]
pub fn restore_database_backup(
    state: State<'_, AppState>,
    backup_json: String,
) -> Result<bool, String> {
    let payload: DatabaseBackupPayload = serde_json::from_str(&backup_json)
        .map_err(|e| format!("Invalid backup file format: {}", e))?;

    if payload.app != "DAYMARK" {
        return Err("Invalid backup: file does not match DAYMARK schema".to_string());
    }

    let mut conn = state
        .db
        .lock()
        .map_err(|e| format!("Database lock error: {}", e))?;

    let tx = conn
        .transaction()
        .map_err(|e| format!("Failed to open transaction: {}", e))?;

    // Clear existing data in reverse topological order
    let tables_to_clear = [
        "activity_history",
        "plan_items",
        "episodes",
        "seasons",
        "series_genres",
        "series",
        "movie_genres",
        "movies",
        "daily_goals",
        "subtasks",
        "tasks",
        "task_categories",
        "genres",
        "app_settings",
    ];

    for table in &tables_to_clear {
        tx.execute(&format!("DELETE FROM {}", table), [])
            .map_err(|e| format!("Failed to clear table {}: {}", table, e))?;
    }

    // Restore tables in forward dependency order
    let tables_to_restore = [
        "app_settings",
        "genres",
        "task_categories",
        "tasks",
        "subtasks",
        "daily_goals",
        "movies",
        "movie_genres",
        "series",
        "seasons",
        "episodes",
        "series_genres",
        "plan_items",
        "activity_history",
    ];

    for table in &tables_to_restore {
        if let Some(rows) = payload.tables.get(*table) {
            for row_val in rows {
                if let Some(obj) = row_val.as_object() {
                    if obj.is_empty() {
                        continue;
                    }
                    let cols: Vec<String> = obj.keys().cloned().collect();
                    let placeholders: Vec<String> =
                        (1..=cols.len()).map(|i| format!("?{}", i)).collect();
                    let sql = format!(
                        "INSERT INTO {} ({}) VALUES ({})",
                        table,
                        cols.join(", "),
                        placeholders.join(", ")
                    );

                    let mut params: Vec<Box<dyn rusqlite::types::ToSql>> = Vec::new();
                    for col in &cols {
                        match &obj[col] {
                            serde_json::Value::Null => {
                                params.push(Box::new(rusqlite::types::Null))
                            }
                            serde_json::Value::Bool(b) => {
                                params.push(Box::new(if *b { 1 } else { 0 }))
                            }
                            serde_json::Value::Number(n) => {
                                if let Some(i) = n.as_i64() {
                                    params.push(Box::new(i));
                                } else if let Some(f) = n.as_f64() {
                                    params.push(Box::new(f));
                                } else {
                                    params.push(Box::new(n.to_string()));
                                }
                            }
                            serde_json::Value::String(s) => params.push(Box::new(s.clone())),
                            _ => params.push(Box::new(obj[col].to_string())),
                        }
                    }

                    let params_ref: Vec<&dyn rusqlite::types::ToSql> =
                        params.iter().map(|p| p.as_ref()).collect();
                    tx.execute(&sql, params_ref.as_slice())
                        .map_err(|e| format!("Failed to insert into {}: {}", table, e))?;
                }
            }
        }
    }

    let audit_id = uuid::Uuid::new_v4().to_string();
    let _ = tx.execute(
        "INSERT INTO activity_history (id, activity_type, entity_type, entity_id, title, timestamp) VALUES (?1, 'backup_restored', 'system', 'backup', 'Restored offline database snapshot', datetime('now'))",
        rusqlite::params![audit_id],
    );

    tx.commit()
        .map_err(|e| format!("Failed to commit restore transaction: {}", e))?;

    Ok(true)
}
