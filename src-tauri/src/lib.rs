pub mod commands;
pub mod db;
pub mod state;

use state::AppState;
use std::sync::Mutex;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            // Initialize SQLite database and run migrations
            let app_handle = app.handle();
            let (conn, db_path) = match db::init_database(&app_handle) {
                Ok(res) => res,
                Err(err) => {
                    eprintln!("[FATAL] Database initialization failed: {}", err);
                    return Err(err.into());
                }
            };

            // Manage global application state
            app.manage(AppState {
                db: Mutex::new(conn),
                db_path,
            });

            println!("[DAYMARK] Core desktop backend initialized successfully.");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Core System & Diagnostics
            commands::system::get_app_info,
            commands::db::get_db_status,
            commands::db::ping_db,

            // Milestone 2 IPC Query & Mutation Commands
            commands::db::get_dashboard_data,
            commands::db::get_tasks,
            commands::db::create_task,
            commands::db::update_task,
            commands::db::delete_task,
            commands::db::toggle_task_completion,
            commands::db::get_subtasks,
            commands::db::toggle_subtask_completion,
            commands::db::add_subtask,
            commands::db::delete_subtask,
            commands::db::get_task_categories,
            commands::db::get_daily_goal,
            commands::db::update_daily_goal,
            commands::db::get_movies,
            commands::db::create_movie,
            commands::db::update_movie,
            commands::db::delete_movie,
            commands::db::get_all_genres,
            commands::db::get_series,
            commands::db::get_series_detail,
            commands::db::create_series,
            commands::db::update_series,
            commands::db::delete_series,
            commands::db::update_episode_title,
            commands::db::toggle_episode_completion,
            commands::db::rate_series,
            commands::db::add_season,
            commands::db::delete_season,
            commands::db::add_episode,
            commands::db::delete_episode,
            commands::db::get_archive_data,
            commands::db::add_historical_entry,
            commands::db::check_archive_duplicate,
            commands::db::update_archived_entry,
            commands::db::delete_archived_entry,
            commands::db::get_plan_items,
            commands::db::toggle_plan_item_completion,
            commands::db::create_plan_item,
            commands::db::update_plan_item,
            commands::db::delete_plan_item,
            commands::db::reorder_plan_items,
            commands::db::carry_forward_plan_items,
            commands::db::get_activity_history,
            commands::db::get_statistics,
            commands::db::get_app_settings,
            commands::db::set_app_setting,
        ])
        .run(tauri::generate_context!())
        .expect("error while running DAYMARK desktop application");
}
