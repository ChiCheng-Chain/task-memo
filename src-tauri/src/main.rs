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
