use crate::db::{connection::open_app_connection, migrations::AppError, repositories};

#[tauri::command]
pub fn search_all(app: tauri::AppHandle, query: String) -> Result<Vec<repositories::SearchResultDto>, AppError> {
    let conn = open_app_connection(&app)?;
    repositories::search_all(&conn, &query)
}
