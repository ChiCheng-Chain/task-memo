use serde::Deserialize;

use crate::db::{connection::open_app_connection, migrations::AppError, repositories};

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveDailyDraftInput {
    pub draft_date: String,
    pub content: String,
}

#[tauri::command]
pub fn get_daily_draft(app: tauri::AppHandle, draft_date: String) -> Result<repositories::DailyDraftDto, AppError> {
    let conn = open_app_connection(&app)?;
    repositories::get_daily_draft(&conn, &draft_date)
}

#[tauri::command]
pub fn save_daily_draft(
    app: tauri::AppHandle,
    input: SaveDailyDraftInput,
) -> Result<repositories::DailyDraftDto, AppError> {
    let conn = open_app_connection(&app)?;
    repositories::save_daily_draft(&conn, &input.draft_date, &input.content)
}
