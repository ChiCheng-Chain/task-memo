use crate::db::{connection::open_app_connection, migrations::AppError, repositories};

#[tauri::command]
pub fn get_day_trace(app: tauri::AppHandle, day: String) -> Result<Vec<repositories::DayTraceItemDto>, AppError> {
    let conn = open_app_connection(&app)?;
    repositories::get_day_trace(&conn, &day)
}
