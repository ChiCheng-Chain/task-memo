mod commands;
mod db;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::daily::get_daily_draft,
            commands::daily::save_daily_draft,
            commands::day::get_day_trace,
            commands::library::list_library_nodes,
            commands::library::create_library_folder,
            commands::library::create_library_document,
            commands::library::get_document,
            commands::library::save_document,
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
