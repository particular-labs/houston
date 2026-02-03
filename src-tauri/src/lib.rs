mod commands;
mod scanners;
mod state;

use commands::{
    action_cmds, ai_tools_cmds, claude_cmds, diagnostics_cmds, env_cmds, language_cmds,
    package_cmds, stats_cmds, system_cmds, workspace_cmds,
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
        .manage(AppState::new())
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
            // Stats
            stats_cmds::get_app_stats,
        ])
        .setup(|app| {
            // Apply macOS vibrancy
            #[cfg(target_os = "macos")]
            {
                use tauri::Manager;
                if let Some(window) = app.get_webview_window("main") {
                    use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial};
                    let _ = apply_vibrancy(&window, NSVisualEffectMaterial::Sidebar, None, None);
                }
            }

            // Pre-warm caches in background
            {
                use tauri::Manager;
                let app_handle = app.handle().clone();
                std::thread::spawn(move || {
                    let state = app_handle.state::<AppState>();

                    // Fast scans first (Dashboard needs these)
                    let sys = scanners::system::scan();
                    state.system_cache.lock().unwrap().set(sys);

                    let paths = scanners::path::scan();
                    state.path_cache.lock().unwrap().set(paths);

                    let langs = scanners::languages::scan();
                    state.language_cache.lock().unwrap().set(langs);

                    let envs = scanners::environment::scan();
                    state.env_cache.lock().unwrap().set(envs);

                    // Slower scans (user may not visit immediately)
                    let pkgs = scanners::packages::scan();
                    state.package_cache.lock().unwrap().set(pkgs);

                    let ai_tools = scanners::ai_tools::scan();
                    state.ai_tools_cache.lock().unwrap().set(ai_tools);

                    let diag = scanners::diagnostics::scan();
                    state.diagnostics_cache.lock().unwrap().set(diag);
                });
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Houston");
}
