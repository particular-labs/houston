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
}

use crate::scanners::{
    claude::ClaudeConfig,
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
        }
    }
}
