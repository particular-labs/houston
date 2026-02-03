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

/// Maximum depth to recurse when scanning for projects.
const MAX_SCAN_DEPTH: usize = 3;

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

fn scan_recursive(dir: &Path, depth: usize, projects: &mut Vec<ProjectInfo>) {
    if depth > MAX_SCAN_DEPTH {
        return;
    }

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

        // Skip hidden directories and known non-project dirs
        if dir_name.starts_with('.') || SKIP_DIRS.contains(&dir_name.as_str()) {
            continue;
        }

        // Check for project markers
        let mut is_project = false;
        for marker in MARKERS {
            if path.join(marker.file).exists() {
                let name = dir_name.clone();
                let framework = (marker.framework_detector)(&path);
                let package_manager = detect_package_manager(&path);
                let description = get_description(&path);
                let has_git = path.join(".git").exists();

                projects.push(ProjectInfo {
                    name,
                    path: path.to_string_lossy().to_string(),
                    project_type: marker.project_type.to_string(),
                    framework,
                    package_manager,
                    description,
                    has_git,
                });
                is_project = true;
                break; // Only match first marker
            }
        }

        // If this directory isn't itself a project, recurse into it
        if !is_project {
            scan_recursive(&path, depth + 1, projects);
        }
    }
}

pub fn scan_directory(workspace_path: &str) -> Vec<ProjectInfo> {
    let mut projects = Vec::new();
    let workspace = Path::new(workspace_path);

    if !workspace.exists() || !workspace.is_dir() {
        return projects;
    }

    scan_recursive(workspace, 0, &mut projects);

    projects.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    projects
}
