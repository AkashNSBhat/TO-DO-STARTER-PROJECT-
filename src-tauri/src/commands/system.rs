use crate::db::models::AppInfoResponse;

#[tauri::command]
pub fn get_app_info() -> AppInfoResponse {
    let sqlite_ver = rusqlite::version();
    AppInfoResponse {
        name: "DAYMARK".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        description: "Every day counts. Every completion stays.".to_string(),
        os: format!("{} {}", std::env::consts::OS, std::env::consts::ARCH),
        database_engine: "SQLite 3 (Embedded WAL)".to_string(),
        sqlite_version: sqlite_ver.to_string(),
    }
}
