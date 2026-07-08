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

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct LibraryNodeDto {
    pub id: String,
    pub parent_id: Option<String>,
    pub node_type: String,
    pub category: Option<String>,
    pub title: String,
    pub sort_order: i64,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct DocumentDto {
    pub id: String,
    pub node_id: String,
    pub title: String,
    pub content: String,
    pub created_at: String,
    pub updated_at: String,
}

fn row_to_library_node(row: &rusqlite::Row<'_>) -> rusqlite::Result<LibraryNodeDto> {
    Ok(LibraryNodeDto {
        id: row.get(0)?,
        parent_id: row.get(1)?,
        node_type: row.get(2)?,
        category: row.get(3)?,
        title: row.get(4)?,
        sort_order: row.get(5)?,
        created_at: row.get(6)?,
        updated_at: row.get(7)?,
    })
}

pub fn list_library_nodes(conn: &Connection) -> Result<Vec<LibraryNodeDto>, AppError> {
    let mut stmt = conn.prepare(
        "
        select id, parent_id, node_type, category, title, sort_order, created_at, updated_at
        from library_nodes
        order by parent_id is not null, parent_id, sort_order, title
        ",
    )?;
    let rows = stmt.query_map([], row_to_library_node)?;
    let mut nodes = Vec::new();
    for row in rows {
        nodes.push(row?);
    }
    Ok(nodes)
}

pub fn create_library_folder(conn: &Connection, parent_id: &str, title: &str) -> Result<LibraryNodeDto, AppError> {
    create_library_node(conn, parent_id, "folder", title)
}

pub fn create_library_document(conn: &Connection, parent_id: &str, title: &str) -> Result<DocumentDto, AppError> {
    let node = create_library_node(conn, parent_id, "document", title)?;
    let id = Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "insert into documents (id, node_id, content, created_at, updated_at) values (?1, ?2, '', ?3, ?3)",
        params![id, node.id, now],
    )?;
    get_document(conn, &node.id)
}

fn create_library_node(conn: &Connection, parent_id: &str, node_type: &str, title: &str) -> Result<LibraryNodeDto, AppError> {
    let title = title.trim();
    if title.is_empty() {
        return Err(AppError::validation("Library title is required."));
    }

    let parent_exists: Option<String> = conn
        .query_row("select id from library_nodes where id = ?1", params![parent_id], |row| row.get(0))
        .optional()?;
    if parent_exists.is_none() {
        return Err(AppError::not_found("Parent folder was not found."));
    }

    let sort_order: i64 = conn.query_row(
        "select coalesce(max(sort_order), -1) + 1 from library_nodes where parent_id = ?1",
        params![parent_id],
        |row| row.get(0),
    )?;
    let now = chrono::Utc::now().to_rfc3339();
    let id = Uuid::new_v4().to_string();
    conn.execute(
        "
        insert into library_nodes (id, parent_id, node_type, category, title, sort_order, created_at, updated_at)
        values (?1, ?2, ?3, null, ?4, ?5, ?6, ?6)
        ",
        params![id, parent_id, node_type, title, sort_order, now],
    )?;

    get_library_node(conn, &id)
}

fn get_library_node(conn: &Connection, id: &str) -> Result<LibraryNodeDto, AppError> {
    conn.query_row(
        "
        select id, parent_id, node_type, category, title, sort_order, created_at, updated_at
        from library_nodes where id = ?1
        ",
        params![id],
        row_to_library_node,
    )
    .optional()?
    .ok_or_else(|| AppError::not_found("Library item was not found."))
}

pub fn get_document(conn: &Connection, node_id: &str) -> Result<DocumentDto, AppError> {
    conn.query_row(
        "
        select d.id, d.node_id, n.title, d.content, d.created_at, d.updated_at
        from documents d
        join library_nodes n on n.id = d.node_id
        where d.node_id = ?1
        ",
        params![node_id],
        |row| {
            Ok(DocumentDto {
                id: row.get(0)?,
                node_id: row.get(1)?,
                title: row.get(2)?,
                content: row.get(3)?,
                created_at: row.get(4)?,
                updated_at: row.get(5)?,
            })
        },
    )
    .optional()?
    .ok_or_else(|| AppError::not_found("Document was not found."))
}

pub fn save_document(conn: &Connection, node_id: &str, content: &str) -> Result<DocumentDto, AppError> {
    let now = chrono::Utc::now().to_rfc3339();
    let changed = conn.execute(
        "update documents set content = ?1, updated_at = ?2 where node_id = ?3",
        params![content, now, node_id],
    )?;
    if changed == 0 {
        return Err(AppError::not_found("Document was not found."));
    }
    conn.execute("update library_nodes set updated_at = ?1 where id = ?2", params![now, node_id])?;
    get_document(conn, node_id)
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct DailyDraftDto {
    pub id: String,
    pub draft_date: String,
    pub content: String,
    pub created_at: String,
    pub updated_at: String,
}

pub fn get_daily_draft(conn: &Connection, draft_date: &str) -> Result<DailyDraftDto, AppError> {
    match conn
        .query_row(
            "select id, draft_date, content, created_at, updated_at from daily_drafts where draft_date = ?1",
            params![draft_date],
            |row| {
                Ok(DailyDraftDto {
                    id: row.get(0)?,
                    draft_date: row.get(1)?,
                    content: row.get(2)?,
                    created_at: row.get(3)?,
                    updated_at: row.get(4)?,
                })
            },
        )
        .optional()?
    {
        Some(draft) => Ok(draft),
        None => save_daily_draft(conn, draft_date, ""),
    }
}

pub fn save_daily_draft(conn: &Connection, draft_date: &str, content: &str) -> Result<DailyDraftDto, AppError> {
    let existing = conn
        .query_row(
            "select id, created_at from daily_drafts where draft_date = ?1",
            params![draft_date],
            |row| Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?)),
        )
        .optional()?;
    let now = chrono::Utc::now().to_rfc3339();

    let id = match existing {
        Some((id, _created_at)) => {
            conn.execute(
                "update daily_drafts set content = ?1, updated_at = ?2 where id = ?3",
                params![content, now, id],
            )?;
            id
        }
        None => {
            let id = Uuid::new_v4().to_string();
            conn.execute(
                "insert into daily_drafts (id, draft_date, content, created_at, updated_at) values (?1, ?2, ?3, ?4, ?4)",
                params![id, draft_date, content, now],
            )?;
            id
        }
    };

    conn.query_row(
        "select id, draft_date, content, created_at, updated_at from daily_drafts where id = ?1",
        params![id],
        |row| {
            Ok(DailyDraftDto {
                id: row.get(0)?,
                draft_date: row.get(1)?,
                content: row.get(2)?,
                created_at: row.get(3)?,
                updated_at: row.get(4)?,
            })
        },
    )
    .map_err(AppError::from)
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct DayTraceItemDto {
    pub id: String,
    pub kind: String,
    pub title: String,
    pub occurred_at: String,
}

pub fn get_day_trace(conn: &Connection, day: &str) -> Result<Vec<DayTraceItemDto>, AppError> {
    let mut stmt = conn.prepare(
        "
        select id, kind, title, occurred_at
        from (
            select id, 'task_created' as kind, title, created_at as occurred_at
            from tasks
            where substr(created_at, 1, 10) = ?1
            union all
            select id, 'task_completed' as kind, title, completed_at as occurred_at
            from tasks
            where completed_at is not null and substr(completed_at, 1, 10) = ?1
            union all
            select n.id, 'document_updated' as kind, n.title, d.updated_at as occurred_at
            from documents d
            join library_nodes n on n.id = d.node_id
            where substr(d.updated_at, 1, 10) = ?1
            union all
            select id, 'draft_updated' as kind, 'Daily draft' as title, updated_at as occurred_at
            from daily_drafts
            where draft_date = ?1
        )
        order by occurred_at asc
        ",
    )?;

    let rows = stmt.query_map(params![day], |row| {
        Ok(DayTraceItemDto {
            id: row.get(0)?,
            kind: row.get(1)?,
            title: row.get(2)?,
            occurred_at: row.get(3)?,
        })
    })?;

    let mut items = Vec::new();
    for row in rows {
        items.push(row?);
    }
    Ok(items)
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

#[cfg(test)]
mod library_tests {
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
    fn create_folder_document_and_save_content() {
        let conn = test_conn();
        let folder = create_library_folder(&conn, "category:experience", "React").expect("create folder");
        assert_eq!(folder.node_type, "folder");

        let doc = create_library_document(&conn, &folder.id, "useEffect closure").expect("create doc");
        assert_eq!(doc.title, "useEffect closure");
        assert_eq!(doc.content, "");

        let saved = save_document(&conn, &doc.node_id, "Remember stale closure behavior.").expect("save doc");
        assert_eq!(saved.content, "Remember stale closure behavior.");
    }
}

#[cfg(test)]
mod daily_tests {
    use super::*;
    use crate::db::migrations::{run_migrations, seed_categories};
    use rusqlite::Connection;

    #[test]
    fn upserts_one_draft_per_date() {
        let conn = Connection::open_in_memory().expect("open memory db");
        run_migrations(&conn).expect("migrate");
        seed_categories(&conn).expect("seed");

        let first = save_daily_draft(&conn, "2026-07-08", "First draft").expect("save first");
        let second = save_daily_draft(&conn, "2026-07-08", "Updated draft").expect("save second");

        assert_eq!(first.id, second.id);
        assert_eq!(second.content, "Updated draft");
    }
}

#[cfg(test)]
mod day_trace_tests {
    use super::*;
    use crate::db::migrations::{run_migrations, seed_categories};
    use rusqlite::Connection;

    #[test]
    fn returns_trace_items_for_day_activity() {
        let conn = Connection::open_in_memory().expect("open memory db");
        run_migrations(&conn).expect("migrate");
        seed_categories(&conn).expect("seed");

        let task = create_task(&conn, "Fix login state", "", "2026-07-08").expect("create task");
        complete_task(&conn, &task.id).expect("complete task");
        let folder = create_library_folder(&conn, "category:experience", "Tauri").expect("create folder");
        let document = create_library_document(&conn, &folder.id, "SQLite path").expect("create document");
        save_document(&conn, &document.node_id, "Use app data dir.").expect("save document");
        save_daily_draft(&conn, "2026-07-08", "Today I wired persistence.").expect("save draft");

        let trace = get_day_trace(&conn, "2026-07-08").expect("get trace");
        let kinds: Vec<String> = trace.iter().map(|item| item.kind.clone()).collect();

        assert!(kinds.contains(&"task_created".to_string()));
        assert!(kinds.contains(&"task_completed".to_string()));
        assert!(kinds.contains(&"document_updated".to_string()));
        assert!(kinds.contains(&"draft_updated".to_string()));
    }
}
