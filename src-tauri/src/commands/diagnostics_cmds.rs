use crate::scanners::diagnostics;
use crate::state::AppState;
use tauri::State;

#[tauri::command]
pub fn get_diagnostics(state: State<'_, AppState>) -> diagnostics::DiagnosticReport {
    let mut cache = state.diagnostics_cache.lock().unwrap();
    if let Some(cached) = cache.get() {
        state.diagnostics_stats.record_hit();
        return cached;
    }
    let start = std::time::Instant::now();
    let report = diagnostics::scan();
    state.diagnostics_stats.record_miss(start.elapsed().as_millis() as u64);
    cache.set(report.clone());
    report
}

#[tauri::command]
pub fn refresh_diagnostics(state: State<'_, AppState>) -> diagnostics::DiagnosticReport {
    let mut cache = state.diagnostics_cache.lock().unwrap();
    cache.invalidate();
    let start = std::time::Instant::now();
    let report = diagnostics::scan();
    state.diagnostics_stats.record_miss(start.elapsed().as_millis() as u64);
    cache.set(report.clone());
    report
}

#[tauri::command]
pub fn run_diagnostic_fix(fix_id: String) -> diagnostics::FixResult {
    diagnostics::execute_fix(&fix_id)
}
