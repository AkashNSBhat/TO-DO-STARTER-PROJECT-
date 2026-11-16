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
            commands::system::get_app_info,
            commands::db::get_db_status,
            commands::db::ping_db,
        ])
        .run(tauri::generate_context!())
        .expect("error while running DAYMARK desktop application");
}
