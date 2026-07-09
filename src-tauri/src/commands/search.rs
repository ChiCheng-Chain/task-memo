use serde::Deserialize;

use crate::db::{connection::open_app_connection, migrations::AppError, repositories};

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchInput {
    pub query: String,
    pub sources: Vec<String>,
}

#[tauri::command]
pub fn search_all(app: tauri::AppHandle, input: SearchInput) -> Result<Vec<repositories::SearchResultDto>, AppError> {
    let conn = open_app_connection(&app)?;
    repositories::search_all(&conn, &input.query, &input.sources)
}
