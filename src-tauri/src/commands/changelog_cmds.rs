use crate::db::ChangelogRow;
use crate::state::AppState;
use serde::Deserialize;
use tauri::State;

#[derive(Debug, Deserialize)]
pub struct ChangelogInput {
    pub version: String,
    pub date: String,
    pub title: String,
    pub summary: String,
    pub highlights: String,  // JSON string
    pub sections: Option<String>,  // JSON string
}

#[tauri::command]
pub fn get_changelogs(state: State<'_, AppState>) -> Result<Vec<ChangelogRow>, String> {
    let db = state.db.lock().unwrap();
    db.get_all_changelogs()
}

#[tauri::command]
pub fn get_changelog(state: State<'_, AppState>, version: String) -> Result<Option<ChangelogRow>, String> {
    let db = state.db.lock().unwrap();
    db.get_changelog(&version)
}

#[tauri::command]
pub fn sync_changelog(state: State<'_, AppState>, changelog: ChangelogInput) -> Result<(), String> {
    let db = state.db.lock().unwrap();
    db.upsert_changelog(
        &changelog.version,
        &changelog.date,
        &changelog.title,
        &changelog.summary,
        &changelog.highlights,
        changelog.sections.as_deref(),
    )
}
