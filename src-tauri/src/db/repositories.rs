use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

pub use super::migrations::AppError;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct TaskDto {
    pub id: String,
    pub title: String,
    pub note: String,
    pub status: String,
    pub task_date: String,
    pub sort_order: i64,
    pub completed_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

fn row_to_task(row: &rusqlite::Row<'_>) -> rusqlite::Result<TaskDto> {
    Ok(TaskDto {
        id: row.get(0)?,
        title: row.get(1)?,
        note: row.get(2)?,
        status: row.get(3)?,
        task_date: row.get(4)?,
        sort_order: row.get(5)?,
        completed_at: row.get(6)?,
        created_at: row.get(7)?,
        updated_at: row.get(8)?,
    })
}

pub fn list_tasks(conn: &Connection, task_date: &str) -> Result<Vec<TaskDto>, AppError> {
    let mut stmt = conn.prepare(
        "
        select id, title, note, status, task_date, sort_order, completed_at, created_at, updated_at
        from tasks
        where task_date = ?1
        order by case status when 'active' then 0 else 1 end, sort_order asc, created_at asc
        ",
    )?;

    let rows = stmt.query_map(params![task_date], row_to_task)?;
    let mut tasks = Vec::new();
    for row in rows {
        tasks.push(row?);
    }
    Ok(tasks)
}

pub fn create_task(conn: &Connection, title: &str, note: &str, task_date: &str) -> Result<TaskDto, AppError> {
    let title = title.trim();
    if title.is_empty() {
        return Err(AppError::validation("Task title is required."));
    }

    let now = chrono::Utc::now().to_rfc3339();
    let sort_order: i64 = conn.query_row(
        "select coalesce(max(sort_order), -1) + 1 from tasks where task_date = ?1 and status = 'active'",
        params![task_date],
        |row| row.get(0),
    )?;

    let id = Uuid::new_v4().to_string();
    conn.execute(
        "
        insert into tasks (id, title, note, status, task_date, sort_order, completed_at, created_at, updated_at)
        values (?1, ?2, ?3, 'active', ?4, ?5, null, ?6, ?6)
        ",
        params![id, title, note, task_date, sort_order, now],
    )?;

    get_task(conn, &id)
}

pub fn get_task(conn: &Connection, id: &str) -> Result<TaskDto, AppError> {
    conn.query_row(
        "
        select id, title, note, status, task_date, sort_order, completed_at, created_at, updated_at
        from tasks where id = ?1
        ",
        params![id],
        row_to_task,
    )
    .optional()?
    .ok_or_else(|| AppError::not_found("Task was not found."))
}

pub fn update_task(conn: &Connection, id: &str, title: &str, note: &str, task_date: &str) -> Result<TaskDto, AppError> {
    let title = title.trim();
    if title.is_empty() {
        return Err(AppError::validation("Task title is required."));
    }

    let now = chrono::Utc::now().to_rfc3339();
    let changed = conn.execute(
        "update tasks set title = ?1, note = ?2, task_date = ?3, updated_at = ?4 where id = ?5",
        params![title, note, task_date, now, id],
    )?;
    if changed == 0 {
        return Err(AppError::not_found("Task was not found."));
    }
    get_task(conn, id)
}

pub fn complete_task(conn: &Connection, id: &str) -> Result<TaskDto, AppError> {
    let now = chrono::Utc::now().to_rfc3339();
    let changed = conn.execute(
        "update tasks set status = 'completed', completed_at = ?1, updated_at = ?1 where id = ?2",
        params![now, id],
    )?;
    if changed == 0 {
        return Err(AppError::not_found("Task was not found."));
    }
    get_task(conn, id)
}

pub fn restore_task(conn: &Connection, id: &str) -> Result<TaskDto, AppError> {
    let now = chrono::Utc::now().to_rfc3339();
    let changed = conn.execute(
        "update tasks set status = 'active', completed_at = null, updated_at = ?1 where id = ?2",
        params![now, id],
    )?;
    if changed == 0 {
        return Err(AppError::not_found("Task was not found."));
    }
    get_task(conn, id)
}

#[cfg(test)]
mod task_tests {
    use super::*;
    use crate::db::migrations::{run_migrations, seed_categories};
    use rusqlite::Connection;

    fn test_conn() -> Connection {
        let conn = Connection::open_in_memory().expect("open memory db");
        run_migrations(&conn).expect("migrate");
        seed_categories(&conn).expect("seed");
        conn
    }

    #[test]
    fn create_complete_and_list_tasks() {
        let conn = test_conn();

        let created = create_task(&conn, "Write migration", "", "2026-07-08").expect("create task");
        assert_eq!(created.status, "active");

        let completed = complete_task(&conn, &created.id).expect("complete task");
        assert_eq!(completed.status, "completed");
        assert!(completed.completed_at.is_some());

        let tasks = list_tasks(&conn, "2026-07-08").expect("list tasks");
        assert_eq!(tasks.len(), 1);
        assert_eq!(tasks[0].title, "Write migration");
    }

    #[test]
    fn create_task_rejects_empty_title() {
        let conn = test_conn();
        let error = create_task(&conn, "   ", "", "2026-07-08").expect_err("reject empty title");
        assert_eq!(error.code, "validation_error");
    }
}
