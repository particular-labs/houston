use serde::{Deserialize, Serialize};
use std::process::Command;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitStatus {
    pub project_path: String,
    pub branch: String,
    pub is_dirty: bool,
    pub modified_count: usize,
    pub untracked_count: usize,
    pub staged_count: usize,
    pub ahead: usize,
    pub behind: usize,
    pub last_commit_message: String,
    pub last_commit_date: String,
    pub last_commit_epoch: Option<i64>,
    pub remote_url: String,
}

pub fn get_status(project_path: &str) -> Option<GitStatus> {
    // Check if it's a git repo
    let git_dir = std::path::Path::new(project_path).join(".git");
    if !git_dir.exists() {
        return None;
    }

    let output = Command::new("git")
        .args(["status", "--porcelain=v2", "--branch"])
        .current_dir(project_path)
        .output()
        .ok()?;

    let stdout = String::from_utf8_lossy(&output.stdout);

    let mut branch = String::new();
    let mut ahead = 0;
    let mut behind = 0;
    let mut modified_count = 0;
    let mut untracked_count = 0;
    let mut staged_count = 0;

    for line in stdout.lines() {
        if line.starts_with("# branch.head ") {
            branch = line
                .strip_prefix("# branch.head ")
                .unwrap_or("")
                .to_string();
        } else if line.starts_with("# branch.ab ") {
            let ab = line.strip_prefix("# branch.ab ").unwrap_or("");
            for part in ab.split_whitespace() {
                if let Some(n) = part.strip_prefix('+') {
                    ahead = n.parse().unwrap_or(0);
                } else if let Some(n) = part.strip_prefix('-') {
                    behind = n.parse().unwrap_or(0);
                }
            }
        } else if line.starts_with("1 ") || line.starts_with("2 ") {
            // Changed entries
            let xy = line.split_whitespace().nth(1).unwrap_or("..");
            let x = xy.chars().next().unwrap_or('.');
            let y = xy.chars().nth(1).unwrap_or('.');

            if x != '.' {
                staged_count += 1;
            }
            if y != '.' {
                modified_count += 1;
            }
        } else if line.starts_with("? ") {
            untracked_count += 1;
        }
    }

    // Get last commit info
    let log_output = Command::new("git")
        .args(["log", "-1", "--format=%s|%ar|%ct"])
        .current_dir(project_path)
        .output()
        .ok();

    let (last_commit_message, last_commit_date, last_commit_epoch) = log_output
        .map(|o| {
            let s = String::from_utf8_lossy(&o.stdout).trim().to_string();
            parse_git_log_line(&s)
        })
        .unwrap_or_default();

    // Get remote URL
    let remote_output = Command::new("git")
        .args(["remote", "get-url", "origin"])
        .current_dir(project_path)
        .output()
        .ok();

    let remote_url = remote_output
        .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
        .unwrap_or_default();

    let is_dirty = modified_count > 0 || untracked_count > 0 || staged_count > 0;

    Some(GitStatus {
        project_path: project_path.to_string(),
        branch,
        is_dirty,
        modified_count,
        untracked_count,
        staged_count,
        ahead,
        behind,
        last_commit_message,
        last_commit_date,
        last_commit_epoch,
        remote_url,
    })
}

pub fn get_statuses(project_paths: &[String]) -> Vec<GitStatus> {
    let handles: Vec<_> = project_paths
        .iter()
        .map(|p| {
            let path = p.clone();
            std::thread::spawn(move || get_status(&path))
        })
        .collect();

    handles
        .into_iter()
        .filter_map(|h| h.join().ok())
        .flatten()
        .collect()
}

/// Parse a git log line in the format `message|relative_date|epoch`.
/// Returns (message, date, epoch). Used internally by `get_status`.
fn parse_git_log_line(line: &str) -> (String, String, Option<i64>) {
    let parts: Vec<&str> = line.splitn(3, '|').collect();
    (
        parts.first().unwrap_or(&"").to_string(),
        parts.get(1).unwrap_or(&"").to_string(),
        parts.get(2).and_then(|e| e.parse::<i64>().ok()),
    )
}

/// For each git-enabled project path, detect worktrees. Returns a mapping from
/// project path to the main worktree path (shared ID) for projects that have
/// multiple worktrees.
pub fn detect_worktree_groups(
    project_paths: &[String],
) -> std::collections::HashMap<String, String> {
    let handles: Vec<_> = project_paths
        .iter()
        .map(|path| {
            let path = path.clone();
            std::thread::spawn(move || {
                let output = Command::new("git")
                    .args(["worktree", "list", "--porcelain"])
                    .current_dir(&path)
                    .output();

                let output = match output {
                    Ok(o) if o.status.success() => o,
                    _ => return None,
                };

                let stdout = String::from_utf8_lossy(&output.stdout);
                let worktree_paths: Vec<String> = stdout
                    .lines()
                    .filter_map(|line| line.strip_prefix("worktree "))
                    .map(|s| s.to_string())
                    .collect();

                if worktree_paths.len() > 1 {
                    let main_worktree = worktree_paths[0].clone();
                    Some((path, main_worktree))
                } else {
                    None
                }
            })
        })
        .collect();

    let mut result = std::collections::HashMap::new();
    for h in handles {
        if let Some(Some((path, main_wt))) = h.join().ok() {
            result.insert(path, main_wt);
        }
    }
    result
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_git_log_with_epoch() {
        let (msg, date, epoch) = parse_git_log_line("fix something|2 days ago|1707600000");
        assert_eq!(msg, "fix something");
        assert_eq!(date, "2 days ago");
        assert_eq!(epoch, Some(1707600000));
    }

    #[test]
    fn test_parse_git_log_missing_epoch() {
        let (msg, date, epoch) = parse_git_log_line("fix something|2 days ago");
        assert_eq!(msg, "fix something");
        assert_eq!(date, "2 days ago");
        assert_eq!(epoch, None);
    }

    #[test]
    fn test_parse_git_log_empty() {
        let (msg, date, epoch) = parse_git_log_line("");
        assert_eq!(msg, "");
        assert_eq!(date, "");
        assert_eq!(epoch, None);
    }

    #[test]
    fn test_parse_git_log_message_only() {
        let (msg, date, epoch) = parse_git_log_line("just a message");
        assert_eq!(msg, "just a message");
        assert_eq!(date, "");
        assert_eq!(epoch, None);
    }
}
