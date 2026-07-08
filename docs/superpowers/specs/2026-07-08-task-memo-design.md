# Task Memo Design

## Purpose

Task Memo is a lightweight Windows desktop tool for a programmer who needs to capture day-to-day development work without breaking flow.

The app has four jobs:

- Track today's next actions and small development tasks.
- Store long-lived notes in a structured internal knowledge library.
- Let the user review records by date.
- Save an editable daily report draft without trying to summarize automatically.

The first version is local-only, single-user, and optimized for fast manual capture. It does not need accounts, sync, encryption, collaboration, or AI summarization.

## Product Scope

### Today

The Today view is the default screen. It shows tasks for the selected day, with today selected on launch.

Supported actions:

- Add a task quickly.
- Edit task title and optional note.
- Mark a task complete.
- Restore a completed task to active.
- Reorder active tasks.
- Move a task to another date.
- Delete a task.
- Show active tasks above completed tasks.

Completed tasks remain visible for daily review instead of disappearing.

### Library

The Library stores longer-lived information using a virtual file system backed by SQLite.

Top-level categories for version one:

- Experience
- Passwords
- Ideas
- Command snippets
- Pitfall notes
- Affairs

Each category can contain folders. Folders can contain folders and documents. Documents contain Markdown text. Tags are optional and used only for search and filtering; the category and folder tree remain the primary organization model.

The Library does not encrypt, hide, or specially mark password content. This matches the user's stated use: the app replaces a local notepad-style workflow for one person.

### Day View

The Day View shows what happened on a selected date:

- Tasks created for that day.
- Tasks completed on that day.
- Library documents created or edited on that day.
- The daily draft for that day.

This view supports review and manual reporting. It does not auto-generate the report.

### Daily Draft

Each date has one editable daily draft. The draft is plain Markdown text saved locally.

Supported actions:

- Open the draft for a selected date.
- Edit and save.
- Copy full draft text.
- Find drafts by date.

### Tray And Shortcut

The app can stay resident in the Windows system tray.

Version one tray behavior:

- Open or focus the main window.
- Quit the app.

Version one global shortcut behavior:

- Open or focus the main window.

A separate floating quick-capture window is deferred until the core workflow is stable.

## Non-Goals

Version one will not include:

- Cloud sync.
- Multi-device support.
- User accounts.
- Encryption or password manager behavior.
- AI report generation.
- Rich text editing beyond Markdown.
- Browser extensions.
- Mobile clients.
- Plugin systems.

## Recommended Stack

Use Tauri, React, TypeScript, and SQLite.

Reasons:

- Tauri gives a lighter Windows desktop app than Electron.
- React and TypeScript keep UI iteration fast.
- SQLite fits the local-only data model.
- Tauri commands keep database access behind a desktop backend boundary.
- Tray and global shortcut support are available without introducing a large runtime.

Alternative stacks considered:

- Electron + React + SQLite: fastest to build, but heavier in memory and package size.
- .NET/WPF + SQLite: strong Windows-native fit, but slower for Markdown/editor/tree UI iteration.

## Architecture

### High-Level Structure

```text
src-tauri/
  src/
    commands/
      tasks.rs
      library.rs
      daily.rs
      search.rs
    db/
      connection.rs
      migrations.rs
      repositories.rs
    tray.rs
    shortcuts.rs

src/
  app/
    App.tsx
    routes.ts
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
```

### Data Flow

The frontend calls typed Tauri commands. Commands validate input, call repository functions, and return serializable DTOs.

```text
React UI -> Tauri command -> repository -> SQLite
React UI <- Tauri command <- repository <- SQLite
```

The frontend does not access SQLite directly. This keeps persistence code testable and makes future export or sync work easier to add.

### Error Handling

Backend commands return structured errors with a short code and a user-facing message.

Examples:

- `validation_error`: The title is empty.
- `not_found`: The task or document no longer exists.
- `database_error`: The app could not save changes.

UI error copy should be direct and actionable. It should not apologize or use vague messages.

## Database Design

### tasks

Stores dated action items.

```text
id            text primary key
title         text not null
note          text not null default ''
status        text not null -- active, completed
task_date     text not null -- YYYY-MM-DD
sort_order    integer not null
completed_at  text null
created_at    text not null
updated_at    text not null
```

### library_nodes

Stores the virtual file tree.

```text
id            text primary key
parent_id     text null
node_type     text not null -- category, folder, document
category      text null
title         text not null
sort_order    integer not null
created_at    text not null
updated_at    text not null
```

Rules:

- Category nodes are fixed seed data.
- Folder and document nodes must have a parent.
- Document nodes have one matching row in `documents`.

### documents

Stores document content.

```text
id            text primary key
node_id       text not null unique
content       text not null default ''
created_at    text not null
updated_at    text not null
```

### daily_drafts

Stores one draft per date.

```text
id            text primary key
draft_date    text not null unique -- YYYY-MM-DD
content       text not null default ''
created_at    text not null
updated_at    text not null
```

### tags

```text
id            text primary key
name          text not null unique
created_at    text not null
```

### document_tags

```text
document_id   text not null
tag_id        text not null
primary key (document_id, tag_id)
```

### Search

Version one can start with SQLite `LIKE` queries across task titles, task notes, document titles, document content, and daily draft content.

If basic search feels slow or imprecise after real use, add SQLite FTS5 for:

- `tasks.title`
- `tasks.note`
- `library_nodes.title`
- `documents.content`
- `daily_drafts.content`

## Frontend Design Direction

### Design Position

The app should feel like a quiet developer workbench, not a generic admin dashboard and not a flashy productivity landing page.

It is meant to sit beside coding work for long periods. The UI should be calm, fast to scan, and specific to programming workflows.

### Visual Tokens

```text
Canvas       #F7F5EF
Ink          #24221F
Rail         #2F3437
Line         #D8D2C6
Action       #2F7D6D
Warn         #B95C3A
Code         #E9E2D4
```

Typography:

```text
Interface    Inter, Segoe UI, Microsoft YaHei UI, sans-serif
Code         JetBrains Mono, Cascadia Code, monospace
Dates        JetBrains Mono, Cascadia Code, monospace
```

The palette avoids the common blue-purple SaaS look, pure terminal green-on-black, and decorative gradient-heavy surfaces.

### Layout

Use a three-zone desktop layout.

```text
+----------+----------------------------+----------------------+
| Rail     | Workbench                  | Inspector            |
|          |                            |                      |
| Today    | Task list / library tree   | Details / editor     |
| Library  | day review / search        | draft / metadata     |
| Dates    |                            |                      |
| Search   |                            |                      |
+----------+----------------------------+----------------------+
```

The rail is narrow and persistent. The workbench is the main action area. The inspector is collapsible and used for editing details.

On narrow windows, the inspector can become an overlay panel.

### Interaction Style

- Use icons for common actions like add, copy, delete, complete, search, and collapse.
- Use labels where the action is not obvious.
- Keep task rows compact with stable row height.
- Avoid nested cards.
- Use panels, dividers, and tree structure instead of card-heavy layouts.
- Ensure all controls have keyboard focus states.
- Respect reduced-motion settings.

### Signature Element

The Day View should use a "work trace" timeline.

It shows meaningful events in order:

```text
09:42  Created task: Fix login state
10:16  Completed task: Reproduce 401 issue
11:03  Edited pitfall note: Tauri SQLite path
18:30  Updated daily draft
```

This is the one distinctive visual idea. It is useful because the user wants to review a day and create a report manually.

## Initial Routes

```text
/today
/library
/day/:date
/draft/:date
/search
```

Desktop routing can stay internal to React. The app does not need browser-style deep links in version one.

## Seed Data

On first launch, create fixed category nodes:

```text
Experience
Passwords
Ideas
Command snippets
Pitfall notes
Affairs
```

Store stable internal category keys in English and display localized labels in the frontend.

## Testing Strategy

Backend:

- Migration tests create a fresh database and verify seed categories.
- Repository tests cover task CRUD, tree CRUD, document save, daily draft upsert, and search.
- Command tests cover validation and structured errors where practical.

Frontend:

- Component tests for task list behavior, library tree behavior, and draft editing.
- Integration tests for the main flows after the app skeleton is available:
  - Add and complete today's task.
  - Create folder and document in Library.
  - Edit a daily draft.
  - Review a date in Day View.

Manual verification:

- Launch app on Windows.
- Confirm tray open/focus works.
- Confirm global shortcut opens/focuses the app.
- Confirm data persists after app restart.

## Implementation Order

1. Scaffold Tauri + React + TypeScript.
2. Add SQLite connection, migrations, and seed data.
3. Implement task repository and Today view.
4. Implement Library tree and Markdown document editor.
5. Implement daily draft storage and editor.
6. Implement Day View with work trace timeline.
7. Add basic search.
8. Add tray and global shortcut.
9. Polish layout, keyboard states, and persistence verification.

## Open Decisions

No blocking open decisions remain for version one.

Deferred choices:

- Whether quick capture should become a floating mini window.
- Whether to export Library documents to real Markdown files.
- Whether to add FTS5 search.
- Whether to add encryption for selected documents.
