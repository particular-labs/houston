use crate::demo;
use crate::scanners::{path, system};
use crate::state::AppState;
use tauri::State;

#[tauri::command]
pub fn get_system_info(state: State<'_, AppState>) -> system::SystemInfo {
    if demo::is_enabled() {
        return demo::mock_system_info();
    }

    let mut cache = state.system_cache.lock().unwrap();
    if let Some(cached) = cache.get() {
        state.system_stats.record_hit();
        return cached;
    }
    let start = std::time::Instant::now();
    let info = system::scan();
    state
        .system_stats
        .record_miss(start.elapsed().as_millis() as u64);
    cache.set(info.clone());
    drop(cache);
    // Record scan history
    let db = state.db.lock().unwrap();
    let _ = db.record_scan("system", &info);
    info
}

#[tauri::command]
pub fn get_path_entries(state: State<'_, AppState>) -> Vec<path::PathEntry> {
    if demo::is_enabled() {
        return demo::mock_path_entries();
    }

    let mut cache = state.path_cache.lock().unwrap();
    if let Some(cached) = cache.get() {
        state.path_stats.record_hit();
        return cached;
    }
    let start = std::time::Instant::now();
    let entries = path::scan();
    state
        .path_stats
        .record_miss(start.elapsed().as_millis() as u64);
    cache.set(entries.clone());
    drop(cache);
    // Record scan history
    let db = state.db.lock().unwrap();
    let _ = db.record_scan("path", &entries);
    entries
}

#[tauri::command]
pub fn refresh_system_info(state: State<'_, AppState>) -> system::SystemInfo {
    if demo::is_enabled() {
        return demo::mock_system_info();
    }

    let mut cache = state.system_cache.lock().unwrap();
    cache.invalidate();
    let start = std::time::Instant::now();
    let info = system::scan();
    state
        .system_stats
        .record_miss(start.elapsed().as_millis() as u64);
    cache.set(info.clone());
    drop(cache);
    // Record scan history
    let db = state.db.lock().unwrap();
    let _ = db.record_scan("system", &info);
    info
}

#[tauri::command]
pub fn refresh_path_entries(state: State<'_, AppState>) -> Vec<path::PathEntry> {
    if demo::is_enabled() {
        return demo::mock_path_entries();
    }

    let mut cache = state.path_cache.lock().unwrap();
    cache.invalidate();
    let start = std::time::Instant::now();
    let entries = path::scan();
    state
        .path_stats
        .record_miss(start.elapsed().as_millis() as u64);
    cache.set(entries.clone());
    drop(cache);
    // Record scan history
    let db = state.db.lock().unwrap();
    let _ = db.record_scan("path", &entries);
    entries
}
