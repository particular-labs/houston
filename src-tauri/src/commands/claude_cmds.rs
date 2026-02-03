use crate::scanners::claude;
use crate::state::AppState;
use tauri::State;

#[tauri::command]
pub fn get_claude_config(state: State<'_, AppState>) -> claude::ClaudeConfig {
    let mut cache = state.claude_cache.lock().unwrap();
    if let Some(cached) = cache.get() {
        return cached;
    }
    let config = claude::scan();
    cache.set(config.clone());
    config
}

#[tauri::command]
pub fn refresh_claude_config(state: State<'_, AppState>) -> claude::ClaudeConfig {
    let mut cache = state.claude_cache.lock().unwrap();
    cache.invalidate();
    let config = claude::scan();
    cache.set(config.clone());
    config
}
