use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PathEntry {
    pub path: String,
    pub exists: bool,
    pub is_duplicate: bool,
    pub index: usize,
    pub category: String,
}

fn categorize_path(path: &str) -> String {
    let p = path.to_lowercase();

    // Windows-specific categories
    if cfg!(windows) {
        if p.contains("\\scoop\\") {
            return "Scoop".to_string();
        } else if p.contains("\\chocolatey\\") || p.contains("\\programdata\\chocolatey") {
            return "Chocolatey".to_string();
        } else if p.contains("\\program files\\") || p.contains("\\program files (x86)\\") {
            return "System".to_string();
        } else if p.contains("\\windows\\") {
            return "System".to_string();
        }
    }

    if p.contains("homebrew") || p.contains("brew") {
        "Homebrew".to_string()
    } else if p.contains("cargo") || p.contains("rustup") {
        "Rust".to_string()
    } else if p.contains("nvm") || p.contains("fnm") || p.contains("volta") {
        "Node.js".to_string()
    } else if p.contains("pyenv") || p.contains("conda") || p.contains("python") {
        "Python".to_string()
    } else if p.contains("rbenv") || p.contains("ruby") || p.contains("gem") {
        "Ruby".to_string()
    } else if p.contains("goenv") || p.contains("/go/") || p.contains("go/bin") || p.contains("\\go\\") {
        "Go".to_string()
    } else if p.contains("java") || p.contains("jdk") || p.contains("jre") {
        "Java".to_string()
    } else if path.contains(".local/bin") {
        "User Local".to_string()
    } else if path.starts_with("/usr/local") {
        "Usr Local".to_string()
    } else if path.starts_with("/usr/bin") || path.starts_with("/bin") || path.starts_with("/sbin")
    {
        "System".to_string()
    } else if path.starts_with("/opt") {
        "Opt".to_string()
    } else {
        "Other".to_string()
    }
}

pub fn scan() -> Vec<PathEntry> {
    let path_var = std::env::var("PATH").unwrap_or_default();
    let separator = if cfg!(windows) { ';' } else { ':' };
    let mut seen = HashSet::new();
    let mut entries = Vec::new();

    for (index, path_str) in path_var.split(separator).enumerate() {
        if path_str.is_empty() {
            continue;
        }
        let is_duplicate = !seen.insert(path_str.to_string());
        let exists = Path::new(path_str).exists();
        let category = categorize_path(path_str);

        entries.push(PathEntry {
            path: path_str.to_string(),
            exists,
            is_duplicate,
            index,
            category,
        });
    }

    entries
}
