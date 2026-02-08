use crate::scanners::dev_servers::{self, DevServerReport};
use crate::state::AppState;
use tauri::State;

#[tauri::command]
pub fn get_dev_servers(state: State<'_, AppState>) -> DevServerReport {
    let mut cache = state.dev_server_cache.lock().unwrap();
    if let Some(cached) = cache.get() {
        state.dev_server_stats.record_hit();
        return cached;
    }
    let start = std::time::Instant::now();
    // Get known project paths for cross-referencing
    let project_paths: Vec<String> = state
        .project_cache
        .lock()
        .unwrap()
        .get()
        .unwrap_or_default()
        .iter()
        .map(|p| p.path.clone())
        .collect();
    let report = dev_servers::scan(&project_paths);
    state
        .dev_server_stats
        .record_miss(start.elapsed().as_millis() as u64);
    cache.set(report.clone());
    report
}

#[tauri::command]
pub fn refresh_dev_servers(state: State<'_, AppState>) -> DevServerReport {
    let mut cache = state.dev_server_cache.lock().unwrap();
    cache.invalidate();
    let start = std::time::Instant::now();
    // Get known project paths for cross-referencing
    let project_paths: Vec<String> = state
        .project_cache
        .lock()
        .unwrap()
        .get()
        .unwrap_or_default()
        .iter()
        .map(|p| p.path.clone())
        .collect();
    let report = dev_servers::scan(&project_paths);
    state
        .dev_server_stats
        .record_miss(start.elapsed().as_millis() as u64);
    cache.set(report.clone());
    report
}

#[tauri::command]
pub fn stop_dev_server(pid: u32, state: State<'_, AppState>) -> Result<(), String> {
    dev_servers::stop_dev_server(pid)?;
    state.dev_server_cache.lock().unwrap().invalidate();
    Ok(())
}

#[tauri::command]
pub fn start_dev_server(
    project_path: String,
    command: Option<String>,
    state: State<'_, AppState>,
) -> Result<dev_servers::DevServer, String> {
    let server = dev_servers::start_dev_server(&project_path, command.as_deref())?;
    state.dev_server_cache.lock().unwrap().invalidate();
    Ok(server)
}
