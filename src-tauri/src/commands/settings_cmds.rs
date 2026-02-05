use crate::db::SettingPair;
use crate::state::AppState;
use tauri::State;

#[tauri::command]
pub fn get_settings(state: State<'_, AppState>) -> Result<Vec<SettingPair>, String> {
    let db = state.db.lock().unwrap();
    db.get_all_settings()
}

#[tauri::command]
pub fn get_setting(state: State<'_, AppState>, key: String) -> Result<Option<String>, String> {
    let db = state.db.lock().unwrap();
    db.get_setting(&key)
}

#[tauri::command]
pub fn set_setting(state: State<'_, AppState>, key: String, value: String) -> Result<(), String> {
    // Persist to database
    {
        let db = state.db.lock().unwrap();
        db.set_setting(&key, &value)?;
    }

    // If it's a TTL setting, apply the override to the corresponding cache
    if key.starts_with("ttl_") {
        if let Ok(secs) = value.parse::<u64>() {
            match key.as_str() {
                "ttl_system" => state.system_cache.lock().unwrap().set_ttl(secs),
                "ttl_path" => state.path_cache.lock().unwrap().set_ttl(secs),
                "ttl_languages" => state.language_cache.lock().unwrap().set_ttl(secs),
                "ttl_env" => state.env_cache.lock().unwrap().set_ttl(secs),
                "ttl_projects" => state.project_cache.lock().unwrap().set_ttl(secs),
                "ttl_git" => state.git_cache.lock().unwrap().set_ttl(secs),
                "ttl_packages" => state.package_cache.lock().unwrap().set_ttl(secs),
                "ttl_claude" => state.claude_cache.lock().unwrap().set_ttl(secs),
                "ttl_diagnostics" => state.diagnostics_cache.lock().unwrap().set_ttl(secs),
                "ttl_ai_tools" => state.ai_tools_cache.lock().unwrap().set_ttl(secs),
                _ => {}
            }
        }
    }

    Ok(())
}
