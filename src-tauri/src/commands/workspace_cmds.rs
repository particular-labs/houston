use crate::scanners::{git, workspace};
use crate::state::AppState;
use tauri::State;

#[tauri::command]
pub fn get_workspace_paths(state: State<'_, AppState>) -> Vec<String> {
    state.workspace_paths.lock().unwrap().clone()
}

#[tauri::command]
pub fn add_workspace(state: State<'_, AppState>, path: String) -> Vec<String> {
    let mut paths = state.workspace_paths.lock().unwrap();
    if !paths.contains(&path) {
        paths.push(path);
    }
    paths.clone()
}

#[tauri::command]
pub fn remove_workspace(state: State<'_, AppState>, path: String) -> Vec<String> {
    let mut paths = state.workspace_paths.lock().unwrap();
    paths.retain(|p| p != &path);
    paths.clone()
}

#[tauri::command]
pub fn scan_projects(state: State<'_, AppState>) -> Vec<workspace::ProjectInfo> {
    let workspace_paths = state.workspace_paths.lock().unwrap().clone();
    let mut all_projects = Vec::new();

    for ws_path in &workspace_paths {
        let projects = workspace::scan_directory(ws_path);
        all_projects.extend(projects);
    }

    // Cache it
    let mut cache = state.project_cache.lock().unwrap();
    cache.set(all_projects.clone());

    all_projects
}

#[tauri::command]
pub fn get_git_status(_state: State<'_, AppState>, project_path: String) -> Option<git::GitStatus> {
    git::get_status(&project_path)
}

#[tauri::command]
pub fn get_all_git_statuses(state: State<'_, AppState>) -> Vec<git::GitStatus> {
    let mut cache = state.git_cache.lock().unwrap();
    if let Some(cached) = cache.get() {
        return cached;
    }

    // Gather project paths from the project cache
    let project_cache = state.project_cache.lock().unwrap();
    let project_paths: Vec<String> = project_cache
        .get()
        .unwrap_or_default()
        .iter()
        .filter(|p| p.has_git)
        .map(|p| p.path.clone())
        .collect();
    drop(project_cache);

    let statuses = git::get_statuses(&project_paths);
    cache.set(statuses.clone());
    statuses
}
