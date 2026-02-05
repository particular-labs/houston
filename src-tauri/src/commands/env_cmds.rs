use crate::demo;
use crate::scanners::environment;
use crate::state::AppState;
use tauri::State;

#[tauri::command]
pub fn get_env_vars(state: State<'_, AppState>) -> Vec<environment::EnvVarInfo> {
    if demo::is_enabled() {
        return demo::mock_env_vars();
    }

    let mut cache = state.env_cache.lock().unwrap();
    if let Some(cached) = cache.get() {
        state.env_stats.record_hit();
        return cached;
    }
    let start = std::time::Instant::now();
    let vars = environment::scan();
    state
        .env_stats
        .record_miss(start.elapsed().as_millis() as u64);
    cache.set(vars.clone());
    drop(cache);
    // Record scan history
    let db = state.db.lock().unwrap();
    let _ = db.record_scan("environment", &vars);
    vars
}

#[tauri::command]
pub fn refresh_env_vars(state: State<'_, AppState>) -> Vec<environment::EnvVarInfo> {
    if demo::is_enabled() {
        return demo::mock_env_vars();
    }

    let mut cache = state.env_cache.lock().unwrap();
    cache.invalidate();
    let start = std::time::Instant::now();
    let vars = environment::scan();
    state
        .env_stats
        .record_miss(start.elapsed().as_millis() as u64);
    cache.set(vars.clone());
    drop(cache);
    // Record scan history
    let db = state.db.lock().unwrap();
    let _ = db.record_scan("environment", &vars);
    vars
}
