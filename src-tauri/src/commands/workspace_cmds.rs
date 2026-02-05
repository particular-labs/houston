use crate::demo;
use crate::scanners::{git, workspace};
use crate::state::AppState;
use tauri::State;

#[tauri::command]
pub fn get_workspace_paths(state: State<'_, AppState>) -> Vec<String> {
    if demo::is_enabled() {
        return vec!["/Users/developer/Projects".to_string()];
    }
    state.workspace_paths.lock().unwrap().clone()
}

#[tauri::command]
pub fn add_workspace(state: State<'_, AppState>, path: String) -> Vec<String> {
    if demo::is_enabled() {
        return vec!["/Users/developer/Projects".to_string()];
    }

    let mut paths = state.workspace_paths.lock().unwrap();
    if !paths.contains(&path) {
        paths.push(path.clone());
        // Persist to database
        let db = state.db.lock().unwrap();
        let _ = db.add_workspace(&path);
    }
    paths.clone()
}

#[tauri::command]
pub fn remove_workspace(state: State<'_, AppState>, path: String) -> Vec<String> {
    if demo::is_enabled() {
        return vec!["/Users/developer/Projects".to_string()];
    }

    let mut paths = state.workspace_paths.lock().unwrap();
    paths.retain(|p| p != &path);
    let result = paths.clone();
    drop(paths);
    // Persist removal to database
    let db = state.db.lock().unwrap();
    let _ = db.remove_workspace(&path);
    drop(db);
    // Invalidate project and git caches so stale data doesn't linger
    state.project_cache.lock().unwrap().invalidate();
    state.git_cache.lock().unwrap().invalidate();
    result
}

#[tauri::command]
pub fn scan_projects(state: State<'_, AppState>) -> Vec<workspace::ProjectInfo> {
    if demo::is_enabled() {
        return demo::mock_projects();
    }

    let start = std::time::Instant::now();
    let workspace_paths = state.workspace_paths.lock().unwrap().clone();
    let mut all_projects = Vec::new();

    for ws_path in &workspace_paths {
        let projects = workspace::scan_directory(ws_path);
        all_projects.extend(projects);
    }

    // Worktree post-processing: detect worktree groups across all projects
    let git_paths: Vec<String> = all_projects
        .iter()
        .filter(|p| p.has_git)
        .map(|p| p.path.clone())
        .collect();

    let worktree_map = git::detect_worktree_groups(&git_paths);

    for project in &mut all_projects {
        if let Some(main_wt) = worktree_map.get(&project.path) {
            // Only apply worktree grouping if not already in a monorepo group
            if project.group_type != "monorepo" {
                project.worktree_id = main_wt.clone();
                // Derive a group name from the main worktree path
                let repo_name = std::path::Path::new(main_wt)
                    .file_name()
                    .map(|n| n.to_string_lossy().to_string())
                    .unwrap_or_else(|| main_wt.clone());
                project.group = format!("{} (worktrees)", repo_name);
                project.group_type = "worktree".to_string();
            }
        }
    }

    // Monorepo-worktree consolidation: when multiple monorepo roots are worktrees
    // of each other, collapse them into a single worktree group card.
    {
        use std::collections::{HashMap, HashSet};

        // Step 1: Find monorepo roots that appear in the worktree map
        let mut main_wt_to_roots: HashMap<String, Vec<String>> = HashMap::new();
        for project in all_projects.iter() {
            if project.is_monorepo_root {
                if let Some(main_wt) = worktree_map.get(&project.path) {
                    main_wt_to_roots
                        .entry(main_wt.clone())
                        .or_default()
                        .push(project.path.clone());
                }
            }
        }

        // Step 2: For groups with 2+ roots, collect their monorepo group names
        let mut affected_groups: HashSet<String> = HashSet::new();
        let mut roots_to_update: HashSet<String> = HashSet::new();
        let mut group_name_for_root: HashMap<String, String> = HashMap::new();

        for (main_wt, root_paths) in &main_wt_to_roots {
            if root_paths.len() < 2 {
                continue; // Solo monorepo, leave as-is
            }

            let main_wt_dirname = std::path::Path::new(main_wt)
                .file_name()
                .map(|n| n.to_string_lossy().to_string())
                .unwrap_or_else(|| main_wt.clone());
            let wt_group_name = format!("{} (worktrees)", main_wt_dirname);

            for root_path in root_paths {
                if let Some(proj) = all_projects.iter().find(|p| p.path == *root_path) {
                    affected_groups.insert(proj.group.clone());
                }
                roots_to_update.insert(root_path.clone());
                group_name_for_root.insert(root_path.clone(), wt_group_name.clone());
            }
        }

        if !affected_groups.is_empty() {
            // Remove sub-packages (non-root entries) from affected monorepo groups
            all_projects.retain(|p| !affected_groups.contains(&p.group) || p.is_monorepo_root);

            // Convert each monorepo root into a worktree entry
            for project in &mut all_projects {
                if roots_to_update.contains(&project.path) {
                    let folder_name = std::path::Path::new(&project.path)
                        .file_name()
                        .map(|n| n.to_string_lossy().to_string())
                        .unwrap_or_else(|| project.path.clone());
                    project.name = folder_name;
                    project.group = group_name_for_root
                        .get(&project.path)
                        .cloned()
                        .unwrap_or_default();
                    project.group_type = "worktree".to_string();
                    // Keep is_monorepo_root = true so the frontend knows
                    // these worktrees can be drilled into for packages
                    project.worktree_id =
                        worktree_map.get(&project.path).cloned().unwrap_or_default();
                }
            }
        }
    }

    // Re-sort
    all_projects.sort_by(|a, b| {
        a.group
            .to_lowercase()
            .cmp(&b.group.to_lowercase())
            .then_with(|| a.name.to_lowercase().cmp(&b.name.to_lowercase()))
    });

    state
        .project_stats
        .record_miss(start.elapsed().as_millis() as u64);

    // Cache it
    let mut cache = state.project_cache.lock().unwrap();
    cache.set(all_projects.clone());

    all_projects
}

#[tauri::command]
pub fn get_git_status(_state: State<'_, AppState>, project_path: String) -> Option<git::GitStatus> {
    if demo::is_enabled() {
        return demo::mock_git_statuses()
            .into_iter()
            .find(|s| s.project_path == project_path);
    }
    git::get_status(&project_path)
}

#[tauri::command]
pub fn get_all_git_statuses(state: State<'_, AppState>) -> Vec<git::GitStatus> {
    if demo::is_enabled() {
        return demo::mock_git_statuses();
    }

    let mut cache = state.git_cache.lock().unwrap();
    if let Some(cached) = cache.get() {
        state.git_stats.record_hit();
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

    let start = std::time::Instant::now();
    let statuses = git::get_statuses(&project_paths);
    state
        .git_stats
        .record_miss(start.elapsed().as_millis() as u64);
    cache.set(statuses.clone());
    statuses
}

#[tauri::command]
pub fn get_monorepo_packages(root_path: String) -> Vec<workspace::ProjectInfo> {
    if demo::is_enabled() {
        return vec![];
    }
    workspace::scan_monorepo_packages(&root_path)
}
