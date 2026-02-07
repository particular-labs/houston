use serde::Serialize;
use std::collections::HashMap;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Mutex;
use std::time::{Duration, Instant};

/// A cache entry with a TTL
pub struct ScanCache<T> {
    data: Option<T>,
    last_updated: Option<Instant>,
    ttl: Duration,
}

impl<T: Clone> ScanCache<T> {
    pub fn new(ttl_secs: u64) -> Self {
        Self {
            data: None,
            last_updated: None,
            ttl: Duration::from_secs(ttl_secs),
        }
    }

    pub fn get(&self) -> Option<T> {
        if let (Some(data), Some(last_updated)) = (&self.data, &self.last_updated) {
            if last_updated.elapsed() < self.ttl {
                return Some(data.clone());
            }
        }
        None
    }

    pub fn set(&mut self, data: T) {
        self.data = Some(data);
        self.last_updated = Some(Instant::now());
    }

    pub fn invalidate(&mut self) {
        self.data = None;
        self.last_updated = None;
    }

    pub fn is_warm(&self) -> bool {
        if let (Some(_), Some(last_updated)) = (&self.data, &self.last_updated) {
            last_updated.elapsed() < self.ttl
        } else {
            false
        }
    }

    pub fn ttl_secs(&self) -> u64 {
        self.ttl.as_secs()
    }

    pub fn set_ttl(&mut self, secs: u64) {
        self.ttl = Duration::from_secs(secs);
    }
}

/// Lock-free stats tracking for a single scanner
pub struct ScanStats {
    pub cache_hits: AtomicU64,
    pub cache_misses: AtomicU64,
    pub last_scan_duration_ms: Mutex<Option<u64>>,
    pub total_scans: AtomicU64,
}

impl ScanStats {
    pub fn new() -> Self {
        Self {
            cache_hits: AtomicU64::new(0),
            cache_misses: AtomicU64::new(0),
            last_scan_duration_ms: Mutex::new(None),
            total_scans: AtomicU64::new(0),
        }
    }

    pub fn record_hit(&self) {
        self.cache_hits.fetch_add(1, Ordering::Relaxed);
    }

    pub fn record_miss(&self, duration_ms: u64) {
        self.cache_misses.fetch_add(1, Ordering::Relaxed);
        self.total_scans.fetch_add(1, Ordering::Relaxed);
        *self.last_scan_duration_ms.lock().unwrap() = Some(duration_ms);
    }
}

/// Serializable snapshot of per-scanner stats
#[derive(Debug, Clone, Serialize)]
pub struct ScannerStatsSnapshot {
    pub name: String,
    pub cache_hits: u64,
    pub cache_misses: u64,
    pub last_scan_duration_ms: Option<u64>,
    pub total_scans: u64,
    pub ttl_secs: u64,
    pub is_warm: bool,
}

/// Serializable snapshot of overall app stats
#[derive(Debug, Clone, Serialize)]
pub struct AppStatsSnapshot {
    pub scanners: Vec<ScannerStatsSnapshot>,
    pub pid: u32,
    pub uptime_secs: u64,
    pub memory_bytes: u64,
}

use serde::Serialize as SerializeTrait;

use crate::db::Database;
use crate::scanners::{
    ai_tools::AiToolsReport, claude::ClaudeConfig, diagnostics::DiagnosticReport,
    docker::DockerStatus, environment::EnvVarInfo, git::GitStatus, languages::LanguageInfo,
    packages::PackageList, path::PathEntry, system::SystemInfo, workspace::ProjectInfo,
};

pub struct AppState {
    pub db: Mutex<Database>,
    pub system_cache: Mutex<ScanCache<SystemInfo>>,
    pub path_cache: Mutex<ScanCache<Vec<PathEntry>>>,
    pub language_cache: Mutex<ScanCache<Vec<LanguageInfo>>>,
    pub env_cache: Mutex<ScanCache<Vec<EnvVarInfo>>>,
    pub workspace_paths: Mutex<Vec<String>>,
    pub project_cache: Mutex<ScanCache<Vec<ProjectInfo>>>,
    pub git_cache: Mutex<ScanCache<Vec<GitStatus>>>,
    pub package_cache: Mutex<ScanCache<PackageList>>,
    pub claude_cache: Mutex<ScanCache<ClaudeConfig>>,
    pub diagnostics_cache: Mutex<ScanCache<DiagnosticReport>>,
    pub ai_tools_cache: Mutex<ScanCache<AiToolsReport>>,
    pub docker_cache: Mutex<ScanCache<DockerStatus>>,
    // Per-scanner stats
    pub system_stats: ScanStats,
    pub path_stats: ScanStats,
    pub language_stats: ScanStats,
    pub env_stats: ScanStats,
    pub project_stats: ScanStats,
    pub git_stats: ScanStats,
    pub package_stats: ScanStats,
    pub claude_stats: ScanStats,
    pub diagnostics_stats: ScanStats,
    pub ai_tools_stats: ScanStats,
    pub docker_stats: ScanStats,
    // Docker fingerprint for conditional DB writes (running_count, stopped_count)
    pub docker_fingerprint: Mutex<Option<(usize, usize)>>,
    // Throttle scan record writes: scanner_name → last write instant
    pub scan_record_timestamps: Mutex<HashMap<String, Instant>>,
    // App-level
    pub startup_instant: Instant,
}

impl AppState {
    pub fn new(db: Database) -> Self {
        // Helper to read TTL from DB with fallback
        let get_ttl = |key: &str, default: u64| -> u64 {
            db.get_setting(key)
                .ok()
                .flatten()
                .and_then(|s| s.parse().ok())
                .unwrap_or(default)
        };

        // Read TTL overrides from database
        let ttl_system = get_ttl("ttl_system", 3600);
        let ttl_path = get_ttl("ttl_path", 3600);
        let ttl_languages = get_ttl("ttl_languages", 600);
        let ttl_env = get_ttl("ttl_env", 3600);
        let ttl_projects = get_ttl("ttl_projects", 300);
        let ttl_git = get_ttl("ttl_git", 60);
        let ttl_packages = get_ttl("ttl_packages", 600);
        let ttl_claude = get_ttl("ttl_claude", 600);
        let ttl_diagnostics = get_ttl("ttl_diagnostics", 600);
        let ttl_ai_tools = get_ttl("ttl_ai_tools", 600);
        let ttl_docker = get_ttl("ttl_docker", 15);

        // Hydrate workspace paths from database
        let workspace_paths = db.get_workspaces().unwrap_or_default();

        Self {
            db: Mutex::new(db),
            system_cache: Mutex::new(ScanCache::new(ttl_system)),
            path_cache: Mutex::new(ScanCache::new(ttl_path)),
            language_cache: Mutex::new(ScanCache::new(ttl_languages)),
            env_cache: Mutex::new(ScanCache::new(ttl_env)),
            workspace_paths: Mutex::new(workspace_paths),
            project_cache: Mutex::new(ScanCache::new(ttl_projects)),
            git_cache: Mutex::new(ScanCache::new(ttl_git)),
            package_cache: Mutex::new(ScanCache::new(ttl_packages)),
            claude_cache: Mutex::new(ScanCache::new(ttl_claude)),
            diagnostics_cache: Mutex::new(ScanCache::new(ttl_diagnostics)),
            ai_tools_cache: Mutex::new(ScanCache::new(ttl_ai_tools)),
            docker_cache: Mutex::new(ScanCache::new(ttl_docker)),
            system_stats: ScanStats::new(),
            path_stats: ScanStats::new(),
            language_stats: ScanStats::new(),
            env_stats: ScanStats::new(),
            project_stats: ScanStats::new(),
            git_stats: ScanStats::new(),
            package_stats: ScanStats::new(),
            claude_stats: ScanStats::new(),
            diagnostics_stats: ScanStats::new(),
            ai_tools_stats: ScanStats::new(),
            docker_stats: ScanStats::new(),
            docker_fingerprint: Mutex::new(None),
            scan_record_timestamps: Mutex::new(HashMap::new()),
            startup_instant: Instant::now(),
        }
    }

    /// Write a scan record to the DB only if at least 5 minutes have passed
    /// since the last write for this scanner. Refresh commands bypass throttling.
    pub fn throttled_record_scan<T: SerializeTrait>(&self, scanner: &str, data: &T) {
        let min_interval = Duration::from_secs(300); // 5 minutes
        let mut timestamps = self.scan_record_timestamps.lock().unwrap();
        let now = Instant::now();

        if let Some(last) = timestamps.get(scanner) {
            if now.duration_since(*last) < min_interval {
                return;
            }
        }

        timestamps.insert(scanner.to_string(), now);
        drop(timestamps);

        let db = self.db.lock().unwrap();
        let _ = db.record_scan(scanner, data);
    }
}
