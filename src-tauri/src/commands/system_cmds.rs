use crate::scanners::{path, system};
use crate::state::AppState;
use tauri::State;

#[tauri::command]
pub fn get_system_info(state: State<'_, AppState>) -> system::SystemInfo {
    let mut cache = state.system_cache.lock().unwrap();
    if let Some(cached) = cache.get() {
        return cached;
    }
    let info = system::scan();
    cache.set(info.clone());
    info
}

#[tauri::command]
pub fn get_path_entries(state: State<'_, AppState>) -> Vec<path::PathEntry> {
    let mut cache = state.path_cache.lock().unwrap();
    if let Some(cached) = cache.get() {
        return cached;
    }
    let entries = path::scan();
    cache.set(entries.clone());
    entries
}

#[tauri::command]
pub fn refresh_system_info(state: State<'_, AppState>) -> system::SystemInfo {
    let mut cache = state.system_cache.lock().unwrap();
    cache.invalidate();
    let info = system::scan();
    cache.set(info.clone());
    info
}

#[tauri::command]
pub fn refresh_path_entries(state: State<'_, AppState>) -> Vec<path::PathEntry> {
    let mut cache = state.path_cache.lock().unwrap();
    cache.invalidate();
    let entries = path::scan();
    cache.set(entries.clone());
    entries
}
