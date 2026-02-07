//! Shared cache for outdated package queries.
//!
//! Both diagnostics and AI tools scanners run the same expensive commands:
//! - `brew outdated --json`
//! - `npm outdated -g --json`
//! - `pip3 list --outdated --format=json`
//!
//! This module provides a shared cache with a 10-minute TTL so these
//! commands run at most once per 10 minutes regardless of how many
//! consumers need the data.

use serde_json::Value;
use std::process::Command;
use std::sync::Mutex;
use std::time::{Duration, Instant};

struct CachedResult {
    data: Value,
    fetched_at: Instant,
}

static BREW_CACHE: Mutex<Option<CachedResult>> = Mutex::new(None);
static NPM_CACHE: Mutex<Option<CachedResult>> = Mutex::new(None);
static PIP_CACHE: Mutex<Option<CachedResult>> = Mutex::new(None);

const CACHE_TTL: Duration = Duration::from_secs(600); // 10 minutes

fn get_or_fetch(cache: &Mutex<Option<CachedResult>>, fetch: impl FnOnce() -> Value) -> Value {
    let mut guard = cache.lock().unwrap();
    if let Some(ref cached) = *guard {
        if cached.fetched_at.elapsed() < CACHE_TTL {
            return cached.data.clone();
        }
    }
    let data = fetch();
    *guard = Some(CachedResult {
        data: data.clone(),
        fetched_at: Instant::now(),
    });
    data
}

/// Get brew outdated JSON (cached). Returns `{"formulae": [...], "casks": [...]}` or null.
pub fn brew_outdated_json() -> Value {
    get_or_fetch(&BREW_CACHE, || {
        if cfg!(target_os = "windows") {
            return Value::Null;
        }
        let output = Command::new("brew")
            .args(["outdated", "--json"])
            .output();
        match output {
            Ok(o) if o.status.success() => {
                let stdout = String::from_utf8_lossy(&o.stdout);
                serde_json::from_str(&stdout).unwrap_or(Value::Null)
            }
            _ => Value::Null,
        }
    })
}

/// Get npm outdated JSON (cached). Returns `{"pkg": {"current": ..., "latest": ...}}` or null.
pub fn npm_outdated_json() -> Value {
    get_or_fetch(&NPM_CACHE, || {
        let output = Command::new("npm")
            .args(["outdated", "-g", "--json"])
            .output();
        match output {
            Ok(o) => {
                let stdout = String::from_utf8_lossy(&o.stdout);
                serde_json::from_str(&stdout).unwrap_or(Value::Null)
            }
            _ => Value::Null,
        }
    })
}

/// Get pip outdated JSON (cached). Returns `[{"name": ..., "version": ..., "latest_version": ...}]` or null.
pub fn pip_outdated_json() -> Value {
    get_or_fetch(&PIP_CACHE, || {
        let output = Command::new("pip3")
            .args(["list", "--outdated", "--format=json"])
            .output();
        match output {
            Ok(o) if o.status.success() => {
                let stdout = String::from_utf8_lossy(&o.stdout);
                serde_json::from_str(&stdout).unwrap_or(Value::Null)
            }
            _ => Value::Null,
        }
    })
}
