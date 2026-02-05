use crate::db::ScanHistoryRow;
use crate::state::AppState;
use tauri::State;

#[tauri::command]
pub fn get_scan_history(
    state: State<'_, AppState>,
    scanner: String,
    limit: Option<u32>,
) -> Result<Vec<ScanHistoryRow>, String> {
    let db = state.db.lock().unwrap();
    db.get_scan_history(&scanner, limit)
}

#[tauri::command]
pub fn get_latest_scan(
    state: State<'_, AppState>,
    scanner: String,
) -> Result<Option<ScanHistoryRow>, String> {
    let db = state.db.lock().unwrap();
    db.get_latest_scan(&scanner)
}
