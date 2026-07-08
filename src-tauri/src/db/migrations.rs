use rusqlite::{params, Connection};
use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct AppError {
    pub code: String,
    pub message: String,
}

impl AppError {
    pub fn database(message: impl Into<String>) -> Self {
        Self {
            code: "database_error".to_string(),
            message: message.into(),
        }
    }

    #[allow(dead_code)]
    pub fn validation(message: impl Into<String>) -> Self {
        Self {
            code: "validation_error".to_string(),
            message: message.into(),
        }
    }

    #[allow(dead_code)]
    pub fn not_found(message: impl Into<String>) -> Self {
        Self {
            code: "not_found".to_string(),
            message: message.into(),
        }
    }
}

impl std::fmt::Display for AppError {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(formatter, "{}: {}", self.code, self.message)
    }
}

impl std::error::Error for AppError {}

impl From<rusqlite::Error> for AppError {
    fn from(value: rusqlite::Error) -> Self {
        Self::database(value.to_string())
    }
}

pub const CATEGORY_KEYS: [&str; 6] = [
    "experience",
    "passwords",
    "ideas",
    "command_snippets",
    "pitfall_notes",
    "affairs",
];

pub const CATEGORY_TITLES: [&str; 6] = [
    "Experience",
    "Passwords",
    "Ideas",
    "Command snippets",
    "Pitfall notes",
    "Affairs",
];

pub fn run_migrations(conn: &Connection) -> Result<(), AppError> {
    conn.execute_batch(
        "
        create table if not exists tasks (
            id text primary key,
            title text not null,
            note text not null default '',
            status text not null check(status in ('active', 'completed')),
            task_date text not null,
            sort_order integer not null,
            completed_at text null,
            created_at text not null,
            updated_at text not null
        );

        create table if not exists library_nodes (
            id text primary key,
            parent_id text null references library_nodes(id) on delete cascade,
            node_type text not null check(node_type in ('category', 'folder', 'document')),
            category text null,
            title text not null,
            sort_order integer not null,
            created_at text not null,
            updated_at text not null
        );

        create table if not exists documents (
            id text primary key,
            node_id text not null unique references library_nodes(id) on delete cascade,
            content text not null default '',
            created_at text not null,
            updated_at text not null
        );

        create table if not exists daily_drafts (
            id text primary key,
            draft_date text not null unique,
            content text not null default '',
            created_at text not null,
            updated_at text not null
        );

        create table if not exists tags (
            id text primary key,
            name text not null unique,
            created_at text not null
        );

        create table if not exists document_tags (
            document_id text not null references documents(id) on delete cascade,
            tag_id text not null references tags(id) on delete cascade,
            primary key (document_id, tag_id)
        );

        create index if not exists idx_tasks_date on tasks(task_date);
        create index if not exists idx_tasks_completed_at on tasks(completed_at);
        create index if not exists idx_library_parent on library_nodes(parent_id);
        create index if not exists idx_daily_drafts_date on daily_drafts(draft_date);
        ",
    )?;

    Ok(())
}

pub fn seed_categories(conn: &Connection) -> Result<(), AppError> {
    let now = chrono::Utc::now().to_rfc3339();

    for (index, key) in CATEGORY_KEYS.iter().enumerate() {
        let title = CATEGORY_TITLES[index];
        conn.execute(
            "
            insert into library_nodes (id, parent_id, node_type, category, title, sort_order, created_at, updated_at)
            values (?1, null, 'category', ?2, ?3, ?4, ?5, ?5)
            on conflict(id) do nothing
            ",
            params![format!("category:{key}"), key, title, index as i64, now],
        )?;
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn migrations_create_tables_and_seed_categories() {
        let conn = Connection::open_in_memory().expect("open memory db");

        run_migrations(&conn).expect("run migrations");
        seed_categories(&conn).expect("seed categories");

        let count: i64 = conn
            .query_row(
                "select count(*) from library_nodes where node_type = 'category'",
                [],
                |row| row.get(0),
            )
            .expect("count categories");

        assert_eq!(count, 6);

        let passwords: String = conn
            .query_row(
                "select title from library_nodes where category = 'passwords'",
                [],
                |row| row.get(0),
            )
            .expect("passwords category");

        assert_eq!(passwords, "Passwords");
    }
}
