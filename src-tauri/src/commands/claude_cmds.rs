use crate::scanners::claude;
use crate::state::AppState;
use tauri::State;

#[tauri::command]
pub fn get_claude_config(state: State<'_, AppState>) -> claude::ClaudeConfig {
    let mut cache = state.claude_cache.lock().unwrap();
    if let Some(cached) = cache.get() {
        state.claude_stats.record_hit();
        return cached;
    }
    let start = std::time::Instant::now();
    let config = claude::scan();
    state
        .claude_stats
        .record_miss(start.elapsed().as_millis() as u64);
    cache.set(config.clone());
    config
}

#[tauri::command]
pub fn refresh_claude_config(state: State<'_, AppState>) -> claude::ClaudeConfig {
    let mut cache = state.claude_cache.lock().unwrap();
    cache.invalidate();
    let start = std::time::Instant::now();
    let config = claude::scan();
    state
        .claude_stats
        .record_miss(start.elapsed().as_millis() as u64);
    cache.set(config.clone());
    config
}
