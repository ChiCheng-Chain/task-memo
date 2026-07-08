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
