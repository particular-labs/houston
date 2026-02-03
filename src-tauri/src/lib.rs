mod commands;
mod scanners;
mod state;

use commands::{
    action_cmds, ai_tools_cmds, claude_cmds, diagnostics_cmds, env_cmds, language_cmds,
    package_cmds, system_cmds, workspace_cmds,
};
use state::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
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
        ])
        .setup(|app| {
            // Apply macOS vibrancy
            #[cfg(target_os = "macos")]
            {
                use tauri::Manager;
                if let Some(window) = app.get_webview_window("main") {
                    use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial};
                    let _ = apply_vibrancy(
                        &window,
                        NSVisualEffectMaterial::Sidebar,
                        None,
                        None,
                    );
                }
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Houston");
}
