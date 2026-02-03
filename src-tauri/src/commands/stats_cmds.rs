use crate::state::{AppState, AppStatsSnapshot, ScannerStatsSnapshot};
use std::sync::atomic::Ordering;
use tauri::State;

fn snapshot_scanner(
    name: &str,
    stats: &crate::state::ScanStats,
    ttl_secs: u64,
    is_warm: bool,
) -> ScannerStatsSnapshot {
    ScannerStatsSnapshot {
        name: name.to_string(),
        cache_hits: stats.cache_hits.load(Ordering::Relaxed),
        cache_misses: stats.cache_misses.load(Ordering::Relaxed),
        last_scan_duration_ms: stats.last_scan_duration_ms.lock().unwrap().clone(),
        total_scans: stats.total_scans.load(Ordering::Relaxed),
        ttl_secs,
        is_warm,
    }
}

fn get_memory_bytes() -> u64 {
    let pid = std::process::id();
    std::process::Command::new("ps")
        .args(["-o", "rss=", "-p", &pid.to_string()])
        .output()
        .ok()
        .and_then(|o| {
            let s = String::from_utf8_lossy(&o.stdout).trim().to_string();
            s.parse::<u64>().ok()
        })
        .map(|kb| kb * 1024) // rss is in KB, convert to bytes
        .unwrap_or(0)
}

#[tauri::command]
pub fn get_app_stats(state: State<'_, AppState>) -> AppStatsSnapshot {
    let scanners = vec![
        {
            let c = state.system_cache.lock().unwrap();
            snapshot_scanner("System", &state.system_stats, c.ttl_secs(), c.is_warm())
        },
        {
            let c = state.path_cache.lock().unwrap();
            snapshot_scanner("PATH", &state.path_stats, c.ttl_secs(), c.is_warm())
        },
        {
            let c = state.language_cache.lock().unwrap();
            snapshot_scanner(
                "Languages",
                &state.language_stats,
                c.ttl_secs(),
                c.is_warm(),
            )
        },
        {
            let c = state.env_cache.lock().unwrap();
            snapshot_scanner("Environment", &state.env_stats, c.ttl_secs(), c.is_warm())
        },
        {
            let c = state.project_cache.lock().unwrap();
            snapshot_scanner("Projects", &state.project_stats, c.ttl_secs(), c.is_warm())
        },
        {
            let c = state.git_cache.lock().unwrap();
            snapshot_scanner("Git", &state.git_stats, c.ttl_secs(), c.is_warm())
        },
        {
            let c = state.package_cache.lock().unwrap();
            snapshot_scanner("Packages", &state.package_stats, c.ttl_secs(), c.is_warm())
        },
        {
            let c = state.claude_cache.lock().unwrap();
            snapshot_scanner("Claude", &state.claude_stats, c.ttl_secs(), c.is_warm())
        },
        {
            let c = state.diagnostics_cache.lock().unwrap();
            snapshot_scanner(
                "Diagnostics",
                &state.diagnostics_stats,
                c.ttl_secs(),
                c.is_warm(),
            )
        },
        {
            let c = state.ai_tools_cache.lock().unwrap();
            snapshot_scanner("AI Tools", &state.ai_tools_stats, c.ttl_secs(), c.is_warm())
        },
    ];

    AppStatsSnapshot {
        scanners,
        pid: std::process::id(),
        uptime_secs: state.startup_instant.elapsed().as_secs(),
        memory_bytes: get_memory_bytes(),
    }
}
