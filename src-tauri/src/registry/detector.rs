//! Detection engine for project type, language, framework, and package manager.
//!
//! This module provides the core detection logic that uses the registry data
//! to identify project characteristics. It's designed to be efficient and
//! cache-friendly for repeated calls.

use std::fs;
use std::path::Path;

use super::data::{REGISTRY, SKIP_DIRS, COMMON_STORAGE_DIRS};
use super::types::{
    AppCategory, DetectionResult, DetectionSource, FrameworkRule, Language,
    LanguageEntry, PackageManager, StorageDir,
};

// ============================================================================
// Main Detection Functions
// ============================================================================

/// Detect project type, language, framework, and package manager.
/// Returns None if the path is not a recognized project directory.
pub fn detect(path: &Path) -> Option<DetectionResult> {
    // First, find the language entry based on manifest files
    let entry = detect_language_entry(path)?;

    // Read manifest content for framework detection
    let manifest_content = read_manifest_content(path, entry);

    // Detect framework
    let (framework, category) = detect_framework(path, entry, &manifest_content);

    // Detect package manager
    let package_manager = detect_package_manager_for_entry(path, entry);

    Some(DetectionResult {
        language: entry.language,
        language_display: entry.display_name.to_string(),
        framework: framework.to_string(),
        category,
        category_display: category.as_str().to_string(),
        package_manager,
        package_manager_display: package_manager.as_str().to_string(),
    })
}

/// Check if a path is a project directory (contains any manifest file)
pub fn is_project_dir(path: &Path) -> bool {
    REGISTRY.iter().any(|entry| {
        manifest_exists(path, entry.manifest)
            || entry.alt_manifests.iter().any(|m| manifest_exists(path, m))
    })
}

/// Get storage directories for a given language
#[allow(dead_code)]
pub fn get_storage_dirs(language: Language) -> Vec<&'static StorageDir> {
    let mut dirs: Vec<&StorageDir> = REGISTRY
        .iter()
        .find(|e| e.language == language)
        .map(|e| e.storage_dirs.iter().collect())
        .unwrap_or_default();

    // Add common storage dirs
    dirs.extend(COMMON_STORAGE_DIRS.iter());
    dirs
}

/// Get storage directories by project type string (for backward compatibility)
pub fn get_storage_dirs_by_type(project_type: &str) -> Vec<&'static StorageDir> {
    let mut dirs: Vec<&StorageDir> = REGISTRY
        .iter()
        .find(|e| e.display_name == project_type)
        .map(|e| e.storage_dirs.iter().collect())
        .unwrap_or_default();

    // Add common storage dirs
    dirs.extend(COMMON_STORAGE_DIRS.iter());
    dirs
}

/// Get the list of directories to skip during scanning
#[allow(dead_code)]
pub fn skip_dirs() -> &'static [&'static str] {
    SKIP_DIRS
}

/// Detect only the package manager for a path
#[allow(dead_code)]
pub fn detect_package_manager(path: &Path) -> PackageManager {
    // Check all lockfiles from all languages
    for entry in REGISTRY.iter() {
        for lockfile in entry.lockfiles.iter() {
            if path.join(lockfile.file).exists() {
                return lockfile.manager;
            }
        }
    }
    PackageManager::Unknown
}

// ============================================================================
// Internal Detection Functions
// ============================================================================

/// Find the language entry that matches the project at the given path
fn detect_language_entry(path: &Path) -> Option<&'static LanguageEntry> {
    // Check primary manifests first (in registry order = priority order)
    for entry in REGISTRY.iter() {
        if manifest_exists(path, entry.manifest) {
            return Some(entry);
        }
    }

    // Check alternative manifests
    for entry in REGISTRY.iter() {
        for alt_manifest in entry.alt_manifests.iter() {
            if manifest_exists(path, alt_manifest) {
                return Some(entry);
            }
        }
    }

    None
}

/// Check if a manifest file exists (supports glob patterns for C#)
fn manifest_exists(path: &Path, manifest: &str) -> bool {
    if manifest.contains('*') {
        // Handle glob patterns like "*.csproj"
        if let Ok(entries) = fs::read_dir(path) {
            let pattern = manifest.trim_start_matches('*');
            return entries
                .filter_map(|e| e.ok())
                .any(|e| e.file_name().to_string_lossy().ends_with(pattern));
        }
        false
    } else {
        path.join(manifest).exists()
    }
}

/// Read the content of the primary manifest file
fn read_manifest_content(path: &Path, entry: &LanguageEntry) -> String {
    // Try primary manifest
    if let Ok(content) = fs::read_to_string(path.join(entry.manifest)) {
        return content;
    }

    // Try alternative manifests
    for alt in entry.alt_manifests.iter() {
        if !alt.contains('*') {
            if let Ok(content) = fs::read_to_string(path.join(alt)) {
                return content;
            }
        }
    }

    String::new()
}

/// Detect framework based on manifest content and file structure
fn detect_framework(
    path: &Path,
    entry: &LanguageEntry,
    manifest_content: &str,
) -> (&'static str, AppCategory) {
    let content_lower = manifest_content.to_lowercase();

    // Special handling for specific languages
    match entry.language {
        Language::JavaScript => {
            return detect_js_framework(path, manifest_content, entry);
        }
        Language::Python => {
            // Check for Django's manage.py first
            if path.join("manage.py").exists() {
                return ("Django", AppCategory::Backend);
            }
            // Also check requirements.txt content
            let combined = get_combined_python_content(path, manifest_content);
            return detect_framework_from_rules(path, entry, &combined);
        }
        Language::Dart => {
            return detect_flutter_category(path, entry);
        }
        Language::Swift => {
            return detect_swift_project(path, entry);
        }
        Language::Java => {
            // Check for Android project
            if is_android_project(path) {
                return ("Android", AppCategory::MobileApp);
            }
        }
        _ => {}
    }

    // Generic framework detection from rules
    detect_framework_from_rules(path, entry, &content_lower)
}

/// Detect framework by matching rules against content
fn detect_framework_from_rules(
    _path: &Path,
    entry: &LanguageEntry,
    content: &str,
) -> (&'static str, AppCategory) {
    // Sort frameworks by priority (highest first)
    let mut frameworks: Vec<&FrameworkRule> = entry.frameworks.iter().collect();
    frameworks.sort_by(|a, b| b.priority.cmp(&a.priority));

    for rule in frameworks {
        if matches_rule(content, rule) {
            return (rule.name, rule.category);
        }
    }

    (entry.default_framework, entry.default_category)
}

/// Check if content matches a framework rule
fn matches_rule(content: &str, rule: &FrameworkRule) -> bool {
    match rule.source {
        DetectionSource::ManifestContent => {
            // For rules with multiple patterns, check if any match
            rule.patterns.iter().any(|pattern| {
                content.contains(&pattern.to_lowercase())
            })
        }
        DetectionSource::FileExists | DetectionSource::DirectoryExists => {
            // These are handled separately in language-specific detection
            false
        }
    }
}

/// Detect JavaScript framework with special handling for combined patterns
fn detect_js_framework(
    path: &Path,
    content: &str,
    entry: &LanguageEntry,
) -> (&'static str, AppCategory) {
    let content_lower = content.to_lowercase();

    // Check for src-tauri directory (Tauri marker)
    if path.join("src-tauri").exists() {
        return ("Tauri", AppCategory::DesktopApp);
    }

    // Sort frameworks by priority
    let mut frameworks: Vec<&FrameworkRule> = entry.frameworks.iter().collect();
    frameworks.sort_by(|a, b| b.priority.cmp(&a.priority));

    // Special handling for "React + Vite" which requires both patterns
    for rule in &frameworks {
        if rule.name == "React + Vite" {
            let has_all = rule.patterns.iter().all(|p| content_lower.contains(&p.to_lowercase()));
            if has_all {
                return (rule.name, rule.category);
            }
        }
    }

    // Check other frameworks
    for rule in &frameworks {
        if rule.name == "React + Vite" {
            continue; // Already checked
        }
        if matches_rule(&content_lower, rule) {
            return (rule.name, rule.category);
        }
    }

    (entry.default_framework, entry.default_category)
}

/// Get combined Python manifest content (pyproject.toml + requirements.txt)
fn get_combined_python_content(path: &Path, pyproject_content: &str) -> String {
    let mut combined = pyproject_content.to_lowercase();

    if let Ok(req_content) = fs::read_to_string(path.join("requirements.txt")) {
        combined.push('\n');
        combined.push_str(&req_content.to_lowercase());
    }

    combined
}

/// Detect Flutter app category based on platform directories
fn detect_flutter_category(path: &Path, entry: &LanguageEntry) -> (&'static str, AppCategory) {
    let has_android = path.join("android").exists();
    let has_ios = path.join("ios").exists();
    let has_web = path.join("web").exists();
    let has_macos = path.join("macos").exists();
    let has_linux = path.join("linux").exists();
    let has_windows = path.join("windows").exists();

    let has_desktop = has_macos || has_linux || has_windows;
    let has_mobile = has_android || has_ios;

    // Check if it's actually Flutter
    if let Ok(content) = fs::read_to_string(path.join("pubspec.yaml")) {
        if content.contains("flutter") {
            let category = if has_desktop && has_mobile {
                AppCategory::MobileApp // Cross-platform, mobile-first
            } else if has_desktop {
                AppCategory::DesktopApp
            } else if has_mobile {
                AppCategory::MobileApp
            } else if has_web {
                AppCategory::WebApp
            } else {
                AppCategory::Library
            };
            return ("Flutter", category);
        }
    }

    (entry.default_framework, entry.default_category)
}

/// Detect Swift/Apple project type
fn detect_swift_project(path: &Path, entry: &LanguageEntry) -> (&'static str, AppCategory) {
    // Check for SwiftUI markers
    if find_swift_files_with_content(path, "SwiftUI") {
        return ("SwiftUI", AppCategory::MobileApp);
    }

    // Check for Vapor (backend)
    if let Ok(content) = fs::read_to_string(path.join("Package.swift")) {
        if content.contains("vapor/vapor") || content.contains("Vapor") {
            return ("Vapor", AppCategory::Backend);
        }
    }

    // Check for Xcode project indicators
    let has_xcode = has_xcode_project(path);
    let has_ios = path.join("ios").exists();
    let has_macos = path.join("macos").exists() || path.join("macOS").exists();

    if has_xcode {
        if has_ios || has_info_plist_with_app(path) {
            if has_macos {
                return ("Swift", AppCategory::DesktopApp);
            }
            return ("Swift", AppCategory::MobileApp);
        } else if has_macos {
            return ("Swift", AppCategory::DesktopApp);
        }
    }

    (entry.default_framework, entry.default_category)
}

/// Check for Xcode project files
fn has_xcode_project(path: &Path) -> bool {
    if let Ok(entries) = fs::read_dir(path) {
        for entry in entries.flatten() {
            let name = entry.file_name().to_string_lossy().to_string();
            if name.ends_with(".xcodeproj") || name.ends_with(".xcworkspace") {
                return true;
            }
        }
    }
    path.join("Package.swift").exists()
}

/// Check for Info.plist indicating an app bundle
fn has_info_plist_with_app(path: &Path) -> bool {
    path.join("Info.plist").exists()
        || path.join("iOS/Info.plist").exists()
        || path.join("macOS/Info.plist").exists()
}

/// Search Swift files for specific content
fn find_swift_files_with_content(path: &Path, search: &str) -> bool {
    let check_dirs = ["Sources", "src", "."];
    for dir in check_dirs {
        let check_path = if dir == "." { path.to_path_buf() } else { path.join(dir) };
        if let Ok(entries) = fs::read_dir(&check_path) {
            for entry in entries.flatten().take(20) {
                let entry_path = entry.path();
                if entry_path.extension().map(|e| e == "swift").unwrap_or(false) {
                    if let Ok(content) = fs::read_to_string(&entry_path) {
                        if content.contains(search) {
                            return true;
                        }
                    }
                }
            }
        }
    }
    false
}

/// Check if path is an Android project
fn is_android_project(path: &Path) -> bool {
    (path.join("build.gradle").exists() || path.join("build.gradle.kts").exists())
        && (path.join("app").exists() || path.join("src/main/AndroidManifest.xml").exists())
}

/// Detect package manager for a specific language entry
fn detect_package_manager_for_entry(path: &Path, entry: &LanguageEntry) -> PackageManager {
    // Check lockfiles for this language first
    for lockfile in entry.lockfiles.iter() {
        if path.join(lockfile.file).exists() {
            return lockfile.manager;
        }
    }

    // Check all other lockfiles
    for other_entry in REGISTRY.iter() {
        if other_entry.language != entry.language {
            for lockfile in other_entry.lockfiles.iter() {
                if path.join(lockfile.file).exists() {
                    return lockfile.manager;
                }
            }
        }
    }

    entry.default_manager
}

// ============================================================================
// Utility Functions for Backward Compatibility
// ============================================================================

/// Detect project type and framework (backward compatible API)
/// Returns (project_type, framework) tuple
#[allow(dead_code)]
pub fn detect_project_type(path: &Path) -> (String, String) {
    match detect(path) {
        Some(result) => (result.category_display, result.framework),
        None => ("Unknown".to_string(), String::new()),
    }
}

/// Detect only the framework name (backward compatible API)
#[allow(dead_code)]
pub fn detect_framework_name(path: &Path) -> String {
    detect(path)
        .map(|r| r.framework)
        .unwrap_or_default()
}

/// Get the language display name for a path
#[allow(dead_code)]
pub fn detect_language_name(path: &Path) -> String {
    detect_language_entry(path)
        .map(|e| e.display_name.to_string())
        .unwrap_or_else(|| "Unknown".to_string())
}
