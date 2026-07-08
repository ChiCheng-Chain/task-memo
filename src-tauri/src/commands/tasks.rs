use serde::Deserialize;

use crate::db::{connection::open_app_connection, migrations::AppError, repositories};

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateTaskInput {
    pub title: String,
    pub note: String,
    pub task_date: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateTaskInput {
    pub id: String,
    pub title: String,
    pub note: String,
    pub task_date: String,
}

#[tauri::command]
pub fn list_tasks(app: tauri::AppHandle, task_date: String) -> Result<Vec<repositories::TaskDto>, AppError> {
    let conn = open_app_connection(&app)?;
    repositories::list_tasks(&conn, &task_date)
}

#[tauri::command]
pub fn create_task(app: tauri::AppHandle, input: CreateTaskInput) -> Result<repositories::TaskDto, AppError> {
    let conn = open_app_connection(&app)?;
    repositories::create_task(&conn, &input.title, &input.note, &input.task_date)
}

#[tauri::command]
pub fn update_task(app: tauri::AppHandle, input: UpdateTaskInput) -> Result<repositories::TaskDto, AppError> {
    let conn = open_app_connection(&app)?;
    repositories::update_task(&conn, &input.id, &input.title, &input.note, &input.task_date)
}

#[tauri::command]
pub fn complete_task(app: tauri::AppHandle, id: String) -> Result<repositories::TaskDto, AppError> {
    let conn = open_app_connection(&app)?;
    repositories::complete_task(&conn, &id)
}

#[tauri::command]
pub fn restore_task(app: tauri::AppHandle, id: String) -> Result<repositories::TaskDto, AppError> {
    let conn = open_app_connection(&app)?;
    repositories::restore_task(&conn, &id)
}
