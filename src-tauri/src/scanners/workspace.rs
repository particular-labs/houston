use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

use crate::registry::{detect, get_storage_dirs_by_type, is_project_dir, SKIP_DIRS};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectHealthScore {
    pub grade: String,
    pub percentage: u8,
    pub has_readme: bool,
    pub has_license: bool,
    pub has_tests: bool,
    pub has_ci: bool,
    pub has_gitignore: bool,
    pub has_linter: bool,
    pub has_type_checking: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VersionFile {
    pub name: String,
    pub expected_version: String,
    pub language: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectInfo {
    pub name: String,
    pub path: String,
    pub project_type: String,
    pub framework: String,
    pub package_manager: String,
    pub description: String,
    pub has_git: bool,
    pub group: String,
    pub group_type: String,
    pub is_monorepo_root: bool,
    pub worktree_id: String,
    pub ai_context_files: Vec<String>,
    pub health_score: Option<ProjectHealthScore>,
    pub has_build_artifacts: bool,
    pub version_files: Vec<VersionFile>,
}

fn get_project_name(path: &Path) -> Option<String> {
    // Try package.json first
    if let Ok(content) = fs::read_to_string(path.join("package.json")) {
        if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
            if let Some(name) = json.get("name").and_then(|n| n.as_str()) {
                if !name.is_empty() {
                    return Some(name.to_string());
                }
            }
        }
    }
    // Try Cargo.toml (before any [workspace]/[dependencies] section)
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
                        return Some(name.to_string());
                    }
                }
            }
        }
    }
    None
}

fn get_description(path: &Path) -> String {
    // Try package.json first
    if let Ok(content) = fs::read_to_string(path.join("package.json")) {
        if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
            if let Some(desc) = json.get("description").and_then(|d| d.as_str()) {
                if !desc.is_empty() {
                    return desc.to_string();
                }
            }
        }
    }
    // Try Cargo.toml
    if let Ok(content) = fs::read_to_string(path.join("Cargo.toml")) {
        for line in content.lines() {
            if line.starts_with("description") {
                if let Some(desc) = line.split('=').nth(1) {
                    let desc = desc.trim().trim_matches('"');
                    if !desc.is_empty() {
                        return desc.to_string();
                    }
                }
            }
        }
    }
    String::new()
}

fn detect_ai_context_files(path: &Path) -> Vec<String> {
    let candidates = [
        "CLAUDE.md",
        ".cursorrules",
        ".github/copilot-instructions.md",
        "AGENTS.md",
    ];
    candidates
        .iter()
        .filter(|f| path.join(f).exists())
        .map(|f| f.to_string())
        .collect()
}

fn calculate_health_score(path: &Path) -> ProjectHealthScore {
    let has_readme = ["README.md", "README.rst", "README.txt", "README"]
        .iter()
        .any(|f| path.join(f).exists());

    let has_license = ["LICENSE", "LICENSE.md", "LICENSE.txt", "LICENCE"]
        .iter()
        .any(|f| path.join(f).exists());

    let has_tests = ["tests", "test", "__tests__", "spec"]
        .iter()
        .any(|d| path.join(d).is_dir());

    let has_ci = path.join(".github/workflows").is_dir();

    let has_gitignore = path.join(".gitignore").exists();

    let has_linter = [
        "eslint.config.js",
        "eslint.config.mjs",
        ".eslintrc",
        ".eslintrc.js",
        ".eslintrc.json",
        ".eslintrc.yml",
        "biome.json",
        "biome.jsonc",
        ".prettierrc",
    ]
    .iter()
    .any(|f| path.join(f).exists())
        || path.join("Cargo.toml").exists();

    let has_type_checking = ["tsconfig.json", "jsconfig.json", "pyproject.toml"]
        .iter()
        .any(|f| path.join(f).exists())
        || path.join("Cargo.toml").exists();

    let points = [
        has_readme,
        has_license,
        has_tests,
        has_ci,
        has_gitignore,
        has_linter,
        has_type_checking,
    ]
    .iter()
    .filter(|&&v| v)
    .count() as u8;

    let percentage = (points as f32 / 7.0 * 100.0).round() as u8;
    let grade = match percentage {
        86..=100 => "A",
        72..=85 => "B",
        58..=71 => "C",
        43..=57 => "D",
        _ => "F",
    }
    .to_string();

    ProjectHealthScore {
        grade,
        percentage,
        has_readme,
        has_license,
        has_tests,
        has_ci,
        has_gitignore,
        has_linter,
        has_type_checking,
    }
}

fn has_build_artifacts(path: &Path, language_display: &str) -> bool {
    get_storage_dirs_by_type(language_display)
        .iter()
        .filter(|d| d.category != "vcs")
        .any(|d| path.join(d.name).exists())
}

fn detect_version_files(path: &Path) -> Vec<VersionFile> {
    let candidates: &[(&str, &str)] = &[
        (".nvmrc", "node"),
        (".node-version", "node"),
        (".python-version", "python"),
        (".ruby-version", "ruby"),
    ];
    candidates
        .iter()
        .filter_map(|(file, lang)| {
            let content = fs::read_to_string(path.join(file)).ok()?;
            let version = content.trim().to_string();
            if version.is_empty() {
                return None;
            }
            Some(VersionFile {
                name: file.to_string(),
                expected_version: version,
                language: lang.to_string(),
            })
        })
        .collect()
}

fn make_project(path: &Path, group: &str, group_type: &str) -> Option<ProjectInfo> {
    // Use the registry to detect project type
    let detection = detect(path)?;

    let folder_name = path
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_default();
    let name = get_project_name(path).unwrap_or(folder_name);
    let description = get_description(path);
    let has_git = path.join(".git").exists();

    let ai_context_files = detect_ai_context_files(path);
    let health_score = Some(calculate_health_score(path));
    let build_artifacts = has_build_artifacts(path, &detection.language_display);
    let version_files = detect_version_files(path);

    Some(ProjectInfo {
        name,
        path: path.to_string_lossy().to_string(),
        project_type: detection.category_display,
        framework: detection.framework,
        package_manager: detection.package_manager_display,
        description,
        has_git,
        group: group.to_string(),
        group_type: group_type.to_string(),
        is_monorepo_root: false,
        worktree_id: String::new(),
        ai_context_files,
        health_score,
        has_build_artifacts: build_artifacts,
        version_files,
    })
}

/// Scan immediate children of a group folder for projects.
fn scan_group(dir: &Path, group_name: &str, projects: &mut Vec<ProjectInfo>) {
    let entries = match fs::read_dir(dir) {
        Ok(e) => e,
        Err(_) => return,
    };

    for entry in entries.flatten() {
        let path = entry.path();
        if !path.is_dir() {
            continue;
        }
        let dir_name = entry.file_name().to_string_lossy().to_string();
        if dir_name.starts_with('.') || SKIP_DIRS.contains(&dir_name.as_str()) {
            continue;
        }

        if let Some(project) = make_project(&path, group_name, "folder") {
            projects.push(project);
        }
    }
}

/// Try to detect pnpm workspace packages from `pnpm-workspace.yaml`.
fn detect_pnpm_workspace(root: &Path) -> Option<Vec<String>> {
    let yaml_path = root.join("pnpm-workspace.yaml");
    let content = fs::read_to_string(yaml_path).ok()?;

    let mut patterns = Vec::new();
    let mut in_packages = false;
    for line in content.lines() {
        let trimmed = line.trim();
        if trimmed.starts_with("packages:") || trimmed.starts_with("packages :") {
            in_packages = true;
            continue;
        }
        if in_packages {
            if let Some(item) = trimmed.strip_prefix("- ") {
                let pattern = item.trim().trim_matches('\'').trim_matches('"');
                if !pattern.starts_with('!') {
                    patterns.push(pattern.to_string());
                }
            } else if !trimmed.is_empty() && !trimmed.starts_with('#') {
                // We've left the packages list
                break;
            }
        }
    }

    if patterns.is_empty() {
        None
    } else {
        Some(patterns)
    }
}

/// Try to detect npm/yarn workspace packages from `package.json`.
fn detect_npm_workspaces(root: &Path) -> Option<Vec<String>> {
    let pkg_path = root.join("package.json");
    let content = fs::read_to_string(pkg_path).ok()?;
    let json: serde_json::Value = serde_json::from_str(&content).ok()?;

    // "workspaces" can be an array or an object with a "packages" key (yarn)
    let arr = match json.get("workspaces") {
        Some(serde_json::Value::Array(a)) => a.clone(),
        Some(serde_json::Value::Object(obj)) => obj
            .get("packages")
            .and_then(|v| v.as_array())
            .cloned()
            .unwrap_or_default(),
        _ => return None,
    };

    let patterns: Vec<String> = arr
        .iter()
        .filter_map(|v| v.as_str())
        .filter(|s| !s.starts_with('!'))
        .map(|s| s.to_string())
        .collect();

    if patterns.is_empty() {
        None
    } else {
        Some(patterns)
    }
}

/// Try to detect Cargo workspace members from `Cargo.toml`.
fn detect_cargo_workspace(root: &Path) -> Option<Vec<String>> {
    let cargo_path = root.join("Cargo.toml");
    let content = fs::read_to_string(cargo_path).ok()?;

    // Simple parsing: find [workspace] section, then members = [...]
    let mut in_workspace = false;
    let mut members_str = String::new();
    let mut collecting = false;
    for line in content.lines() {
        let trimmed = line.trim();
        if trimmed == "[workspace]" {
            in_workspace = true;
            continue;
        }
        if in_workspace {
            if trimmed.starts_with('[') {
                break; // New section
            }
            if trimmed.starts_with("members") {
                collecting = true;
                // Grab everything after '='
                if let Some(after) = trimmed.splitn(2, '=').nth(1) {
                    members_str.push_str(after);
                }
                if members_str.contains(']') {
                    break;
                }
                continue;
            }
            if collecting {
                members_str.push_str(trimmed);
                if members_str.contains(']') {
                    break;
                }
            }
        }
    }

    if members_str.is_empty() {
        return None;
    }

    // Parse the array: extract quoted strings
    let patterns: Vec<String> = members_str
        .split('"')
        .enumerate()
        .filter(|(i, _)| i % 2 == 1) // Odd indices are inside quotes
        .map(|(_, s)| s.to_string())
        .collect();

    if patterns.is_empty() {
        None
    } else {
        Some(patterns)
    }
}

/// Expand glob-style patterns like `packages/*` by listing directory children
/// that match and are valid project directories.
fn resolve_globs(root: &Path, patterns: &[String]) -> Vec<std::path::PathBuf> {
    let mut results = Vec::new();

    for pattern in patterns {
        if pattern.ends_with("/*") || pattern.ends_with("/**") {
            // Directory glob: list children of the parent
            let parent = pattern.trim_end_matches("/**").trim_end_matches("/*");
            let dir = root.join(parent);
            if let Ok(entries) = fs::read_dir(&dir) {
                for entry in entries.flatten() {
                    let path = entry.path();
                    if path.is_dir() && is_project_dir(&path) {
                        results.push(path);
                    }
                }
            }
        } else if pattern.contains('*') {
            // Simple glob with wildcard in the last segment: e.g. "crates/*-utils"
            // Fall back to listing parent directory
            if let Some(slash_pos) = pattern.rfind('/') {
                let parent = &pattern[..slash_pos];
                let dir = root.join(parent);
                if let Ok(entries) = fs::read_dir(&dir) {
                    for entry in entries.flatten() {
                        let path = entry.path();
                        if path.is_dir() && is_project_dir(&path) {
                            results.push(path);
                        }
                    }
                }
            }
        } else {
            // Exact path
            let path = root.join(pattern);
            if path.is_dir() && is_project_dir(&path) {
                results.push(path);
            }
        }
    }

    results.sort();
    results.dedup();
    results
}

/// Detect monorepo workspace packages. Returns resolved package paths or None.
fn detect_monorepo_packages(root: &Path) -> Option<Vec<std::path::PathBuf>> {
    // Try each strategy in order
    let patterns = detect_pnpm_workspace(root)
        .or_else(|| detect_npm_workspaces(root))
        .or_else(|| detect_cargo_workspace(root))?;

    let resolved = resolve_globs(root, &patterns);
    if resolved.is_empty() {
        None
    } else {
        Some(resolved)
    }
}

pub fn scan_directory(workspace_path: &str) -> Vec<ProjectInfo> {
    let mut projects = Vec::new();
    let workspace = Path::new(workspace_path);

    if !workspace.exists() || !workspace.is_dir() {
        return projects;
    }

    let entries = match fs::read_dir(workspace) {
        Ok(e) => e,
        Err(_) => return projects,
    };

    for entry in entries.flatten() {
        let path = entry.path();
        if !path.is_dir() {
            continue;
        }

        let dir_name = entry.file_name().to_string_lossy().to_string();
        if dir_name.starts_with('.') || SKIP_DIRS.contains(&dir_name.as_str()) {
            continue;
        }

        if is_project_dir(&path) {
            // Check if it's a monorepo
            if let Some(pkg_paths) = detect_monorepo_packages(&path) {
                // Add the root project
                if let Some(mut root_proj) = make_project(&path, &dir_name, "monorepo") {
                    root_proj.is_monorepo_root = true;
                    projects.push(root_proj);
                }
                // Add each workspace package
                for pkg_path in &pkg_paths {
                    if let Some(pkg_proj) = make_project(pkg_path, &dir_name, "monorepo") {
                        projects.push(pkg_proj);
                    }
                }
            } else {
                // Regular top-level project
                if let Some(project) = make_project(&path, "", "") {
                    projects.push(project);
                }
            }
        } else {
            // Not a project — treat as a group folder, scan its children
            scan_group(&path, &dir_name, &mut projects);
        }
    }

    projects.sort_by(|a, b| {
        a.group
            .to_lowercase()
            .cmp(&b.group.to_lowercase())
            .then_with(|| a.name.to_lowercase().cmp(&b.name.to_lowercase()))
    });
    projects
}

pub fn scan_monorepo_packages(root_path: &str) -> Vec<ProjectInfo> {
    let root = Path::new(root_path);
    let group_name = root
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_default();

    match detect_monorepo_packages(root) {
        Some(pkg_paths) => {
            let mut packages = Vec::new();
            for pkg_path in &pkg_paths {
                if let Some(pkg_proj) = make_project(pkg_path, &group_name, "monorepo") {
                    packages.push(pkg_proj);
                }
            }
            packages
        }
        None => Vec::new(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[test]
    fn test_has_build_artifacts_with_node_modules() {
        let tmp = TempDir::new().unwrap();
        fs::create_dir(tmp.path().join("node_modules")).unwrap();
        assert!(has_build_artifacts(tmp.path(), "JavaScript/TypeScript"));
    }

    #[test]
    fn test_has_build_artifacts_empty_project() {
        let tmp = TempDir::new().unwrap();
        assert!(!has_build_artifacts(tmp.path(), "JavaScript/TypeScript"));
    }

    #[test]
    fn test_detect_version_files_nvmrc() {
        let tmp = TempDir::new().unwrap();
        fs::write(tmp.path().join(".nvmrc"), "20").unwrap();
        let files = detect_version_files(tmp.path());
        assert_eq!(files.len(), 1);
        assert_eq!(files[0].name, ".nvmrc");
        assert_eq!(files[0].expected_version, "20");
        assert_eq!(files[0].language, "node");
    }

    #[test]
    fn test_detect_version_files_multiple() {
        let tmp = TempDir::new().unwrap();
        fs::write(tmp.path().join(".nvmrc"), "20").unwrap();
        fs::write(tmp.path().join(".python-version"), "3.12").unwrap();
        let files = detect_version_files(tmp.path());
        assert_eq!(files.len(), 2);
        let langs: Vec<&str> = files.iter().map(|f| f.language.as_str()).collect();
        assert!(langs.contains(&"node"));
        assert!(langs.contains(&"python"));
    }

    #[test]
    fn test_detect_version_files_empty_dir() {
        let tmp = TempDir::new().unwrap();
        let files = detect_version_files(tmp.path());
        assert!(files.is_empty());
    }

    #[test]
    fn test_detect_version_files_trims_whitespace() {
        let tmp = TempDir::new().unwrap();
        fs::write(tmp.path().join(".nvmrc"), "20\n").unwrap();
        let files = detect_version_files(tmp.path());
        assert_eq!(files.len(), 1);
        assert_eq!(files[0].expected_version, "20");
    }
}
