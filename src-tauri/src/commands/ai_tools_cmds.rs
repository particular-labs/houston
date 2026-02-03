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
    state
        .ai_tools_stats
        .record_miss(start.elapsed().as_millis() as u64);
    cache.set(report.clone());
    report
}

#[tauri::command]
pub fn refresh_ai_tools(state: State<'_, AppState>) -> ai_tools::AiToolsReport {
    let mut cache = state.ai_tools_cache.lock().unwrap();
    cache.invalidate();
    let start = std::time::Instant::now();
    let report = ai_tools::scan();
    state
        .ai_tools_stats
        .record_miss(start.elapsed().as_millis() as u64);
    cache.set(report.clone());
    report
}

#[tauri::command]
pub fn update_ai_tool(
    tool_name: String,
    state: State<'_, AppState>,
) -> crate::scanners::diagnostics::FixResult {
    use crate::scanners::diagnostics::FixResult;

    let Some((cmd, args)) = ai_tools::get_update_command(&tool_name) else {
        return FixResult {
            success: false,
            message: format!("No update method available for {}", tool_name),
            output: None,
        };
    };

    let args_refs: Vec<&str> = args.iter().map(|s| s.as_str()).collect();
    let result = match std::process::Command::new(&cmd).args(&args_refs).output() {
        Ok(o) => {
            let stdout = String::from_utf8_lossy(&o.stdout).to_string();
            let stderr = String::from_utf8_lossy(&o.stderr).to_string();
            let combined = if stderr.is_empty() {
                stdout
            } else {
                format!("{}\n{}", stdout, stderr)
            };

            if o.status.success() {
                FixResult {
                    success: true,
                    message: format!("Successfully updated {}", tool_name),
                    output: Some(combined),
                }
            } else {
                FixResult {
                    success: false,
                    message: format!("Update command failed for {}", tool_name),
                    output: Some(combined),
                }
            }
        }
        Err(e) => FixResult {
            success: false,
            message: format!("Failed to run update for {}: {}", tool_name, e),
            output: None,
        },
    };

    if result.success {
        let mut cache = state.ai_tools_cache.lock().unwrap();
        cache.invalidate();
    }

    result
}
