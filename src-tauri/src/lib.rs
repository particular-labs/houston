mod commands;
mod db;
mod registry;
mod scanners;
mod state;

use commands::{
    action_cmds, ai_tools_cmds, claude_cmds, diagnostics_cmds, env_cmds, history_cmds,
    issue_cmds, language_cmds, package_cmds, project_cmds, settings_cmds, stats_cmds, system_cmds,
    workspace_cmds,
};
use state::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_log::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            // System
            system_cmds::get_system_info,
            system_cmds::get_path_entries,
            system_cmds::refresh_system_info,
            system_cmds::refresh_path_entries,
            // Languages
            language_cmds::get_languages,
            language_cmds::refresh_languages,
            // Environment
            env_cmds::get_env_vars,
            env_cmds::refresh_env_vars,
            // Workspace
            workspace_cmds::get_workspace_paths,
            workspace_cmds::add_workspace,
            workspace_cmds::remove_workspace,
            workspace_cmds::scan_projects,
            workspace_cmds::get_git_status,
            workspace_cmds::get_all_git_statuses,
            workspace_cmds::get_monorepo_packages,
            // Packages
            package_cmds::get_packages,
            package_cmds::refresh_packages,
            // Claude
            claude_cmds::get_claude_config,
            claude_cmds::refresh_claude_config,
            // Actions
            action_cmds::open_in_terminal,
            action_cmds::open_in_editor,
            action_cmds::open_claude_code,
            // Diagnostics
            diagnostics_cmds::get_diagnostics,
            diagnostics_cmds::refresh_diagnostics,
            diagnostics_cmds::run_diagnostic_fix,
            // AI Tools
            ai_tools_cmds::get_ai_tools,
            ai_tools_cmds::refresh_ai_tools,
            ai_tools_cmds::update_ai_tool,
            ai_tools_cmds::get_tool_mcp_servers,
            // Stats
            stats_cmds::get_app_stats,
            // Settings
            settings_cmds::get_settings,
            settings_cmds::get_setting,
            settings_cmds::set_setting,
            // History
            history_cmds::get_scan_history,
            history_cmds::get_latest_scan,
            // Issues
            issue_cmds::get_issues,
            issue_cmds::dismiss_issue,
            issue_cmds::update_issue_status,
            // Project Analysis
            project_cmds::analyze_project,
        ])
        .setup(|app| {
            use tauri::Manager;

            // Initialize database
            let db_path = app.path().app_data_dir()?.join("houston.db");
            let _ = db::Database::backup(&db_path); // Best effort backup
            let database = db::Database::open(&db_path)
                .map_err(|e| anyhow::anyhow!("Database initialization failed: {}", e))?;

            // Create AppState with database and register it
            app.manage(AppState::new(database));
            // Apply macOS vibrancy
            #[cfg(target_os = "macos")]
            {
                if let Some(window) = app.get_webview_window("main") {
                    use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial};
                    let _ = apply_vibrancy(&window, NSVisualEffectMaterial::Sidebar, None, None);
                }
            }

            // Pre-warm caches in parallel — one thread per scanner
            {
                let handle = app.handle().clone();

                let h = handle.clone();
                std::thread::spawn(move || {
                    let state = h.state::<AppState>();
                    let sys = scanners::system::scan();
                    state.system_cache.lock().unwrap().set(sys);
                });

                let h = handle.clone();
                std::thread::spawn(move || {
                    let state = h.state::<AppState>();
                    let paths = scanners::path::scan();
                    state.path_cache.lock().unwrap().set(paths);
                });

                let h = handle.clone();
                std::thread::spawn(move || {
                    let state = h.state::<AppState>();
                    let langs = scanners::languages::scan();
                    state.language_cache.lock().unwrap().set(langs);
                });

                let h = handle.clone();
                std::thread::spawn(move || {
                    let state = h.state::<AppState>();
                    let envs = scanners::environment::scan();
                    state.env_cache.lock().unwrap().set(envs);
                });

                let h = handle.clone();
                std::thread::spawn(move || {
                    let state = h.state::<AppState>();
                    let pkgs = scanners::packages::scan();
                    state.package_cache.lock().unwrap().set(pkgs);
                });

                let h = handle.clone();
                std::thread::spawn(move || {
                    let state = h.state::<AppState>();
                    let ai_tools = scanners::ai_tools::scan();
                    state.ai_tools_cache.lock().unwrap().set(ai_tools);
                });

                let h = handle.clone();
                std::thread::spawn(move || {
                    let state = h.state::<AppState>();
                    let diag = scanners::diagnostics::scan();
                    state.diagnostics_cache.lock().unwrap().set(diag);
                });
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Houston");
}
