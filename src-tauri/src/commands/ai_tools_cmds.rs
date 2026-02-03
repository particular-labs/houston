use crate::scanners::ai_tools;
use crate::state::AppState;
use tauri::State;

#[tauri::command]
pub fn get_ai_tools(state: State<'_, AppState>) -> ai_tools::AiToolsReport {
    let mut cache = state.ai_tools_cache.lock().unwrap();
    if let Some(cached) = cache.get() {
        return cached;
    }
    let report = ai_tools::scan();
    cache.set(report.clone());
    report
}

#[tauri::command]
pub fn refresh_ai_tools(state: State<'_, AppState>) -> ai_tools::AiToolsReport {
    let mut cache = state.ai_tools_cache.lock().unwrap();
    cache.invalidate();
    let report = ai_tools::scan();
    cache.set(report.clone());
    report
}
