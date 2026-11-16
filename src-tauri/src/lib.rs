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
            commands::db::toggle_task_completion,
            commands::db::get_movies,
            commands::db::get_series,
            commands::db::get_series_detail,
            commands::db::toggle_episode_completion,
            commands::db::get_archive_data,
            commands::db::get_plan_items,
            commands::db::toggle_plan_item_completion,
            commands::db::get_activity_history,
            commands::db::get_statistics,
            commands::db::get_app_settings,
            commands::db::set_app_setting,
        ])
        .run(tauri::generate_context!())
        .expect("error while running DAYMARK desktop application");
}
