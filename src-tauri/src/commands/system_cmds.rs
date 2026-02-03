use crate::scanners::{path, system};
use crate::state::AppState;
use tauri::State;

#[tauri::command]
pub fn get_system_info(state: State<'_, AppState>) -> system::SystemInfo {
    let mut cache = state.system_cache.lock().unwrap();
    if let Some(cached) = cache.get() {
        state.system_stats.record_hit();
        return cached;
    }
    let start = std::time::Instant::now();
    let info = system::scan();
    state.system_stats.record_miss(start.elapsed().as_millis() as u64);
    cache.set(info.clone());
    info
}

#[tauri::command]
pub fn get_path_entries(state: State<'_, AppState>) -> Vec<path::PathEntry> {
    let mut cache = state.path_cache.lock().unwrap();
    if let Some(cached) = cache.get() {
        state.path_stats.record_hit();
        return cached;
    }
    let start = std::time::Instant::now();
    let entries = path::scan();
    state.path_stats.record_miss(start.elapsed().as_millis() as u64);
    cache.set(entries.clone());
    entries
}

#[tauri::command]
pub fn refresh_system_info(state: State<'_, AppState>) -> system::SystemInfo {
    let mut cache = state.system_cache.lock().unwrap();
    cache.invalidate();
    let start = std::time::Instant::now();
    let info = system::scan();
    state.system_stats.record_miss(start.elapsed().as_millis() as u64);
    cache.set(info.clone());
    info
}

#[tauri::command]
pub fn refresh_path_entries(state: State<'_, AppState>) -> Vec<path::PathEntry> {
    let mut cache = state.path_cache.lock().unwrap();
    cache.invalidate();
    let start = std::time::Instant::now();
    let entries = path::scan();
    state.path_stats.record_miss(start.elapsed().as_millis() as u64);
    cache.set(entries.clone());
    entries
}
