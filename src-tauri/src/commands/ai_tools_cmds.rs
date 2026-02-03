use crate::scanners::ai_tools;
use crate::state::AppState;
use tauri::State;

#[tauri::command]
pub fn get_ai_tools(state: State<'_, AppState>) -> ai_tools::AiToolsReport {
    let mut cache = state.ai_tools_cache.lock().unwrap();
    if let Some(cached) = cache.get() {
        state.ai_tools_stats.record_hit();
        return cached;
    }
    let start = std::time::Instant::now();
    let report = ai_tools::scan();
    state.ai_tools_stats.record_miss(start.elapsed().as_millis() as u64);
    cache.set(report.clone());
    report
}

#[tauri::command]
pub fn refresh_ai_tools(state: State<'_, AppState>) -> ai_tools::AiToolsReport {
    let mut cache = state.ai_tools_cache.lock().unwrap();
    cache.invalidate();
    let start = std::time::Instant::now();
    let report = ai_tools::scan();
    state.ai_tools_stats.record_miss(start.elapsed().as_millis() as u64);
    cache.set(report.clone());
    report
}
