use rusqlite::Connection;
use tauri::Manager;

use super::migrations::AppError;

pub fn open_app_connection(app_handle: &tauri::AppHandle) -> Result<Connection, AppError> {
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|error| AppError::database(error.to_string()))?;

    std::fs::create_dir_all(&app_data_dir).map_err(|error| AppError::database(error.to_string()))?;

    let db_path = app_data_dir.join("task-memo.sqlite3");
    let conn = Connection::open(db_path)?;
    conn.pragma_update(None, "foreign_keys", "ON")?;
    Ok(conn)
}
