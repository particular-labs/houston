//! Centralized project detection registry.
//!
//! This module provides a single source of truth for all project type,
//! language, framework, and app category detection. It consolidates
//! detection logic into a declarative registry system.
//!
//! # Usage
//!
//! ```rust,ignore
//! use crate::registry::{detect, is_project_dir, get_storage_dirs_by_type};
//!
//! let path = Path::new("/path/to/project");
//!
//! // Check if it's a project directory
//! if is_project_dir(path) {
//!     // Detect project characteristics
//!     if let Some(result) = detect(path) {
//!         println!("Language: {}", result.language_display);
//!         println!("Framework: {}", result.framework);
//!         println!("Category: {}", result.category_display);
//!         println!("Package Manager: {}", result.package_manager_display);
//!     }
//! }
//!
//! // Get storage directories for a language type
//! let dirs = get_storage_dirs_by_type("JavaScript/TypeScript");
//! ```
//!
//! # Design
//!
//! The module is structured for future extraction as a standalone `repo-probe` crate:
//!
//! - `types.rs` - Core type definitions (Language, AppCategory, etc.)
//! - `data.rs` - Static registry data with all frameworks
//! - `detector.rs` - Detection engine functions
//!
//! All detection rules are declarative and defined in `data.rs`, making it easy
//! to add new languages and frameworks without modifying detection logic.

pub mod data;
pub mod detector;
pub mod types;

// Re-export main detection functions used by the application
pub use detector::{detect, get_storage_dirs_by_type, is_project_dir};

// Re-export registry data used by the application
pub use data::SKIP_DIRS;

// Re-export types that are part of the public API (for future crate extraction)
// These are intentionally exported even if not currently used internally
#[allow(unused_imports)]
pub use types::{
    AppCategory, DetectionResult, DetectionSource, FrameworkRule, Language,
    LanguageEntry, LockfileEntry, PackageManager, StorageDir,
};

// Re-export additional functions that are part of the public API
#[allow(unused_imports)]
pub use detector::{
    detect_framework_name, detect_language_name, detect_package_manager,
    detect_project_type, get_storage_dirs, skip_dirs,
};

// Re-export additional data that is part of the public API
#[allow(unused_imports)]
pub use data::{COMMON_STORAGE_DIRS, REGISTRY};
