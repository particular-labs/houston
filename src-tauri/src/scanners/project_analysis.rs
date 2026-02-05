use rayon::prelude::*;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use std::process::Command;
use walkdir::WalkDir;

use crate::registry::{detect, get_storage_dirs_by_type};

/// Maximum number of files to scan per directory to prevent slowdowns
const MAX_FILES_PER_DIR: usize = 100_000;

// ============================================================================
// Data Structures
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SizeInfo {
    pub bytes: u64,
    pub display: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DirectorySize {
    pub name: String,
    pub size: SizeInfo,
    pub category: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JsDetails {
    pub node_modules_size: Option<SizeInfo>,
    pub dependency_count: usize,
    pub dev_dependency_count: usize,
    pub scripts: Vec<String>,
    pub engines: Option<String>,
    pub license: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RustDetails {
    pub target_size: Option<SizeInfo>,
    pub dependency_count: usize,
    pub edition: Option<String>,
    pub features: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PythonDetails {
    pub venv_size: Option<SizeInfo>,
    pub dependency_count: usize,
    pub python_version: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GoDetails {
    pub vendor_size: Option<SizeInfo>,
    pub module_count: usize,
    pub go_version: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum LanguageDetails {
    JavaScript(JsDetails),
    Rust(RustDetails),
    Python(PythonDetails),
    Go(GoDetails),
    Other,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtendedGitInfo {
    pub total_commits: usize,
    pub contributors: Vec<String>,
    pub first_commit_date: Option<String>,
    pub tags: Vec<String>,
    pub stash_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectAnalysis {
    pub path: String,
    pub name: String,
    pub project_type: String,
    pub framework: String,
    pub total_size: SizeInfo,
    pub code_size: SizeInfo,
    pub language_details: LanguageDetails,
    pub storage_breakdown: Vec<DirectorySize>,
    pub git_info: Option<ExtendedGitInfo>,
    pub analyzed_at: String,
}

// ============================================================================
// Size Calculation
// ============================================================================

/// Format bytes as a human-readable string (e.g., "1.2 GB")
pub fn format_bytes(bytes: u64) -> String {
    const KB: u64 = 1024;
    const MB: u64 = KB * 1024;
    const GB: u64 = MB * 1024;

    if bytes >= GB {
        format!("{:.1} GB", bytes as f64 / GB as f64)
    } else if bytes >= MB {
        format!("{:.1} MB", bytes as f64 / MB as f64)
    } else if bytes >= KB {
        format!("{:.1} KB", bytes as f64 / KB as f64)
    } else {
        format!("{} B", bytes)
    }
}

fn make_size_info(bytes: u64) -> SizeInfo {
    SizeInfo {
        bytes,
        display: format_bytes(bytes),
    }
}

/// Calculate directory size using parallel traversal with rayon.
/// Caps at MAX_FILES_PER_DIR to prevent slowdowns on large directories.
pub fn calculate_dir_size(path: &Path) -> u64 {
    if !path.exists() || !path.is_dir() {
        return 0;
    }

    let entries: Vec<_> = WalkDir::new(path)
        .into_iter()
        .filter_map(|e| e.ok())
        .take(MAX_FILES_PER_DIR)
        .collect();

    entries
        .par_iter()
        .filter_map(|entry| entry.metadata().ok())
        .filter(|meta| meta.is_file())
        .map(|meta| meta.len())
        .sum()
}

/// Calculate directory size if it exists, returning None otherwise
fn calculate_optional_dir_size(path: &Path) -> Option<SizeInfo> {
    if path.exists() && path.is_dir() {
        let bytes = calculate_dir_size(path);
        Some(make_size_info(bytes))
    } else {
        None
    }
}

// ============================================================================
// Directory Discovery (using registry)
// ============================================================================

fn discover_storage_dirs(path: &Path, project_type: &str) -> Vec<DirectorySize> {
    // Get storage dirs from registry
    let type_dirs = get_storage_dirs_by_type(project_type);

    type_dirs
        .par_iter()
        .filter_map(|dir| {
            let dir_path = path.join(dir.name);
            if dir_path.exists() && dir_path.is_dir() {
                let bytes = calculate_dir_size(&dir_path);
                Some(DirectorySize {
                    name: dir.name.to_string(),
                    size: make_size_info(bytes),
                    category: dir.category.to_string(),
                })
            } else {
                None
            }
        })
        .collect()
}

// ============================================================================
// Language-Specific Parsing
// ============================================================================

fn parse_package_json(path: &Path) -> JsDetails {
    let pkg_path = path.join("package.json");
    let mut details = JsDetails {
        node_modules_size: calculate_optional_dir_size(&path.join("node_modules")),
        dependency_count: 0,
        dev_dependency_count: 0,
        scripts: Vec::new(),
        engines: None,
        license: None,
    };

    if let Ok(content) = fs::read_to_string(&pkg_path) {
        if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
            // Dependencies
            if let Some(deps) = json.get("dependencies").and_then(|d| d.as_object()) {
                details.dependency_count = deps.len();
            }

            // Dev dependencies
            if let Some(deps) = json.get("devDependencies").and_then(|d| d.as_object()) {
                details.dev_dependency_count = deps.len();
            }

            // Scripts
            if let Some(scripts) = json.get("scripts").and_then(|s| s.as_object()) {
                details.scripts = scripts.keys().cloned().collect();
            }

            // Engines
            if let Some(engines) = json.get("engines").and_then(|e| e.as_object()) {
                let engine_str: Vec<String> = engines
                    .iter()
                    .map(|(k, v)| format!("{}: {}", k, v.as_str().unwrap_or("?")))
                    .collect();
                if !engine_str.is_empty() {
                    details.engines = Some(engine_str.join(", "));
                }
            }

            // License
            if let Some(license) = json.get("license").and_then(|l| l.as_str()) {
                details.license = Some(license.to_string());
            }
        }
    }

    details
}

fn parse_cargo_project(path: &Path) -> RustDetails {
    let mut details = RustDetails {
        target_size: calculate_optional_dir_size(&path.join("target")),
        dependency_count: 0,
        edition: None,
        features: Vec::new(),
    };

    // Parse Cargo.lock for dependency count
    let lock_path = path.join("Cargo.lock");
    if let Ok(content) = fs::read_to_string(&lock_path) {
        // Count [[package]] entries (excluding the project itself)
        details.dependency_count = content.matches("[[package]]").count().saturating_sub(1);
    }

    // Parse Cargo.toml for edition and features
    let toml_path = path.join("Cargo.toml");
    if let Ok(content) = fs::read_to_string(&toml_path) {
        // Extract edition
        for line in content.lines() {
            let trimmed = line.trim();
            if trimmed.starts_with("edition") {
                if let Some(val) = trimmed.split('=').nth(1) {
                    let edition = val.trim().trim_matches('"').trim_matches('\'');
                    details.edition = Some(edition.to_string());
                    break;
                }
            }
        }

        // Extract features (simple parsing)
        let mut in_features = false;
        for line in content.lines() {
            let trimmed = line.trim();
            if trimmed == "[features]" {
                in_features = true;
                continue;
            }
            if in_features {
                if trimmed.starts_with('[') {
                    break;
                }
                if trimmed.contains('=') {
                    if let Some(feature_name) = trimmed.split('=').next() {
                        let name = feature_name.trim();
                        if !name.is_empty() && name != "default" {
                            details.features.push(name.to_string());
                        }
                    }
                }
            }
        }
    }

    details
}

fn parse_python_project(path: &Path) -> PythonDetails {
    let mut details = PythonDetails {
        venv_size: calculate_optional_dir_size(&path.join("venv"))
            .or_else(|| calculate_optional_dir_size(&path.join(".venv"))),
        dependency_count: 0,
        python_version: None,
    };

    // Count dependencies from requirements.txt
    let req_path = path.join("requirements.txt");
    if let Ok(content) = fs::read_to_string(&req_path) {
        details.dependency_count = content
            .lines()
            .filter(|line| {
                let trimmed = line.trim();
                !trimmed.is_empty() && !trimmed.starts_with('#') && !trimmed.starts_with('-')
            })
            .count();
    }

    // Try pyproject.toml for dependency count and python version
    let pyproject_path = path.join("pyproject.toml");
    if let Ok(content) = fs::read_to_string(&pyproject_path) {
        // Simple parsing for python version
        for line in content.lines() {
            let trimmed = line.trim();
            if trimmed.starts_with("requires-python") || trimmed.starts_with("python") {
                if let Some(val) = trimmed.split('=').nth(1) {
                    let version = val.trim().trim_matches('"').trim_matches('\'');
                    details.python_version = Some(version.to_string());
                    break;
                }
            }
        }

        // Count dependencies if requirements.txt wasn't found
        if details.dependency_count == 0 {
            let mut in_deps = false;
            for line in content.lines() {
                let trimmed = line.trim();
                if trimmed == "[project.dependencies]" || trimmed == "dependencies = [" {
                    in_deps = true;
                    continue;
                }
                if in_deps {
                    if trimmed.starts_with('[') || trimmed == "]" {
                        break;
                    }
                    if trimmed.starts_with('"') || trimmed.starts_with('\'') {
                        details.dependency_count += 1;
                    }
                }
            }
        }
    }

    details
}

fn parse_go_project(path: &Path) -> GoDetails {
    let mut details = GoDetails {
        vendor_size: calculate_optional_dir_size(&path.join("vendor")),
        module_count: 0,
        go_version: None,
    };

    // Parse go.mod
    let mod_path = path.join("go.mod");
    if let Ok(content) = fs::read_to_string(&mod_path) {
        // Get Go version
        for line in content.lines() {
            let trimmed = line.trim();
            if trimmed.starts_with("go ") {
                details.go_version = Some(trimmed[3..].trim().to_string());
                break;
            }
        }

        // Count require statements
        let mut in_require = false;
        for line in content.lines() {
            let trimmed = line.trim();
            if trimmed == "require (" {
                in_require = true;
                continue;
            }
            if trimmed == ")" {
                in_require = false;
                continue;
            }
            if in_require && !trimmed.is_empty() && !trimmed.starts_with("//") {
                details.module_count += 1;
            }
            // Single-line require
            if trimmed.starts_with("require ") && !trimmed.ends_with('(') {
                details.module_count += 1;
            }
        }
    }

    // Also check go.sum for more accurate count
    let sum_path = path.join("go.sum");
    if details.module_count == 0 {
        if let Ok(content) = fs::read_to_string(&sum_path) {
            // Each module has 2 lines in go.sum (one for mod, one for hash)
            let line_count = content.lines().count();
            details.module_count = line_count / 2;
        }
    }

    details
}

// ============================================================================
// Git Information
// ============================================================================

fn run_git_command(path: &Path, args: &[&str]) -> Option<String> {
    Command::new("git")
        .args(args)
        .current_dir(path)
        .output()
        .ok()
        .filter(|output| output.status.success())
        .map(|output| String::from_utf8_lossy(&output.stdout).trim().to_string())
}

fn get_extended_git_info(path: &Path) -> Option<ExtendedGitInfo> {
    // Check if it's a git repo
    if !path.join(".git").exists() {
        return None;
    }

    // Total commits
    let total_commits = run_git_command(path, &["rev-list", "--count", "HEAD"])
        .and_then(|s| s.parse().ok())
        .unwrap_or(0);

    // Top contributors (top 5)
    let contributors = run_git_command(path, &["shortlog", "-sn", "--no-merges", "HEAD"])
        .map(|output| {
            output
                .lines()
                .take(5)
                .filter_map(|line| {
                    let parts: Vec<&str> = line.trim().splitn(2, '\t').collect();
                    parts.get(1).map(|s| s.to_string())
                })
                .collect()
        })
        .unwrap_or_default();

    // First commit date
    let first_commit_date = run_git_command(path, &["log", "--reverse", "--format=%ar", "-1"]);

    // Recent tags (top 5)
    let tags = run_git_command(path, &["tag", "--sort=-creatordate"])
        .map(|output| output.lines().take(5).map(|s| s.to_string()).collect())
        .unwrap_or_default();

    // Stash count
    let stash_count = run_git_command(path, &["stash", "list"])
        .map(|output| output.lines().count())
        .unwrap_or(0);

    Some(ExtendedGitInfo {
        total_commits,
        contributors,
        first_commit_date,
        tags,
        stash_count,
    })
}

// ============================================================================
// Project Name Detection
// ============================================================================

fn get_project_name(path: &Path) -> String {
    // Try package.json first
    if let Ok(content) = fs::read_to_string(path.join("package.json")) {
        if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
            if let Some(name) = json.get("name").and_then(|n| n.as_str()) {
                if !name.is_empty() {
                    return name.to_string();
                }
            }
        }
    }
    // Try Cargo.toml
    if let Ok(content) = fs::read_to_string(path.join("Cargo.toml")) {
        for line in content.lines() {
            let trimmed = line.trim();
            if trimmed.starts_with('[') && trimmed != "[package]" {
                break;
            }
            if trimmed.starts_with("name") {
                if let Some(val) = trimmed.split('=').nth(1) {
                    let name = val.trim().trim_matches('"');
                    if !name.is_empty() {
                        return name.to_string();
                    }
                }
            }
        }
    }
    // Fallback to directory name
    path.file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| "Unknown".to_string())
}

// ============================================================================
// Main Analysis Function
// ============================================================================

/// Analyze a project directory and return comprehensive information
pub fn analyze_project(project_path: &str) -> Result<ProjectAnalysis, String> {
    let path = Path::new(project_path);

    if !path.exists() {
        return Err(format!("Path does not exist: {}", project_path));
    }

    if !path.is_dir() {
        return Err(format!("Path is not a directory: {}", project_path));
    }

    let name = get_project_name(path);

    // Use registry for detection
    let detection = detect(path).ok_or_else(|| "Not a recognized project directory".to_string())?;
    let project_type = detection.category_display;
    let framework = detection.framework;
    let language_display = detection.language_display;

    // Calculate storage breakdown in parallel
    let storage_breakdown = discover_storage_dirs(path, &language_display);

    // Calculate total size of the project
    let total_bytes = calculate_dir_size(path);

    // Calculate artifact size (sum of storage_breakdown)
    let artifact_bytes: u64 = storage_breakdown.iter().map(|d| d.size.bytes).sum();

    // Code size is total minus artifacts
    let code_bytes = total_bytes.saturating_sub(artifact_bytes);

    // Parse language-specific details based on detected language
    let language_details = match language_display.as_str() {
        "JavaScript/TypeScript" => LanguageDetails::JavaScript(parse_package_json(path)),
        "Rust" => LanguageDetails::Rust(parse_cargo_project(path)),
        "Python" => LanguageDetails::Python(parse_python_project(path)),
        "Go" => LanguageDetails::Go(parse_go_project(path)),
        _ => LanguageDetails::Other,
    };

    // Get extended git info
    let git_info = get_extended_git_info(path);

    let analyzed_at = chrono::Utc::now().to_rfc3339();

    Ok(ProjectAnalysis {
        path: project_path.to_string(),
        name,
        project_type,
        framework,
        total_size: make_size_info(total_bytes),
        code_size: make_size_info(code_bytes),
        language_details,
        storage_breakdown,
        git_info,
        analyzed_at,
    })
}
