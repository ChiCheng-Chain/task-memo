# Task Memo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first local-only Windows desktop version of Task Memo with Today tasks, a virtual SQLite-backed Library, date review, editable daily drafts, basic search, tray, and a global shortcut.

**Architecture:** Use a Tauri desktop backend as the persistence and OS-integration boundary, with a React TypeScript frontend for the three-zone workbench UI. SQLite is accessed only from Rust repositories exposed through typed Tauri commands.

**Tech Stack:** Tauri, Rust, rusqlite with bundled SQLite, React, TypeScript, Vite, Vitest, Testing Library, lucide-react, CSS tokens.

## Global Constraints

- The first version is local-only, single-user, and optimized for fast manual capture.
- The app does not need accounts, sync, encryption, collaboration, or AI summarization.
- The Library uses a virtual file system backed by SQLite.
- The Library does not encrypt, hide, or specially mark password content.
- The default screen is Today.
- Completed tasks remain visible for daily review instead of disappearing.
- Daily drafts are plain Markdown text saved locally.
- Version one tray behavior is open or focus the main window, and quit the app.
- Version one global shortcut behavior is open or focus the main window.
- Basic search starts with SQLite `LIKE` queries.
- UI should feel like a quiet developer workbench, not a generic admin dashboard and not a flashy productivity landing page.
- Visual tokens: Canvas `#F7F5EF`, Ink `#24221F`, Rail `#2F3437`, Line `#D8D2C6`, Action `#2F7D6D`, Warn `#B95C3A`, Code `#E9E2D4`.
- Use stable internal category keys in English and display localized labels in the frontend.

---

## File Structure

Create the application in the repository root.

```text
package.json
index.html
vite.config.ts
vitest.config.ts
tsconfig.json
src/
  main.tsx
  app/
    App.tsx
    routes.ts
    api.ts
    types.ts
  pages/
    Today.tsx
    Library.tsx
    DayView.tsx
    DailyDraft.tsx
    Search.tsx
  components/
    AppRail.tsx
    TaskList.tsx
    TaskEditor.tsx
    LibraryTree.tsx
    MarkdownEditor.tsx
    DayTimeline.tsx
    SearchBar.tsx
  styles/
    tokens.css
    app.css
  test/
    setup.ts
src-tauri/
  Cargo.toml
  tauri.conf.json
  build.rs
  src/
    main.rs
    commands/
      mod.rs
      tasks.rs
      library.rs
      daily.rs
      search.rs
    db/
      mod.rs
      connection.rs
      migrations.rs
      repositories.rs
    tray.rs
    shortcuts.rs
```

Backend responsibility:

- `db/connection.rs`: open the app SQLite database.
- `db/migrations.rs`: create schema and seed category nodes.
- `db/repositories.rs`: CRUD and query functions.
- `commands/*.rs`: serializable Tauri command inputs and outputs.
- `tray.rs`: system tray setup.
- `shortcuts.rs`: global shortcut setup.

Frontend responsibility:

- `app/api.ts`: typed wrappers around `invoke`.
- `app/types.ts`: frontend DTOs matching backend command outputs.
- `pages/*`: route-level workbench screens.
- `components/*`: reusable focused UI pieces.
- `styles/tokens.css`: design tokens.
- `styles/app.css`: layout and component styling.

---

### Task 1: Scaffold Tauri, React, TypeScript, And Test Harness

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `vite.config.ts`
- Create: `vitest.config.ts`
- Create: `tsconfig.json`
- Create: `src/main.tsx`
- Create: `src/app/App.tsx`
- Create: `src/app/routes.ts`
- Create: `src/styles/tokens.css`
- Create: `src/styles/app.css`
- Create: `src/test/setup.ts`
- Create: `src-tauri/Cargo.toml`
- Create: `src-tauri/tauri.conf.json`
- Create: `src-tauri/build.rs`
- Create: `src-tauri/src/main.rs`

**Interfaces:**
- Produces: React app mounted at `#root`.
- Produces: `App` component exported from `src/app/App.tsx`.
- Produces: Tauri app entrypoint in `src-tauri/src/main.rs`.

- [ ] **Step 1: Create the Tauri React TypeScript scaffold**

Run:

```powershell
npm create tauri-app@latest . -- --template react-ts
```

Expected: The repository contains `package.json`, `src/`, and `src-tauri/`. If the generator asks about package manager, select `npm`.

- [ ] **Step 2: Install frontend dependencies**

Run:

```powershell
npm install react-router-dom lucide-react
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

Expected: `package-lock.json` is updated and installation exits with code 0.

- [ ] **Step 3: Configure test scripts**

Modify `package.json` so the scripts include:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "tauri": "tauri",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

Keep any generated Tauri scripts that are still needed, but these script names must exist.

- [ ] **Step 4: Add Vitest config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
  },
});
```

Create `src/test/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 5: Add design tokens**

Create `src/styles/tokens.css`:

```css
:root {
  --color-canvas: #f7f5ef;
  --color-ink: #24221f;
  --color-rail: #2f3437;
  --color-line: #d8d2c6;
  --color-action: #2f7d6d;
  --color-warn: #b95c3a;
  --color-code: #e9e2d4;
  --font-interface: Inter, "Segoe UI", "Microsoft YaHei UI", sans-serif;
  --font-code: "JetBrains Mono", "Cascadia Code", monospace;
  color: var(--color-ink);
  background: var(--color-canvas);
  font-family: var(--font-interface);
}
```

- [ ] **Step 6: Replace starter app with route shell**

Create `src/app/routes.ts`:

```ts
export const routes = {
  today: "/today",
  library: "/library",
  day: "/day",
  draft: "/draft",
  search: "/search",
} as const;
```

Create `src/app/App.tsx`:

```tsx
import "../styles/tokens.css";
import "../styles/app.css";

export function App() {
  return (
    <main className="app-shell">
      <aside className="app-rail" aria-label="Primary">
        <div className="rail-mark">TM</div>
        <button className="rail-item rail-item-active">Today</button>
        <button className="rail-item">Library</button>
        <button className="rail-item">Dates</button>
        <button className="rail-item">Search</button>
      </aside>
      <section className="workbench">
        <header className="workbench-header">
          <p className="eyebrow">Task Memo</p>
          <h1>Today</h1>
        </header>
        <div className="empty-state">Ready to capture the next action.</div>
      </section>
      <aside className="inspector" aria-label="Inspector">
        <p className="eyebrow">Inspector</p>
      </aside>
    </main>
  );
}
```

Create `src/main.tsx`:

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./app/App";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

Create `src/styles/app.css`:

```css
* {
  box-sizing: border-box;
}

html,
body,
#root {
  min-height: 100%;
  margin: 0;
}

button,
input,
textarea {
  font: inherit;
}

.app-shell {
  display: grid;
  min-height: 100vh;
  grid-template-columns: 76px minmax(420px, 1fr) minmax(280px, 34vw);
  background: var(--color-canvas);
}

.app-rail {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 10px;
  color: #f8f4ec;
  background: var(--color-rail);
}

.rail-mark {
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  margin: 0 auto 12px;
  border: 1px solid rgb(255 255 255 / 18%);
  font-family: var(--font-code);
  font-size: 13px;
}

.rail-item {
  min-height: 40px;
  border: 0;
  color: rgb(255 255 255 / 72%);
  background: transparent;
  cursor: pointer;
}

.rail-item-active,
.rail-item:focus-visible {
  color: #fff;
  outline: 2px solid var(--color-action);
  outline-offset: 2px;
}

.workbench {
  min-width: 0;
  padding: 24px 28px;
  border-right: 1px solid var(--color-line);
}

.workbench-header {
  display: flex;
  align-items: end;
  justify-content: space-between;
  margin-bottom: 28px;
}

.workbench-header h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 650;
}

.eyebrow {
  margin: 0 0 6px;
  color: rgb(36 34 31 / 64%);
  font-family: var(--font-code);
  font-size: 12px;
}

.empty-state {
  padding: 18px 0;
  border-top: 1px solid var(--color-line);
  border-bottom: 1px solid var(--color-line);
}

.inspector {
  min-width: 0;
  padding: 24px;
  background: rgb(255 255 255 / 28%);
}
```

- [ ] **Step 7: Verify frontend shell**

Run:

```powershell
npm test
npm run build
```

Expected: `npm test` exits with code 0 even with no tests found or with the generated starter tests passing. `npm run build` exits with code 0.

- [ ] **Step 8: Verify Tauri shell compiles**

Run:

```powershell
npm run tauri build
```

Expected: Rust and frontend build succeed. If Windows prerequisites are missing, record the missing prerequisite message and run `npm run build` as the minimum verification for this task.

- [ ] **Step 9: Commit**

Run:

```powershell
git add package.json package-lock.json index.html vite.config.ts vitest.config.ts tsconfig.json src src-tauri
git commit -m "chore: scaffold desktop app"
```

Expected: A commit is created containing the app scaffold.

---

### Task 2: Add SQLite Connection, Migrations, Seed Categories, And Repository Test Base

**Files:**
- Modify: `src-tauri/Cargo.toml`
- Create: `src-tauri/src/db/mod.rs`
- Create: `src-tauri/src/db/connection.rs`
- Create: `src-tauri/src/db/migrations.rs`
- Create: `src-tauri/src/db/repositories.rs`
- Modify: `src-tauri/src/main.rs`

**Interfaces:**
- Produces: `db::connection::open_app_connection(app_handle: &tauri::AppHandle) -> Result<rusqlite::Connection, AppError>`
- Produces: `db::migrations::run_migrations(conn: &rusqlite::Connection) -> Result<(), AppError>`
- Produces: `db::repositories::seed_categories(conn: &rusqlite::Connection) -> Result<(), AppError>`
- Produces: `AppError { code: String, message: String }`

- [ ] **Step 1: Add Rust dependencies**

Modify `src-tauri/Cargo.toml` dependencies:

```toml
[dependencies]
tauri = { version = "2", features = ["tray-icon"] }
tauri-plugin-opener = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
rusqlite = { version = "0.32", features = ["bundled"] }
uuid = { version = "1", features = ["v4", "serde"] }
chrono = { version = "0.4", features = ["serde"] }
thiserror = "1"
```

Keep any generated dependency entries required by the scaffold.

- [ ] **Step 2: Write the migration test first**

Create `src-tauri/src/db/migrations.rs` with this test module and empty functions that make the compiler fail until implemented:

```rust
use rusqlite::Connection;
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
}

pub fn run_migrations(_conn: &Connection) -> Result<(), AppError> {
    unimplemented!("run_migrations is implemented in this task");
}

pub fn seed_categories(_conn: &Connection) -> Result<(), AppError> {
    unimplemented!("seed_categories is implemented in this task");
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
            .query_row("select count(*) from library_nodes where node_type = 'category'", [], |row| {
                row.get(0)
            })
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
```

- [ ] **Step 3: Run test to verify it fails**

Run:

```powershell
cd src-tauri
cargo test db::migrations::tests::migrations_create_tables_and_seed_categories
```

Expected: FAIL because `run_migrations` is not implemented.

- [ ] **Step 4: Implement migrations and seed categories**

Replace `src-tauri/src/db/migrations.rs` with:

```rust
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

    pub fn validation(message: impl Into<String>) -> Self {
        Self {
            code: "validation_error".to_string(),
            message: message.into(),
        }
    }

    pub fn not_found(message: impl Into<String>) -> Self {
        Self {
            code: "not_found".to_string(),
            message: message.into(),
        }
    }
}

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
            .query_row("select count(*) from library_nodes where node_type = 'category'", [], |row| {
                row.get(0)
            })
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
```

- [ ] **Step 5: Create db module and connection**

Create `src-tauri/src/db/mod.rs`:

```rust
pub mod connection;
pub mod migrations;
pub mod repositories;
```

Create `src-tauri/src/db/connection.rs`:

```rust
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
```

Create `src-tauri/src/db/repositories.rs`:

```rust
pub use super::migrations::AppError;
```

- [ ] **Step 6: Wire migrations into app setup**

Modify `src-tauri/src/main.rs`:

```rust
mod db;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let conn = db::connection::open_app_connection(app.handle())?;
            db::migrations::run_migrations(&conn)?;
            db::migrations::seed_categories(&conn)?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

If the generated `main.rs` uses `run()` from `lib.rs`, keep the generated split and place the same setup in the builder function.

- [ ] **Step 7: Run tests**

Run:

```powershell
cd src-tauri
cargo test db::migrations::tests::migrations_create_tables_and_seed_categories
```

Expected: PASS.

- [ ] **Step 8: Commit**

Run:

```powershell
git add src-tauri
git commit -m "feat: add sqlite schema"
```

Expected: A commit is created containing SQLite connection and migrations.

---

### Task 3: Implement Task Repository, Commands, API Wrapper, And Today View

**Files:**
- Modify: `src-tauri/src/db/repositories.rs`
- Create: `src-tauri/src/commands/mod.rs`
- Create: `src-tauri/src/commands/tasks.rs`
- Modify: `src-tauri/src/main.rs`
- Create: `src/app/types.ts`
- Create: `src/app/api.ts`
- Create: `src/components/TaskList.tsx`
- Create: `src/components/TaskEditor.tsx`
- Create: `src/pages/Today.tsx`
- Modify: `src/app/App.tsx`
- Modify: `src/styles/app.css`

**Interfaces:**
- Produces backend command: `list_tasks(task_date: String) -> Result<Vec<TaskDto>, AppError>`
- Produces backend command: `create_task(input: CreateTaskInput) -> Result<TaskDto, AppError>`
- Produces backend command: `update_task(input: UpdateTaskInput) -> Result<TaskDto, AppError>`
- Produces backend command: `complete_task(id: String) -> Result<TaskDto, AppError>`
- Produces backend command: `restore_task(id: String) -> Result<TaskDto, AppError>`
- Produces frontend API: `taskApi.list(date: string): Promise<Task[]>`
- Produces frontend API: `taskApi.create(input: CreateTaskInput): Promise<Task>`

- [ ] **Step 1: Write repository tests**

Add this test module to `src-tauri/src/db/repositories.rs`:

```rust
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
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
cd src-tauri
cargo test task_tests
```

Expected: FAIL because task repository functions and `TaskDto` are missing.

- [ ] **Step 3: Implement task repository functions**

Add to `src-tauri/src/db/repositories.rs`:

```rust
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
```

- [ ] **Step 4: Run repository tests**

Run:

```powershell
cd src-tauri
cargo test task_tests
```

Expected: PASS.

- [ ] **Step 5: Add Tauri task commands**

Create `src-tauri/src/commands/mod.rs`:

```rust
pub mod tasks;
```

Create `src-tauri/src/commands/tasks.rs`:

```rust
use serde::Deserialize;
use tauri::Manager;

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
```

Register handlers in `src-tauri/src/main.rs`:

```rust
mod commands;
mod db;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::tasks::list_tasks,
            commands::tasks::create_task,
            commands::tasks::update_task,
            commands::tasks::complete_task,
            commands::tasks::restore_task,
        ])
        .setup(|app| {
            let conn = db::connection::open_app_connection(app.handle())?;
            db::migrations::run_migrations(&conn)?;
            db::migrations::seed_categories(&conn)?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

- [ ] **Step 6: Add frontend types and API wrapper**

Create `src/app/types.ts`:

```ts
export type TaskStatus = "active" | "completed";

export interface Task {
  id: string;
  title: string;
  note: string;
  status: TaskStatus;
  taskDate: string;
  sortOrder: number;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskInput {
  title: string;
  note: string;
  taskDate: string;
}
```

Create `src/app/api.ts`:

```ts
import { invoke } from "@tauri-apps/api/core";
import type { CreateTaskInput, Task } from "./types";

export const taskApi = {
  list(taskDate: string) {
    return invoke<Task[]>("list_tasks", { taskDate });
  },
  create(input: CreateTaskInput) {
    return invoke<Task>("create_task", { input });
  },
  complete(id: string) {
    return invoke<Task>("complete_task", { id });
  },
  restore(id: string) {
    return invoke<Task>("restore_task", { id });
  },
};

export function todayKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}
```

- [ ] **Step 7: Write Today component tests**

Create `src/pages/Today.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Today } from "./Today";
import type { Task } from "../app/types";

const tasks: Task[] = [
  {
    id: "1",
    title: "Wire SQLite",
    note: "",
    status: "active",
    taskDate: "2026-07-08",
    sortOrder: 0,
    completedAt: null,
    createdAt: "2026-07-08T01:00:00Z",
    updatedAt: "2026-07-08T01:00:00Z",
  },
];

describe("Today", () => {
  it("renders active tasks and creates a new task", async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn();

    render(<Today date="2026-07-08" tasks={tasks} onCreate={onCreate} onComplete={vi.fn()} onRestore={vi.fn()} />);

    expect(screen.getByText("Wire SQLite")).toBeInTheDocument();

    await user.type(screen.getByLabelText("New task"), "Build Today view");
    await user.click(screen.getByRole("button", { name: "Add task" }));

    expect(onCreate).toHaveBeenCalledWith("Build Today view");
  });
});
```

- [ ] **Step 8: Implement Today components**

Create `src/components/TaskList.tsx`:

```tsx
import { Check, RotateCcw } from "lucide-react";
import type { Task } from "../app/types";

interface TaskListProps {
  tasks: Task[];
  onComplete: (id: string) => void;
  onRestore: (id: string) => void;
}

export function TaskList({ tasks, onComplete, onRestore }: TaskListProps) {
  return (
    <div className="task-list">
      {tasks.map((task) => (
        <article className={`task-row task-row-${task.status}`} key={task.id}>
          <button
            className="icon-button"
            aria-label={task.status === "active" ? `Complete ${task.title}` : `Restore ${task.title}`}
            onClick={() => (task.status === "active" ? onComplete(task.id) : onRestore(task.id))}
          >
            {task.status === "active" ? <Check size={16} /> : <RotateCcw size={16} />}
          </button>
          <div>
            <p className="task-title">{task.title}</p>
            {task.note ? <p className="task-note">{task.note}</p> : null}
          </div>
        </article>
      ))}
    </div>
  );
}
```

Create `src/components/TaskEditor.tsx`:

```tsx
import { Plus } from "lucide-react";
import { FormEvent, useState } from "react";

interface TaskEditorProps {
  onCreate: (title: string) => void;
}

export function TaskEditor({ onCreate }: TaskEditorProps) {
  const [title, setTitle] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onCreate(trimmed);
    setTitle("");
  }

  return (
    <form className="task-editor" onSubmit={submit}>
      <input aria-label="New task" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Capture next action" />
      <button type="submit">
        <Plus size={16} />
        Add task
      </button>
    </form>
  );
}
```

Create `src/pages/Today.tsx`:

```tsx
import { TaskEditor } from "../components/TaskEditor";
import { TaskList } from "../components/TaskList";
import type { Task } from "../app/types";

interface TodayProps {
  date: string;
  tasks: Task[];
  onCreate: (title: string) => void;
  onComplete: (id: string) => void;
  onRestore: (id: string) => void;
}

export function Today({ date, tasks, onCreate, onComplete, onRestore }: TodayProps) {
  return (
    <section>
      <header className="workbench-header">
        <div>
          <p className="eyebrow">{date}</p>
          <h1>Today</h1>
        </div>
      </header>
      <TaskEditor onCreate={onCreate} />
      <TaskList tasks={tasks} onComplete={onComplete} onRestore={onRestore} />
    </section>
  );
}
```

- [ ] **Step 9: Wire Today view to API in App**

Modify `src/app/App.tsx` to load and mutate tasks:

```tsx
import { useEffect, useState } from "react";
import { taskApi, todayKey } from "./api";
import type { Task } from "./types";
import { Today } from "../pages/Today";
import "../styles/tokens.css";
import "../styles/app.css";

export function App() {
  const [date] = useState(todayKey());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setTasks(await taskApi.list(date));
  }

  useEffect(() => {
    refresh().catch(() => setError("Could not load today's tasks."));
  }, [date]);

  async function createTask(title: string) {
    await taskApi.create({ title, note: "", taskDate: date });
    await refresh();
  }

  async function completeTask(id: string) {
    await taskApi.complete(id);
    await refresh();
  }

  async function restoreTask(id: string) {
    await taskApi.restore(id);
    await refresh();
  }

  return (
    <main className="app-shell">
      <aside className="app-rail" aria-label="Primary">
        <div className="rail-mark">TM</div>
        <button className="rail-item rail-item-active">Today</button>
        <button className="rail-item">Library</button>
        <button className="rail-item">Dates</button>
        <button className="rail-item">Search</button>
      </aside>
      <section className="workbench">
        {error ? <p className="error-text">{error}</p> : null}
        <Today date={date} tasks={tasks} onCreate={createTask} onComplete={completeTask} onRestore={restoreTask} />
      </section>
      <aside className="inspector" aria-label="Inspector">
        <p className="eyebrow">Inspector</p>
      </aside>
    </main>
  );
}
```

- [ ] **Step 10: Add task styles**

Append to `src/styles/app.css`:

```css
.task-editor {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  margin-bottom: 18px;
}

.task-editor input {
  min-height: 42px;
  border: 1px solid var(--color-line);
  background: rgb(255 255 255 / 52%);
  padding: 0 12px;
}

.task-editor button,
.icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid var(--color-line);
  color: var(--color-ink);
  background: rgb(255 255 255 / 44%);
  cursor: pointer;
}

.task-editor button {
  min-height: 42px;
  padding: 0 14px;
}

.task-list {
  display: grid;
  gap: 2px;
}

.task-row {
  display: grid;
  grid-template-columns: 36px 1fr;
  gap: 10px;
  align-items: start;
  min-height: 48px;
  padding: 8px 0;
  border-top: 1px solid var(--color-line);
}

.task-row-completed {
  color: rgb(36 34 31 / 48%);
}

.task-title,
.task-note {
  margin: 0;
}

.task-note {
  margin-top: 4px;
  font-size: 13px;
  color: rgb(36 34 31 / 62%);
}

.error-text {
  color: var(--color-warn);
}
```

- [ ] **Step 11: Run tests and builds**

Run:

```powershell
npm test
npm run build
cd src-tauri
cargo test task_tests
```

Expected: all commands pass.

- [ ] **Step 12: Commit**

Run:

```powershell
git add src src-tauri package.json package-lock.json
git commit -m "feat: add today tasks"
```

Expected: A commit is created containing Today task functionality.

---

### Task 4: Implement Library Tree, Documents, And Markdown Editor

**Files:**
- Modify: `src-tauri/src/db/repositories.rs`
- Create: `src-tauri/src/commands/library.rs`
- Modify: `src-tauri/src/commands/mod.rs`
- Modify: `src-tauri/src/main.rs`
- Modify: `src/app/types.ts`
- Modify: `src/app/api.ts`
- Create: `src/components/LibraryTree.tsx`
- Create: `src/components/MarkdownEditor.tsx`
- Create: `src/pages/Library.tsx`
- Modify: `src/app/App.tsx`
- Modify: `src/styles/app.css`

**Interfaces:**
- Produces backend command: `list_library_nodes() -> Result<Vec<LibraryNodeDto>, AppError>`
- Produces backend command: `create_library_folder(input: CreateLibraryNodeInput) -> Result<LibraryNodeDto, AppError>`
- Produces backend command: `create_library_document(input: CreateLibraryNodeInput) -> Result<DocumentDto, AppError>`
- Produces backend command: `get_document(node_id: String) -> Result<DocumentDto, AppError>`
- Produces backend command: `save_document(input: SaveDocumentInput) -> Result<DocumentDto, AppError>`

- [ ] **Step 1: Write repository tests**

Add to `src-tauri/src/db/repositories.rs`:

```rust
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
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
cd src-tauri
cargo test library_tests
```

Expected: FAIL because library repository functions and DTOs are missing.

- [ ] **Step 3: Implement library repository DTOs and functions**

Add to `src-tauri/src/db/repositories.rs`:

```rust
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
```

- [ ] **Step 4: Run repository tests**

Run:

```powershell
cd src-tauri
cargo test library_tests
```

Expected: PASS.

- [ ] **Step 5: Add library commands and register them**

Create `src-tauri/src/commands/library.rs` with command structs and functions matching the interfaces:

```rust
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
pub fn create_library_folder(app: tauri::AppHandle, input: CreateLibraryNodeInput) -> Result<repositories::LibraryNodeDto, AppError> {
    let conn = open_app_connection(&app)?;
    repositories::create_library_folder(&conn, &input.parent_id, &input.title)
}

#[tauri::command]
pub fn create_library_document(app: tauri::AppHandle, input: CreateLibraryNodeInput) -> Result<repositories::DocumentDto, AppError> {
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
```

Modify `src-tauri/src/commands/mod.rs`:

```rust
pub mod library;
pub mod tasks;
```

Register these commands in `src-tauri/src/main.rs` inside `generate_handler!`.

- [ ] **Step 6: Add frontend library types and API**

Append to `src/app/types.ts`:

```ts
export type LibraryNodeType = "category" | "folder" | "document";

export interface LibraryNode {
  id: string;
  parentId: string | null;
  nodeType: LibraryNodeType;
  category: string | null;
  title: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentRecord {
  id: string;
  nodeId: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}
```

Append to `src/app/api.ts`:

```ts
import type { DocumentRecord, LibraryNode } from "./types";

export const libraryApi = {
  listNodes() {
    return invoke<LibraryNode[]>("list_library_nodes");
  },
  createFolder(parentId: string, title: string) {
    return invoke<LibraryNode>("create_library_folder", { input: { parentId, title } });
  },
  createDocument(parentId: string, title: string) {
    return invoke<DocumentRecord>("create_library_document", { input: { parentId, title } });
  },
  getDocument(nodeId: string) {
    return invoke<DocumentRecord>("get_document", { nodeId });
  },
  saveDocument(nodeId: string, content: string) {
    return invoke<DocumentRecord>("save_document", { input: { nodeId, content } });
  },
};
```

- [ ] **Step 7: Implement LibraryTree and MarkdownEditor**

Create `src/components/LibraryTree.tsx`:

```tsx
import { FileText, Folder, Library as LibraryIcon } from "lucide-react";
import type { LibraryNode } from "../app/types";

interface LibraryTreeProps {
  nodes: LibraryNode[];
  selectedNodeId: string | null;
  onSelectDocument: (nodeId: string) => void;
}

export function LibraryTree({ nodes, selectedNodeId, onSelectDocument }: LibraryTreeProps) {
  const byParent = new Map<string | null, LibraryNode[]>();
  for (const node of nodes) {
    const key = node.parentId ?? null;
    byParent.set(key, [...(byParent.get(key) ?? []), node]);
  }

  function renderNodes(parentId: string | null, depth = 0) {
    return (byParent.get(parentId) ?? []).map((node) => (
      <div key={node.id}>
        <button
          className={`tree-node ${selectedNodeId === node.id ? "tree-node-active" : ""}`}
          style={{ paddingLeft: 10 + depth * 16 }}
          onClick={() => node.nodeType === "document" && onSelectDocument(node.id)}
        >
          {node.nodeType === "category" ? <LibraryIcon size={15} /> : node.nodeType === "folder" ? <Folder size={15} /> : <FileText size={15} />}
          <span>{node.title}</span>
        </button>
        {node.nodeType !== "document" ? renderNodes(node.id, depth + 1) : null}
      </div>
    ));
  }

  return <nav className="library-tree">{renderNodes(null)}</nav>;
}
```

Create `src/components/MarkdownEditor.tsx`:

```tsx
interface MarkdownEditorProps {
  title: string;
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
}

export function MarkdownEditor({ title, value, onChange, onSave }: MarkdownEditorProps) {
  return (
    <section className="markdown-editor">
      <header className="editor-header">
        <h2>{title}</h2>
        <button onClick={onSave}>Save changes</button>
      </header>
      <textarea aria-label="Markdown content" value={value} onChange={(event) => onChange(event.target.value)} />
    </section>
  );
}
```

- [ ] **Step 8: Implement Library page and wire navigation**

Create `src/pages/Library.tsx`:

```tsx
import { useEffect, useState } from "react";
import { libraryApi } from "../app/api";
import type { DocumentRecord, LibraryNode } from "../app/types";
import { LibraryTree } from "../components/LibraryTree";
import { MarkdownEditor } from "../components/MarkdownEditor";

export function Library() {
  const [nodes, setNodes] = useState<LibraryNode[]>([]);
  const [document, setDocument] = useState<DocumentRecord | null>(null);
  const [content, setContent] = useState("");

  async function loadNodes() {
    setNodes(await libraryApi.listNodes());
  }

  useEffect(() => {
    loadNodes();
  }, []);

  async function selectDocument(nodeId: string) {
    const next = await libraryApi.getDocument(nodeId);
    setDocument(next);
    setContent(next.content);
  }

  async function saveDocument() {
    if (!document) return;
    const saved = await libraryApi.saveDocument(document.nodeId, content);
    setDocument(saved);
    setContent(saved.content);
    await loadNodes();
  }

  return (
    <section className="library-layout">
      <LibraryTree nodes={nodes} selectedNodeId={document?.nodeId ?? null} onSelectDocument={selectDocument} />
      {document ? (
        <MarkdownEditor title={document.title} value={content} onChange={setContent} onSave={saveDocument} />
      ) : (
        <div className="empty-state">Select a document from the library.</div>
      )}
    </section>
  );
}
```

Update `App.tsx` with simple `activeView` state so the rail can switch between `Today` and `Library`.

- [ ] **Step 9: Add library styles**

Append styles for `.library-layout`, `.library-tree`, `.tree-node`, `.tree-node-active`, `.markdown-editor`, `.editor-header`, and `.markdown-editor textarea` using the existing tokens. Keep tree rows at a stable height of at least `32px`.

- [ ] **Step 10: Run verification**

Run:

```powershell
npm test
npm run build
cd src-tauri
cargo test library_tests
```

Expected: all commands pass.

- [ ] **Step 11: Commit**

Run:

```powershell
git add src src-tauri
git commit -m "feat: add library documents"
```

Expected: A commit is created containing Library functionality.

---

### Task 5: Implement Daily Draft Storage And Editor

**Files:**
- Modify: `src-tauri/src/db/repositories.rs`
- Create: `src-tauri/src/commands/daily.rs`
- Modify: `src-tauri/src/commands/mod.rs`
- Modify: `src-tauri/src/main.rs`
- Modify: `src/app/types.ts`
- Modify: `src/app/api.ts`
- Create: `src/pages/DailyDraft.tsx`
- Modify: `src/app/App.tsx`

**Interfaces:**
- Produces backend command: `get_daily_draft(draft_date: String) -> Result<DailyDraftDto, AppError>`
- Produces backend command: `save_daily_draft(input: SaveDailyDraftInput) -> Result<DailyDraftDto, AppError>`
- Produces frontend API: `dailyApi.getDraft(date: string): Promise<DailyDraft>`
- Produces frontend API: `dailyApi.saveDraft(date: string, content: string): Promise<DailyDraft>`

- [ ] **Step 1: Write repository test**

Add to `src-tauri/src/db/repositories.rs`:

```rust
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
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
cd src-tauri
cargo test daily_tests
```

Expected: FAIL because daily draft functions and DTO are missing.

- [ ] **Step 3: Implement repository functions**

Add to `src-tauri/src/db/repositories.rs`:

```rust
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
        .query_row("select id, created_at from daily_drafts where draft_date = ?1", params![draft_date], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
        })
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
```

- [ ] **Step 4: Add daily commands and register them**

Create `src-tauri/src/commands/daily.rs`:

```rust
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
pub fn save_daily_draft(app: tauri::AppHandle, input: SaveDailyDraftInput) -> Result<repositories::DailyDraftDto, AppError> {
    let conn = open_app_connection(&app)?;
    repositories::save_daily_draft(&conn, &input.draft_date, &input.content)
}
```

Register the module and handlers.

- [ ] **Step 5: Add frontend draft types and page**

Append to `src/app/types.ts`:

```ts
export interface DailyDraft {
  id: string;
  draftDate: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}
```

Append to `src/app/api.ts`:

```ts
import type { DailyDraft } from "./types";

export const dailyApi = {
  getDraft(draftDate: string) {
    return invoke<DailyDraft>("get_daily_draft", { draftDate });
  },
  saveDraft(draftDate: string, content: string) {
    return invoke<DailyDraft>("save_daily_draft", { input: { draftDate, content } });
  },
};
```

Create `src/pages/DailyDraft.tsx` using `MarkdownEditor` with `dailyApi.getDraft` and `dailyApi.saveDraft`.

- [ ] **Step 6: Add draft navigation**

Update `App.tsx` rail to include a Draft view. Use the current selected date from `todayKey()` for version one.

- [ ] **Step 7: Run verification**

Run:

```powershell
npm test
npm run build
cd src-tauri
cargo test daily_tests
```

Expected: all commands pass.

- [ ] **Step 8: Commit**

Run:

```powershell
git add src src-tauri
git commit -m "feat: add daily drafts"
```

Expected: A commit is created containing daily draft functionality.

---

### Task 6: Implement Day View Work Trace

**Files:**
- Modify: `src-tauri/src/db/repositories.rs`
- Create: `src-tauri/src/commands/search.rs` or extend with `day.rs` if preferred
- Modify: `src-tauri/src/commands/mod.rs`
- Modify: `src-tauri/src/main.rs`
- Modify: `src/app/types.ts`
- Modify: `src/app/api.ts`
- Create: `src/components/DayTimeline.tsx`
- Create: `src/pages/DayView.tsx`
- Modify: `src/app/App.tsx`
- Modify: `src/styles/app.css`

**Interfaces:**
- Produces backend command: `get_day_trace(day: String) -> Result<Vec<DayTraceItemDto>, AppError>`
- Produces frontend API: `dayApi.trace(day: string): Promise<DayTraceItem[]>`

- [ ] **Step 1: Write repository test**

Add a test that creates a task, completes it, creates a document, saves a draft, then asserts `get_day_trace(&conn, "2026-07-08")` returns at least one `task_created`, one `task_completed`, one `document_updated`, and one `draft_updated` item.

Use explicit `contains` checks:

```rust
let kinds: Vec<String> = trace.iter().map(|item| item.kind.clone()).collect();
assert!(kinds.contains(&"task_created".to_string()));
assert!(kinds.contains(&"task_completed".to_string()));
assert!(kinds.contains(&"document_updated".to_string()));
assert!(kinds.contains(&"draft_updated".to_string()));
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
cd src-tauri
cargo test day_trace_tests
```

Expected: FAIL because trace DTO and function are missing.

- [ ] **Step 3: Implement day trace DTO and repository**

Add `DayTraceItemDto`:

```rust
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct DayTraceItemDto {
    pub id: String,
    pub kind: String,
    pub title: String,
    pub occurred_at: String,
}
```

Implement `get_day_trace(conn: &Connection, day: &str) -> Result<Vec<DayTraceItemDto>, AppError>` by unioning:

```sql
select id, 'task_created', title, created_at from tasks where substr(created_at, 1, 10) = ?1
union all
select id, 'task_completed', title, completed_at from tasks where substr(completed_at, 1, 10) = ?1
union all
select n.id, 'document_updated', n.title, d.updated_at from documents d join library_nodes n on n.id = d.node_id where substr(d.updated_at, 1, 10) = ?1
union all
select id, 'draft_updated', 'Daily draft', updated_at from daily_drafts where draft_date = ?1
order by 4 asc
```

Skip rows with null `occurred_at`.

- [ ] **Step 4: Add command and API**

Expose `get_day_trace` as a Tauri command. Add `DayTraceItem` to `src/app/types.ts` and `dayApi.trace(day)` to `src/app/api.ts`.

- [ ] **Step 5: Implement timeline component**

Create `src/components/DayTimeline.tsx`:

```tsx
import type { DayTraceItem } from "../app/types";

interface DayTimelineProps {
  items: DayTraceItem[];
}

export function DayTimeline({ items }: DayTimelineProps) {
  return (
    <ol className="day-timeline">
      {items.map((item) => (
        <li key={`${item.kind}:${item.id}:${item.occurredAt}`} className="trace-item">
          <time>{item.occurredAt.slice(11, 16)}</time>
          <span className="trace-kind">{item.kind.replaceAll("_", " ")}</span>
          <span>{item.title}</span>
        </li>
      ))}
    </ol>
  );
}
```

- [ ] **Step 6: Implement DayView page and wire navigation**

Create `src/pages/DayView.tsx` to load `dayApi.trace(date)` and render `DayTimeline`. Add the Date rail item to switch to this view.

- [ ] **Step 7: Add timeline styles**

Use the signature work trace visual: a vertical line using `border-left: 1px solid var(--color-line)` and monospace time labels. Keep it restrained.

- [ ] **Step 8: Run verification**

Run:

```powershell
npm test
npm run build
cd src-tauri
cargo test day_trace_tests
```

Expected: all commands pass.

- [ ] **Step 9: Commit**

Run:

```powershell
git add src src-tauri
git commit -m "feat: add day trace"
```

Expected: A commit is created containing Day View functionality.

---

### Task 7: Implement Basic Search

**Files:**
- Modify: `src-tauri/src/db/repositories.rs`
- Create or modify: `src-tauri/src/commands/search.rs`
- Modify: `src-tauri/src/commands/mod.rs`
- Modify: `src-tauri/src/main.rs`
- Modify: `src/app/types.ts`
- Modify: `src/app/api.ts`
- Create: `src/components/SearchBar.tsx`
- Create: `src/pages/Search.tsx`
- Modify: `src/app/App.tsx`

**Interfaces:**
- Produces backend command: `search_all(query: String) -> Result<Vec<SearchResultDto>, AppError>`
- Produces frontend API: `searchApi.all(query: string): Promise<SearchResult[]>`

- [ ] **Step 1: Write search repository test**

Seed a task, document, and daily draft. Assert `search_all(&conn, "SQLite")` returns results with sources `task`, `document`, and `daily_draft` when matching content exists.

- [ ] **Step 2: Implement search DTO and repository**

Add:

```rust
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct SearchResultDto {
    pub id: String,
    pub source: String,
    pub title: String,
    pub snippet: String,
    pub updated_at: String,
}
```

Implement `search_all` using `LIKE` with a parameter value of `format!("%{}%", query.trim())`. Reject empty query with `validation_error`.

- [ ] **Step 3: Add search command and API**

Expose `search_all`. Add `SearchResult` type and `searchApi.all(query)`.

- [ ] **Step 4: Implement SearchBar**

Create a controlled form component:

```tsx
interface SearchBarProps {
  onSearch: (query: string) => void;
}
```

It should submit only non-empty trimmed queries.

- [ ] **Step 5: Implement Search page**

Render search results as compact rows with source label, title, and snippet. Do not navigate result clicks in version one; show readable results first.

- [ ] **Step 6: Run verification**

Run:

```powershell
npm test
npm run build
cd src-tauri
cargo test search_tests
```

Expected: all commands pass.

- [ ] **Step 7: Commit**

Run:

```powershell
git add src src-tauri
git commit -m "feat: add basic search"
```

Expected: A commit is created containing basic search.

---

### Task 8: Add Tray And Global Shortcut

**Files:**
- Create: `src-tauri/src/tray.rs`
- Create: `src-tauri/src/shortcuts.rs`
- Modify: `src-tauri/src/main.rs`
- Modify: `src-tauri/Cargo.toml`
- Modify: `src-tauri/tauri.conf.json`

**Interfaces:**
- Produces: `tray::setup_tray(app: &tauri::App) -> tauri::Result<()>`
- Produces: `shortcuts::setup_shortcuts(app: &tauri::App) -> tauri::Result<()>`

- [ ] **Step 1: Add plugin dependency if required by Tauri v2 scaffold**

If global shortcut is not available from generated Tauri APIs, add:

```toml
tauri-plugin-global-shortcut = "2"
```

and initialize the plugin in the builder.

- [ ] **Step 2: Implement focus helper**

In `src-tauri/src/shortcuts.rs`, implement:

```rust
pub fn focus_main_window(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.set_focus();
    }
}
```

- [ ] **Step 3: Implement tray menu**

Create tray menu items `Open` and `Quit`. `Open` calls `focus_main_window`; `Quit` calls `app.exit(0)`.

- [ ] **Step 4: Implement global shortcut**

Register `Alt+Space` or another available shortcut selected during implementation if Windows reserves the first choice. The shortcut calls `focus_main_window`.

- [ ] **Step 5: Wire setup in main**

Call tray and shortcut setup from Tauri `.setup`.

- [ ] **Step 6: Manual verification**

Run:

```powershell
npm run tauri dev
```

Expected:

- App launches.
- Tray menu can focus the window.
- Tray menu can quit the app.
- Global shortcut focuses the window.

- [ ] **Step 7: Commit**

Run:

```powershell
git add src-tauri
git commit -m "feat: add tray and shortcut"
```

Expected: A commit is created containing tray and shortcut behavior.

---

### Task 9: Final Polish, Persistence Verification, And README Update

**Files:**
- Modify: `src/styles/app.css`
- Modify: `README.md`
- Modify: any frontend file touched by final accessibility or layout fixes

**Interfaces:**
- Consumes all prior tasks.
- Produces a verified local MVP with documented run commands.

- [ ] **Step 1: Add README run instructions**

Replace `README.md` with UTF-8 content:

```markdown
# task-memo

Local Windows desktop tool for capturing development tasks, notes, daily drafts, and searchable personal knowledge.

## Development

```powershell
npm install
npm run tauri dev
```

## Verification

```powershell
npm test
npm run build
cd src-tauri
cargo test
```
```

- [ ] **Step 2: Check responsive constraints**

Run the app and verify:

- At 1280px width, three columns are visible.
- At 900px width, content does not overlap.
- Task row text wraps instead of escaping.
- Library tree labels truncate with ellipsis instead of resizing rows.
- Editor textarea remains usable.

Fix concrete CSS issues in `src/styles/app.css`.

- [ ] **Step 3: Verify persistence manually**

Run:

```powershell
npm run tauri dev
```

Manual actions:

- Create a task.
- Complete it.
- Create a Library document.
- Save daily draft text.
- Quit the app.
- Reopen the app.

Expected: the task, completed state, document content, and draft remain present.

- [ ] **Step 4: Run full verification**

Run:

```powershell
npm test
npm run build
cd src-tauri
cargo test
```

Expected: all commands pass.

- [ ] **Step 5: Commit**

Run:

```powershell
git add README.md src src-tauri
git commit -m "chore: polish task memo mvp"
```

Expected: A final polish commit is created.

---

## Self-Review

Spec coverage:

- Today tasks: Task 3.
- Structured Library with category, folder, document: Task 4.
- Day View work trace: Task 6.
- Daily drafts: Task 5.
- Tray and global shortcut: Task 8.
- SQLite persistence and seed data: Task 2.
- Basic search: Task 7.
- Frontend workbench design direction: Tasks 1, 3, 4, 6, and 9.
- Verification and README: Task 9.

Placeholder scan:

- The plan avoids unresolved markers and defines concrete file paths, commands, DTO names, and function names.

Type consistency:

- Backend DTOs use serde `camelCase`; frontend types use matching camelCase names.
- `taskDate`, `parentId`, `nodeType`, `draftDate`, and `occurredAt` are the frontend names produced by serde renaming.
- Repository functions are consumed by command modules with matching names.
