use serde::Deserialize;

use crate::db::{connection::open_app_connection, migrations::AppError, repositories};

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateLibraryNodeInput {
    pub parent_id: String,
    pub title: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveDocumentInput {
    pub node_id: String,
    pub content: String,
}

#[tauri::command]
pub fn list_library_nodes(app: tauri::AppHandle) -> Result<Vec<repositories::LibraryNodeDto>, AppError> {
    let conn = open_app_connection(&app)?;
    repositories::list_library_nodes(&conn)
}

#[tauri::command]
pub fn create_library_folder(
    app: tauri::AppHandle,
    input: CreateLibraryNodeInput,
) -> Result<repositories::LibraryNodeDto, AppError> {
    let conn = open_app_connection(&app)?;
    repositories::create_library_folder(&conn, &input.parent_id, &input.title)
}

#[tauri::command]
pub fn create_library_document(
    app: tauri::AppHandle,
    input: CreateLibraryNodeInput,
) -> Result<repositories::DocumentDto, AppError> {
    let conn = open_app_connection(&app)?;
    repositories::create_library_document(&conn, &input.parent_id, &input.title)
}

#[tauri::command]
pub fn get_document(app: tauri::AppHandle, node_id: String) -> Result<repositories::DocumentDto, AppError> {
    let conn = open_app_connection(&app)?;
    repositories::get_document(&conn, &node_id)
}

#[tauri::command]
pub fn save_document(app: tauri::AppHandle, input: SaveDocumentInput) -> Result<repositories::DocumentDto, AppError> {
    let conn = open_app_connection(&app)?;
    repositories::save_document(&conn, &input.node_id, &input.content)
}

#[tauri::command]
pub fn delete_library_node(app: tauri::AppHandle, node_id: String) -> Result<(), AppError> {
    let conn = open_app_connection(&app)?;
    repositories::delete_library_node(&conn, &node_id)
}
