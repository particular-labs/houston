use crate::db::IssueRow;
use crate::state::AppState;
use tauri::State;

#[tauri::command]
pub fn get_issues(
    state: State<'_, AppState>,
    status: Option<String>,
) -> Result<Vec<IssueRow>, String> {
    let db = state.db.lock().unwrap();
    db.get_issues(status.as_deref())
}

#[tauri::command]
pub fn dismiss_issue(state: State<'_, AppState>, diagnostic_id: String) -> Result<(), String> {
    let db = state.db.lock().unwrap();
    db.dismiss_issue(&diagnostic_id)
}

#[tauri::command]
pub fn update_issue_status(
    state: State<'_, AppState>,
    diagnostic_id: String,
    status: String,
) -> Result<(), String> {
    let db = state.db.lock().unwrap();
    db.update_issue_status(&diagnostic_id, &status)
}
