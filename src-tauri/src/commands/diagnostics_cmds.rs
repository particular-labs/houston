use crate::scanners::diagnostics;
use crate::state::AppState;
use tauri::State;

#[tauri::command]
pub fn get_diagnostics(state: State<'_, AppState>) -> diagnostics::DiagnosticReport {
    let mut cache = state.diagnostics_cache.lock().unwrap();
    if let Some(cached) = cache.get() {
        return cached;
    }
    let report = diagnostics::scan();
    cache.set(report.clone());
    report
}

#[tauri::command]
pub fn refresh_diagnostics(state: State<'_, AppState>) -> diagnostics::DiagnosticReport {
    let mut cache = state.diagnostics_cache.lock().unwrap();
    cache.invalidate();
    let report = diagnostics::scan();
    cache.set(report.clone());
    report
}

#[tauri::command]
pub fn run_diagnostic_fix(fix_id: String) -> diagnostics::FixResult {
    diagnostics::execute_fix(&fix_id)
}
