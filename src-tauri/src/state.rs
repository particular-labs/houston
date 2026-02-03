use serde::Serialize;
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

use crate::scanners::{
    ai_tools::AiToolsReport,
    claude::ClaudeConfig,
    diagnostics::DiagnosticReport,
    environment::EnvVarInfo,
    git::GitStatus,
    languages::LanguageInfo,
    packages::PackageList,
    path::PathEntry,
    system::SystemInfo,
    workspace::ProjectInfo,
};

pub struct AppState {
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
    // App-level
    pub startup_instant: Instant,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            system_cache: Mutex::new(ScanCache::new(300)),
            path_cache: Mutex::new(ScanCache::new(60)),
            language_cache: Mutex::new(ScanCache::new(120)),
            env_cache: Mutex::new(ScanCache::new(60)),
            workspace_paths: Mutex::new(Vec::new()),
            project_cache: Mutex::new(ScanCache::new(60)),
            git_cache: Mutex::new(ScanCache::new(30)),
            package_cache: Mutex::new(ScanCache::new(300)),
            claude_cache: Mutex::new(ScanCache::new(300)),
            diagnostics_cache: Mutex::new(ScanCache::new(120)),
            ai_tools_cache: Mutex::new(ScanCache::new(120)),
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
            startup_instant: Instant::now(),
        }
    }
}
