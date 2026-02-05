//! Demo mode module for Houston.
//!
//! When launched with `--demo` flag, Houston returns mock data instead of real
//! system information. This allows taking screenshots for documentation without
//! exposing personal project names, paths, or system details.

pub mod data;

use std::sync::atomic::{AtomicBool, Ordering};

/// Global demo mode flag.
static DEMO_MODE: AtomicBool = AtomicBool::new(false);

/// Enable demo mode globally.
pub fn enable() {
    DEMO_MODE.store(true, Ordering::SeqCst);
}

/// Check if demo mode is enabled.
pub fn is_enabled() -> bool {
    DEMO_MODE.load(Ordering::SeqCst)
}

// Re-export mock data functions for convenience
pub use data::{
    mock_ai_tools, mock_diagnostics, mock_env_vars, mock_git_statuses, mock_languages,
    mock_packages, mock_path_entries, mock_projects, mock_system_info,
};
