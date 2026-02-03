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
    if path.contains("homebrew") || path.contains("brew") {
        "Homebrew".to_string()
    } else if path.contains("cargo") || path.contains("rustup") {
        "Rust".to_string()
    } else if path.contains("nvm") || path.contains("fnm") || path.contains("volta") {
        "Node.js".to_string()
    } else if path.contains("pyenv") || path.contains("conda") || path.contains("python") {
        "Python".to_string()
    } else if path.contains("rbenv") || path.contains("ruby") || path.contains("gem") {
        "Ruby".to_string()
    } else if path.contains("goenv") || path.contains("/go/") || path.contains("go/bin") {
        "Go".to_string()
    } else if path.contains("java") || path.contains("jdk") || path.contains("jre") {
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
    let mut seen = HashSet::new();
    let mut entries = Vec::new();

    for (index, path_str) in path_var.split(':').enumerate() {
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
