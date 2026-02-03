use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

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
}

struct ProjectMarker {
    file: &'static str,
    project_type: &'static str,
    framework_detector: fn(&Path) -> String,
    #[allow(dead_code)]
    package_manager: &'static str,
}

fn detect_js_framework(path: &Path) -> String {
    let pkg_json = path.join("package.json");
    if let Ok(content) = fs::read_to_string(&pkg_json) {
        if content.contains("\"next\"") {
            return "Next.js".to_string();
        }
        if content.contains("\"react\"") && content.contains("\"vite\"") {
            return "React + Vite".to_string();
        }
        if content.contains("\"react\"") {
            return "React".to_string();
        }
        if content.contains("\"vue\"") {
            return "Vue".to_string();
        }
        if content.contains("\"svelte\"") || content.contains("\"@sveltejs") {
            return "Svelte".to_string();
        }
        if content.contains("\"angular\"") || content.contains("\"@angular") {
            return "Angular".to_string();
        }
        if content.contains("\"astro\"") {
            return "Astro".to_string();
        }
        if content.contains("\"express\"") {
            return "Express".to_string();
        }
        if content.contains("\"hono\"") {
            return "Hono".to_string();
        }
        if content.contains("\"tauri\"") || content.contains("\"@tauri-apps") {
            return "Tauri".to_string();
        }
        if content.contains("\"electron\"") {
            return "Electron".to_string();
        }
    }
    "Node.js".to_string()
}

fn detect_python_framework(path: &Path) -> String {
    if path.join("manage.py").exists() {
        return "Django".to_string();
    }
    if path.join("app.py").exists() || path.join("wsgi.py").exists() {
        // Check for Flask
        if let Ok(content) = fs::read_to_string(path.join("app.py")) {
            if content.contains("Flask") {
                return "Flask".to_string();
            }
            if content.contains("FastAPI") {
                return "FastAPI".to_string();
            }
        }
    }
    if path.join("pyproject.toml").exists() {
        if let Ok(content) = fs::read_to_string(path.join("pyproject.toml")) {
            if content.contains("fastapi") {
                return "FastAPI".to_string();
            }
            if content.contains("django") {
                return "Django".to_string();
            }
            if content.contains("flask") {
                return "Flask".to_string();
            }
        }
    }
    "Python".to_string()
}

fn detect_rust_framework(path: &Path) -> String {
    if let Ok(content) = fs::read_to_string(path.join("Cargo.toml")) {
        if content.contains("tauri") {
            return "Tauri".to_string();
        }
        if content.contains("actix") {
            return "Actix".to_string();
        }
        if content.contains("axum") {
            return "Axum".to_string();
        }
        if content.contains("rocket") {
            return "Rocket".to_string();
        }
    }
    "Rust".to_string()
}

fn detect_go_framework(path: &Path) -> String {
    if let Ok(content) = fs::read_to_string(path.join("go.mod")) {
        if content.contains("gin-gonic") {
            return "Gin".to_string();
        }
        if content.contains("fiber") {
            return "Fiber".to_string();
        }
        if content.contains("echo") {
            return "Echo".to_string();
        }
    }
    "Go".to_string()
}

fn no_framework(_path: &Path) -> String {
    String::new()
}

const MARKERS: &[ProjectMarker] = &[
    ProjectMarker {
        file: "package.json",
        project_type: "JavaScript/TypeScript",
        framework_detector: detect_js_framework,
        package_manager: "npm/pnpm/yarn",
    },
    ProjectMarker {
        file: "Cargo.toml",
        project_type: "Rust",
        framework_detector: detect_rust_framework,
        package_manager: "cargo",
    },
    ProjectMarker {
        file: "go.mod",
        project_type: "Go",
        framework_detector: detect_go_framework,
        package_manager: "go mod",
    },
    ProjectMarker {
        file: "pyproject.toml",
        project_type: "Python",
        framework_detector: detect_python_framework,
        package_manager: "pip/uv",
    },
    ProjectMarker {
        file: "requirements.txt",
        project_type: "Python",
        framework_detector: detect_python_framework,
        package_manager: "pip",
    },
    ProjectMarker {
        file: "Gemfile",
        project_type: "Ruby",
        framework_detector: no_framework,
        package_manager: "bundler",
    },
    ProjectMarker {
        file: "composer.json",
        project_type: "PHP",
        framework_detector: no_framework,
        package_manager: "composer",
    },
    ProjectMarker {
        file: "pom.xml",
        project_type: "Java",
        framework_detector: no_framework,
        package_manager: "maven",
    },
    ProjectMarker {
        file: "build.gradle",
        project_type: "Java/Kotlin",
        framework_detector: no_framework,
        package_manager: "gradle",
    },
];

fn detect_package_manager(path: &Path) -> String {
    if path.join("pnpm-lock.yaml").exists() {
        "pnpm".to_string()
    } else if path.join("yarn.lock").exists() {
        "yarn".to_string()
    } else if path.join("bun.lock").exists() || path.join("bun.lockb").exists() {
        "bun".to_string()
    } else if path.join("package-lock.json").exists() {
        "npm".to_string()
    } else if path.join("Cargo.lock").exists() {
        "cargo".to_string()
    } else if path.join("go.sum").exists() {
        "go mod".to_string()
    } else if path.join("uv.lock").exists() {
        "uv".to_string()
    } else if path.join("Pipfile.lock").exists() {
        "pipenv".to_string()
    } else if path.join("poetry.lock").exists() {
        "poetry".to_string()
    } else {
        "unknown".to_string()
    }
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

/// Directories that should never be descended into.
const SKIP_DIRS: &[&str] = &[
    "node_modules",
    "target",
    "dist",
    "build",
    ".git",
    "__pycache__",
    "vendor",
    ".next",
    ".nuxt",
    "venv",
    ".venv",
];

fn is_project_dir(path: &Path) -> bool {
    MARKERS.iter().any(|m| path.join(m.file).exists())
}

fn make_project(path: &Path, group: &str, group_type: &str) -> Option<ProjectInfo> {
    for marker in MARKERS {
        if path.join(marker.file).exists() {
            let folder_name = path
                .file_name()
                .map(|n| n.to_string_lossy().to_string())
                .unwrap_or_default();
            let name = get_project_name(path).unwrap_or(folder_name);
            let framework = (marker.framework_detector)(path);
            let package_manager = detect_package_manager(path);
            let description = get_description(path);
            let has_git = path.join(".git").exists();

            return Some(ProjectInfo {
                name,
                path: path.to_string_lossy().to_string(),
                project_type: marker.project_type.to_string(),
                framework,
                package_manager,
                description,
                has_git,
                group: group.to_string(),
                group_type: group_type.to_string(),
                is_monorepo_root: false,
                worktree_id: String::new(),
            });
        }
    }
    None
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
