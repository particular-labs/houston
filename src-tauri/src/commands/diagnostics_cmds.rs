use crate::scanners::diagnostics;
use crate::state::AppState;
use tauri::State;

fn sync_issues_to_db(state: &State<'_, AppState>, report: &diagnostics::DiagnosticReport) {
    let db = state.db.lock().unwrap();

    // Upsert each diagnostic item
    let mut current_ids: Vec<&str> = Vec::new();
    for item in &report.items {
        let severity_str = match item.severity {
            diagnostics::Severity::Error => "error",
            diagnostics::Severity::Warning => "warning",
            diagnostics::Severity::Info => "info",
            diagnostics::Severity::Suggestion => "suggestion",
        };
        let _ = db.upsert_issue(&item.id, &item.category, severity_str, &item.title, &item.description);
        current_ids.push(&item.id);
    }

    // Mark missing issues as resolved (unless dismissed)
    let _ = db.resolve_missing_issues(&current_ids);
}

#[tauri::command]
pub fn get_diagnostics(state: State<'_, AppState>) -> diagnostics::DiagnosticReport {
    let mut cache = state.diagnostics_cache.lock().unwrap();
    if let Some(cached) = cache.get() {
        state.diagnostics_stats.record_hit();
        return cached;
    }
    let start = std::time::Instant::now();
    let report = diagnostics::scan();
    state
        .diagnostics_stats
        .record_miss(start.elapsed().as_millis() as u64);
    cache.set(report.clone());
    drop(cache);
    // Record scan history and sync issues
    {
        let db = state.db.lock().unwrap();
        let _ = db.record_scan("diagnostics", &report);
    }
    sync_issues_to_db(&state, &report);
    report
}

#[tauri::command]
pub fn refresh_diagnostics(state: State<'_, AppState>) -> diagnostics::DiagnosticReport {
    let mut cache = state.diagnostics_cache.lock().unwrap();
    cache.invalidate();
    let start = std::time::Instant::now();
    let report = diagnostics::scan();
    state
        .diagnostics_stats
        .record_miss(start.elapsed().as_millis() as u64);
    cache.set(report.clone());
    drop(cache);
    // Record scan history and sync issues
    {
        let db = state.db.lock().unwrap();
        let _ = db.record_scan("diagnostics", &report);
    }
    sync_issues_to_db(&state, &report);
    report
}

#[tauri::command]
pub fn run_diagnostic_fix(fix_id: String) -> diagnostics::FixResult {
    diagnostics::execute_fix(&fix_id)
}
