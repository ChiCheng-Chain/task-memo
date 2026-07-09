#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod db;
mod shortcuts;
mod tray;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, _shortcut, event| {
                    if event.state == tauri_plugin_global_shortcut::ShortcutState::Pressed {
                        crate::shortcuts::focus_main_window(app);
                    }
                })
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            commands::daily::get_daily_draft,
            commands::daily::save_daily_draft,
            commands::day::get_day_trace,
            commands::library::list_library_nodes,
            commands::library::create_library_folder,
            commands::library::create_library_document,
            commands::library::get_document,
            commands::library::save_document,
            commands::library::delete_library_node,
            commands::search::search_all,
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
            tray::setup_tray(app)?;
            shortcuts::setup_shortcuts(app.handle())?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
