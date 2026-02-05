use crate::scanners::project_analysis::{self, ProjectAnalysis};

#[tauri::command]
pub async fn analyze_project(project_path: String) -> Result<ProjectAnalysis, String> {
    tokio::task::spawn_blocking(move || project_analysis::analyze_project(&project_path))
        .await
        .map_err(|e| format!("Task failed: {}", e))?
}
