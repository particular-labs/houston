use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::path::Path;
use std::process::Command;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Severity {
    Error,
    Warning,
    Info,
    Suggestion,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiagnosticItem {
    pub id: String,
    pub category: String,
    pub severity: Severity,
    pub title: String,
    pub description: String,
    pub details: Option<String>,
    pub fix_id: Option<String>,
    pub fix_label: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiagnosticReport {
    pub items: Vec<DiagnosticItem>,
    pub scanned_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FixResult {
    pub success: bool,
    pub message: String,
    pub output: Option<String>,
}

fn run_cmd(cmd: &str, args: &[&str]) -> Option<String> {
    Command::new(cmd)
        .args(args)
        .output()
        .ok()
        .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
}

fn run_cmd_full(cmd: &str, args: &[&str]) -> Option<(String, String, bool)> {
    Command::new(cmd).args(args).output().ok().map(|o| {
        (
            String::from_utf8_lossy(&o.stdout).trim().to_string(),
            String::from_utf8_lossy(&o.stderr).trim().to_string(),
            o.status.success(),
        )
    })
}

fn which_cmd(binary: &str) -> Option<String> {
    #[cfg(unix)]
    let cmd = "which";
    #[cfg(windows)]
    let cmd = "where.exe";

    Command::new(cmd)
        .arg(binary)
        .output()
        .ok()
        .and_then(|o| {
            if o.status.success() {
                let out = String::from_utf8_lossy(&o.stdout);
                Some(out.lines().next()?.trim().to_string())
            } else {
                None
            }
        })
}

#[cfg(unix)]
fn which_all(binary: &str) -> Option<String> {
    run_cmd("which", &["-a", binary])
}

#[cfg(windows)]
fn which_all(binary: &str) -> Option<String> {
    run_cmd("where.exe", &[binary])
}

fn check_outdated_brew() -> Vec<DiagnosticItem> {
    if cfg!(target_os = "windows") {
        return Vec::new();
    }

    let json = super::outdated_cache::brew_outdated_json();
    if json.is_null() {
        return Vec::new();
    }

    if let Some(formulae) = json.get("formulae").and_then(|f| f.as_array()) {
        return formulae
            .iter()
            .filter_map(|pkg| {
                let name = pkg.get("name")?.as_str()?;
                let current = pkg
                    .get("installed_versions")
                    .and_then(|v| v.as_array())
                    .and_then(|a| a.first())
                    .and_then(|v| v.as_str())
                    .unwrap_or("?");
                let latest = pkg
                    .get("current_version")
                    .and_then(|v| v.as_str())
                    .unwrap_or("?");
                Some(DiagnosticItem {
                    id: format!("brew_outdated_{}", name),
                    category: "packages".to_string(),
                    severity: Severity::Warning,
                    title: format!("{} is outdated", name),
                    description: format!("Installed: {}, Latest: {}", current, latest),
                    details: None,
                    fix_id: Some(format!("brew_upgrade:{}", name)),
                    fix_label: Some(format!("Upgrade {}", name)),
                })
            })
            .collect();
    }

    Vec::new()
}

fn check_outdated_npm() -> Vec<DiagnosticItem> {
    let json = super::outdated_cache::npm_outdated_json();
    if json.is_null() {
        return Vec::new();
    }

    if let Some(obj) = json.as_object() {
        return obj
            .iter()
            .filter_map(|(name, info)| {
                let current =
                    info.get("current").and_then(|v| v.as_str()).unwrap_or("?");
                let latest = info.get("latest").and_then(|v| v.as_str()).unwrap_or("?");
                if current == latest {
                    return None;
                }
                Some(DiagnosticItem {
                    id: format!("npm_outdated_{}", name),
                    category: "packages".to_string(),
                    severity: Severity::Warning,
                    title: format!("{} is outdated", name),
                    description: format!("Installed: {}, Latest: {}", current, latest),
                    details: None,
                    fix_id: Some(format!("npm_update:{}", name)),
                    fix_label: Some(format!("Update {}", name)),
                })
            })
            .collect();
    }

    Vec::new()
}

fn check_outdated_pip() -> Vec<DiagnosticItem> {
    let json = super::outdated_cache::pip_outdated_json();
    if json.is_null() {
        return Vec::new();
    }

    if let Some(packages) = json.as_array() {
        return packages
            .iter()
            .filter_map(|pkg| {
                let name = pkg.get("name")?.as_str()?;
                let current = pkg.get("version")?.as_str()?;
                let latest = pkg.get("latest_version")?.as_str()?;
                Some(DiagnosticItem {
                    id: format!("pip_outdated_{}", name),
                    category: "packages".to_string(),
                    severity: Severity::Info,
                    title: format!("{} is outdated", name),
                    description: format!("Installed: {}, Latest: {}", current, latest),
                    details: None,
                    fix_id: Some(format!("pip_upgrade:{}", name)),
                    fix_label: Some(format!("Upgrade {}", name)),
                })
            })
            .collect();
    }

    Vec::new()
}

fn check_brew_doctor() -> Vec<DiagnosticItem> {
    if cfg!(target_os = "windows") {
        return Vec::new();
    }

    let (stdout, stderr, success) = match run_cmd_full("brew", &["doctor"]) {
        Some(r) => r,
        None => return Vec::new(),
    };

    if success {
        return Vec::new();
    }

    let output_text = if !stderr.is_empty() { &stderr } else { &stdout };

    let mut items = Vec::new();
    let mut current_warning = String::new();

    for line in output_text.lines() {
        if line.starts_with("Warning:") {
            if !current_warning.is_empty() {
                let has_cleanup = current_warning.contains("pruned")
                    || current_warning.contains("cleanup")
                    || current_warning.contains("unlinked");
                items.push(DiagnosticItem {
                    id: format!("brew_doctor_{}", items.len()),
                    category: "brew".to_string(),
                    severity: Severity::Warning,
                    title: current_warning
                        .lines()
                        .next()
                        .unwrap_or("Brew warning")
                        .to_string(),
                    description: current_warning.clone(),
                    details: None,
                    fix_id: if has_cleanup {
                        Some("brew_cleanup:all".to_string())
                    } else {
                        None
                    },
                    fix_label: if has_cleanup {
                        Some("Run brew cleanup".to_string())
                    } else {
                        None
                    },
                });
            }
            current_warning = line.trim_start_matches("Warning:").trim().to_string();
        } else if !line.trim().is_empty() && !current_warning.is_empty() {
            current_warning.push('\n');
            current_warning.push_str(line.trim());
        }
    }

    if !current_warning.is_empty() {
        let has_cleanup = current_warning.contains("pruned")
            || current_warning.contains("cleanup")
            || current_warning.contains("unlinked");
        items.push(DiagnosticItem {
            id: format!("brew_doctor_{}", items.len()),
            category: "brew".to_string(),
            severity: Severity::Warning,
            title: current_warning
                .lines()
                .next()
                .unwrap_or("Brew warning")
                .to_string(),
            description: current_warning,
            details: None,
            fix_id: if has_cleanup {
                Some("brew_cleanup:all".to_string())
            } else {
                None
            },
            fix_label: if has_cleanup {
                Some("Run brew cleanup".to_string())
            } else {
                None
            },
        });
    }

    items
}

fn check_path_issues() -> Vec<DiagnosticItem> {
    let path_var = std::env::var("PATH").unwrap_or_default();
    let separator = if cfg!(windows) { ';' } else { ':' };
    let entries: Vec<&str> = path_var.split(separator).collect();
    let mut items = Vec::new();
    let mut seen = HashSet::new();

    for (i, entry) in entries.iter().enumerate() {
        if entry.is_empty() {
            continue;
        }

        // Check for duplicates
        if !seen.insert(*entry) {
            items.push(DiagnosticItem {
                id: format!("path_duplicate_{}", i),
                category: "path".to_string(),
                severity: Severity::Warning,
                title: "Duplicate PATH entry".to_string(),
                description: format!("\"{}\" appears multiple times in PATH", entry),
                details: None,
                fix_id: None,
                fix_label: None,
            });
        }

        // Check for missing directories
        if !Path::new(entry).exists() {
            items.push(DiagnosticItem {
                id: format!("path_missing_{}", i),
                category: "path".to_string(),
                severity: Severity::Warning,
                title: "Missing PATH directory".to_string(),
                description: format!("\"{}\" does not exist", entry),
                details: None,
                fix_id: None,
                fix_label: None,
            });
        }
    }

    // Check if Homebrew paths come after system paths (macOS/Linux only)
    if !cfg!(windows) {
        let homebrew_idx = entries
            .iter()
            .position(|e| e.contains("homebrew") || e.contains("Homebrew"));
        let usr_bin_idx = entries.iter().position(|e| *e == "/usr/bin");

        if let (Some(brew_i), Some(sys_i)) = (homebrew_idx, usr_bin_idx) {
            if brew_i > sys_i {
                items.push(DiagnosticItem {
                    id: "path_ordering_homebrew".to_string(),
                    category: "path".to_string(),
                    severity: Severity::Info,
                    title: "Homebrew after system PATH".to_string(),
                    description:
                        "Homebrew bin directories appear after /usr/bin, system binaries will take precedence"
                            .to_string(),
                    details: Some(
                        "Consider reordering your PATH so Homebrew directories come before /usr/bin"
                            .to_string(),
                    ),
                    fix_id: None,
                    fix_label: None,
                });
            }
        }
    }

    items
}

fn check_duplicate_binaries() -> Vec<DiagnosticItem> {
    let binaries = ["node", "python3", "ruby", "git", "java", "go"];
    let mut items = Vec::new();

    for bin in &binaries {
        if let Some(output) = which_all(bin) {
            let paths: Vec<&str> = output.lines().collect();
            if paths.len() > 1 {
                items.push(DiagnosticItem {
                    id: format!("duplicate_binary_{}", bin),
                    category: "binaries".to_string(),
                    severity: Severity::Info,
                    title: format!("Multiple {} installations", bin),
                    description: format!("Found {} installations of {}", paths.len(), bin),
                    details: Some(paths.join("\n")),
                    fix_id: None,
                    fix_label: None,
                });
            }
        }
    }

    items
}

fn check_shell_config() -> Vec<DiagnosticItem> {
    let home = dirs::home_dir().unwrap_or_default();
    let mut items = Vec::new();

    #[cfg(unix)]
    {
        let shell_files = [".zshrc", ".bashrc", ".bash_profile"];

        for file_name in &shell_files {
            let path = home.join(file_name);
            if !path.exists() {
                continue;
            }

            if let Ok(content) = std::fs::read_to_string(&path) {
                // Count PATH modifications
                let path_mods = content
                    .lines()
                    .filter(|l| {
                        let trimmed = l.trim();
                        !trimmed.starts_with('#')
                            && (trimmed.contains("export PATH") || trimmed.contains("PATH="))
                    })
                    .count();

                if path_mods > 5 {
                    items.push(DiagnosticItem {
                        id: format!("shell_excess_path_{}", file_name),
                        category: "shell".to_string(),
                        severity: Severity::Info,
                        title: format!("Many PATH modifications in {}", file_name),
                        description: format!(
                            "{} has {} PATH export lines, consider consolidating",
                            file_name, path_mods
                        ),
                        details: None,
                        fix_id: None,
                        fix_label: None,
                    });
                }

                // Check for brew shellenv in zshrc (macOS)
                if cfg!(target_os = "macos") && *file_name == ".zshrc" {
                    let has_brew_shellenv = content.contains("brew shellenv")
                        || content.contains("eval \"$(/opt/homebrew/bin/brew shellenv)\"");
                    let brew_exists = Path::new("/opt/homebrew/bin/brew").exists();

                    if brew_exists && !has_brew_shellenv {
                        items.push(DiagnosticItem {
                            id: "shell_missing_brew_shellenv".to_string(),
                            category: "shell".to_string(),
                            severity: Severity::Suggestion,
                            title: "Missing brew shellenv in .zshrc".to_string(),
                            description:
                                "Homebrew is installed but brew shellenv is not sourced in .zshrc"
                                    .to_string(),
                            details: Some(
                                "Add: eval \"$(/opt/homebrew/bin/brew shellenv)\"".to_string(),
                            ),
                            fix_id: None,
                            fix_label: None,
                        });
                    }
                }
            }
        }
    }

    #[cfg(windows)]
    {
        // Check for PowerShell profile
        if let Ok(output) = Command::new("powershell")
            .args(["-NoProfile", "-Command", "echo $PROFILE"])
            .output()
        {
            let profile_path = String::from_utf8_lossy(&output.stdout).trim().to_string();
            if !profile_path.is_empty() && !Path::new(&profile_path).exists() {
                items.push(DiagnosticItem {
                    id: "shell_no_ps_profile".to_string(),
                    category: "shell".to_string(),
                    severity: Severity::Suggestion,
                    title: "No PowerShell profile".to_string(),
                    description: "PowerShell profile does not exist. Create one to customize your shell environment.".to_string(),
                    details: Some(format!("Expected at: {}", profile_path)),
                    fix_id: None,
                    fix_label: None,
                });
            }
        }
    }

    items
}

fn check_environment_tools() -> Vec<DiagnosticItem> {
    let tools: Vec<(&str, &str)> = vec![
        (
            "git-lfs",
            "Git Large File Storage for managing large files in git",
        ),
        (
            "gpg",
            "GNU Privacy Guard for signing commits and encrypting data",
        ),
        ("jq", "Command-line JSON processor"),
        ("gh", "GitHub CLI for managing repos, PRs, and issues"),
    ];

    let mut items = Vec::new();

    for (tool, desc) in &tools {
        if which_cmd(tool).map_or(true, |s| s.is_empty()) {
            items.push(DiagnosticItem {
                id: format!("missing_tool_{}", tool),
                category: "environment".to_string(),
                severity: Severity::Suggestion,
                title: format!("{} not installed", tool),
                description: desc.to_string(),
                details: None,
                fix_id: None,
                fix_label: None,
            });
        }
    }

    items
}

#[cfg(target_os = "windows")]
fn check_windows_tools() -> Vec<DiagnosticItem> {
    let mut items = Vec::new();

    // Check winget health
    if which_cmd("winget").is_some() {
        if let Some((_, stderr, success)) = run_cmd_full("winget", &["--info"]) {
            if !success {
                items.push(DiagnosticItem {
                    id: "winget_unhealthy".to_string(),
                    category: "packages".to_string(),
                    severity: Severity::Warning,
                    title: "winget may have issues".to_string(),
                    description: "winget --info returned an error".to_string(),
                    details: if stderr.is_empty() { None } else { Some(stderr) },
                    fix_id: None,
                    fix_label: None,
                });
            }
        }
    } else {
        items.push(DiagnosticItem {
            id: "missing_winget".to_string(),
            category: "packages".to_string(),
            severity: Severity::Suggestion,
            title: "winget not installed".to_string(),
            description: "Windows Package Manager (winget) is not available. Install it from the Microsoft Store or GitHub.".to_string(),
            details: None,
            fix_id: None,
            fix_label: None,
        });
    }

    // Suggest Windows Defender exclusion for dev dirs
    let home = dirs::home_dir().unwrap_or_default();
    let dev_dirs = ["Projects", "Development", "Code", "repos", "src"];
    let existing_dev_dirs: Vec<String> = dev_dirs
        .iter()
        .filter_map(|d| {
            let p = home.join(d);
            if p.exists() { Some(p.to_string_lossy().to_string()) } else { None }
        })
        .collect();

    if !existing_dev_dirs.is_empty() {
        items.push(DiagnosticItem {
            id: "defender_exclusion_suggestion".to_string(),
            category: "environment".to_string(),
            severity: Severity::Suggestion,
            title: "Consider adding Defender exclusions for dev directories".to_string(),
            description: "Windows Defender real-time scanning can slow builds. Consider adding exclusions for your development directories.".to_string(),
            details: Some(format!("Detected dev directories:\n{}", existing_dev_dirs.join("\n"))),
            fix_id: None,
            fix_label: None,
        });
    }

    items
}

#[cfg(target_os = "linux")]
fn check_linux_packages() -> Vec<DiagnosticItem> {
    let mut items = Vec::new();

    // Check for outdated packages via apt (Debian/Ubuntu)
    if which_cmd("apt").is_some() {
        if let Some(output) = run_cmd("apt", &["list", "--upgradable"]) {
            let upgradable: Vec<&str> = output
                .lines()
                .filter(|l| l.contains("[upgradable"))
                .collect();
            if !upgradable.is_empty() {
                let mut detail = upgradable
                    .iter()
                    .take(10)
                    .cloned()
                    .collect::<Vec<&str>>()
                    .join("\n");
                if upgradable.len() > 10 {
                    detail.push_str(&format!("\n... and {} more", upgradable.len() - 10));
                }
                items.push(DiagnosticItem {
                    id: "apt_outdated".to_string(),
                    category: "packages".to_string(),
                    severity: Severity::Info,
                    title: format!("{} apt packages can be upgraded", upgradable.len()),
                    description: "Run `sudo apt upgrade` to update system packages".to_string(),
                    details: Some(detail),
                    fix_id: None,
                    fix_label: None,
                });
            }
        }
    }

    // Check for outdated packages via dnf (Fedora/RHEL)
    if which_cmd("dnf").is_some() {
        if let Some(output) = run_cmd("dnf", &["check-update", "--quiet"]) {
            let upgradable: Vec<&str> = output.lines().filter(|l| !l.is_empty()).collect();
            if upgradable.len() > 10 {
                items.push(DiagnosticItem {
                    id: "dnf_outdated".to_string(),
                    category: "packages".to_string(),
                    severity: Severity::Info,
                    title: format!("{} dnf packages can be upgraded", upgradable.len()),
                    description: "Run `sudo dnf upgrade` to update system packages".to_string(),
                    details: None,
                    fix_id: None,
                    fix_label: None,
                });
            }
        }
    }

    items
}

pub fn scan() -> DiagnosticReport {
    // Spawn threads for the slow process-spawning checks
    let brew_outdated = std::thread::spawn(check_outdated_brew);
    let npm_outdated = std::thread::spawn(check_outdated_npm);
    let pip_outdated = std::thread::spawn(check_outdated_pip);
    let brew_doctor = std::thread::spawn(check_brew_doctor);
    let dup_binaries = std::thread::spawn(check_duplicate_binaries);
    let env_tools = std::thread::spawn(check_environment_tools);

    // Platform-specific checks
    #[cfg(target_os = "windows")]
    let platform_checks = std::thread::spawn(check_windows_tools);

    #[cfg(target_os = "linux")]
    let platform_checks = std::thread::spawn(check_linux_packages);

    // Run the fast checks inline
    let mut items = Vec::new();
    items.extend(check_path_issues());
    items.extend(check_shell_config());

    // Collect threaded results
    items.extend(brew_outdated.join().unwrap_or_default());
    items.extend(npm_outdated.join().unwrap_or_default());
    items.extend(pip_outdated.join().unwrap_or_default());
    items.extend(brew_doctor.join().unwrap_or_default());
    items.extend(dup_binaries.join().unwrap_or_default());
    items.extend(env_tools.join().unwrap_or_default());

    #[cfg(any(target_os = "windows", target_os = "linux"))]
    items.extend(platform_checks.join().unwrap_or_default());

    DiagnosticReport {
        items,
        scanned_at: chrono::Local::now().to_rfc3339(),
    }
}

pub fn execute_fix(fix_id: &str) -> FixResult {
    let parts: Vec<&str> = fix_id.splitn(2, ':').collect();
    if parts.len() != 2 {
        return FixResult {
            success: false,
            message: format!("Invalid fix_id format: {}", fix_id),
            output: None,
        };
    }

    let (prefix, arg) = (parts[0], parts[1]);

    let (cmd, args): (&str, Vec<&str>) = match prefix {
        "brew_upgrade" => ("brew", vec!["upgrade", arg]),
        "brew_cleanup" => ("brew", vec!["cleanup"]),
        "npm_update" => ("npm", vec!["update", "-g", arg]),
        "pip_upgrade" => ("pip3", vec!["install", "--upgrade", arg]),
        _ => {
            return FixResult {
                success: false,
                message: format!("Unknown fix prefix: {}", prefix),
                output: None,
            };
        }
    };

    match Command::new(cmd).args(&args).output() {
        Ok(o) => {
            let stdout = String::from_utf8_lossy(&o.stdout).to_string();
            let stderr = String::from_utf8_lossy(&o.stderr).to_string();
            let combined = if stderr.is_empty() {
                stdout
            } else {
                format!("{}\n{}", stdout, stderr)
            };

            if o.status.success() {
                FixResult {
                    success: true,
                    message: format!("Successfully ran: {} {}", cmd, args.join(" ")),
                    output: Some(combined),
                }
            } else {
                FixResult {
                    success: false,
                    message: format!("Command failed: {} {}", cmd, args.join(" ")),
                    output: Some(combined),
                }
            }
        }
        Err(e) => FixResult {
            success: false,
            message: format!("Failed to execute {}: {}", cmd, e),
            output: None,
        },
    }
}
