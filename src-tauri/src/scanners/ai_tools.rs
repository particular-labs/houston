use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::process::Command;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum InstallMethod {
    Npm,
    Pip,
    BrewCask,
    GhExtension,
    SelfManaged,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiToolInfo {
    pub name: String,
    pub binary: String,
    pub installed: bool,
    pub version: Option<String>,
    pub latest_version: Option<String>,
    pub update_available: bool,
    pub install_method: InstallMethod,
    pub package_name: String,
    pub binary_path: Option<String>,
    pub install_hint: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiToolsReport {
    pub tools: Vec<AiToolInfo>,
    pub scanned_at: String,
}

struct ToolSpec {
    name: &'static str,
    binary: &'static str,
    package_name: &'static str,
    install_method: InstallMethod,
    install_hint: &'static str,
}

fn tool_registry() -> Vec<ToolSpec> {
    vec![
        ToolSpec {
            name: "Claude Code",
            binary: "claude",
            package_name: "@anthropic-ai/claude-code",
            install_method: InstallMethod::Npm,
            install_hint: "npm i -g @anthropic-ai/claude-code",
        },
        ToolSpec {
            name: "OpenAI Codex CLI",
            binary: "codex",
            package_name: "@openai/codex",
            install_method: InstallMethod::Npm,
            install_hint: "npm i -g @openai/codex",
        },
        ToolSpec {
            name: "Gemini CLI",
            binary: "gemini",
            package_name: "@google/gemini-cli",
            install_method: InstallMethod::Npm,
            install_hint: "npm i -g @google/gemini-cli",
        },
        ToolSpec {
            name: "Aider",
            binary: "aider",
            package_name: "aider-chat",
            install_method: InstallMethod::Pip,
            install_hint: "pip install aider-chat",
        },
        ToolSpec {
            name: "Amazon Q Developer",
            binary: "q",
            package_name: "kiro-cli",
            install_method: InstallMethod::BrewCask,
            install_hint: "brew install --cask kiro-cli",
        },
        ToolSpec {
            name: "GitHub Copilot CLI",
            binary: "",
            package_name: "gh-copilot",
            install_method: InstallMethod::GhExtension,
            install_hint: "gh extension install github/gh-copilot",
        },
        ToolSpec {
            name: "Amp",
            binary: "amp",
            package_name: "",
            install_method: InstallMethod::SelfManaged,
            install_hint: "https://ampcode.com",
        },
        ToolSpec {
            name: "Cursor",
            binary: "cursor",
            package_name: "",
            install_method: InstallMethod::SelfManaged,
            install_hint: "https://cursor.com",
        },
    ]
}

/// npm outdated -g --json → { "pkg": { "current": "x", "latest": "y" } }
struct NpmOutdated {
    current: String,
    latest: String,
}

fn fetch_npm_outdated() -> HashMap<String, NpmOutdated> {
    let mut map = HashMap::new();
    // npm outdated exits 1 when packages are outdated -- that's not an error
    let output = Command::new("npm")
        .args(["outdated", "-g", "--json"])
        .output();
    if let Ok(out) = output {
        let stdout = String::from_utf8_lossy(&out.stdout);
        if let Ok(json) = serde_json::from_str::<serde_json::Value>(&stdout) {
            if let Some(obj) = json.as_object() {
                for (pkg, info) in obj {
                    let current = info
                        .get("current")
                        .and_then(|v| v.as_str())
                        .unwrap_or("")
                        .to_string();
                    let latest = info
                        .get("latest")
                        .and_then(|v| v.as_str())
                        .unwrap_or("")
                        .to_string();
                    if !current.is_empty() && !latest.is_empty() {
                        map.insert(pkg.clone(), NpmOutdated { current, latest });
                    }
                }
            }
        }
    }
    map
}

/// pip3 list --outdated --format=json → [{ "name": "x", "version": "y", "latest_version": "z" }]
struct PipOutdated {
    version: String,
    latest: String,
}

fn fetch_pip_outdated() -> HashMap<String, PipOutdated> {
    let mut map = HashMap::new();
    let output = Command::new("pip3")
        .args(["list", "--outdated", "--format=json"])
        .output();
    if let Ok(out) = output {
        // Only parse stdout -- pip3 emits warnings to stderr
        let stdout = String::from_utf8_lossy(&out.stdout);
        if let Ok(json) = serde_json::from_str::<serde_json::Value>(&stdout) {
            if let Some(arr) = json.as_array() {
                for item in arr {
                    let name = item
                        .get("name")
                        .and_then(|v| v.as_str())
                        .unwrap_or("")
                        .to_string();
                    let version = item
                        .get("version")
                        .and_then(|v| v.as_str())
                        .unwrap_or("")
                        .to_string();
                    let latest = item
                        .get("latest_version")
                        .and_then(|v| v.as_str())
                        .unwrap_or("")
                        .to_string();
                    if !name.is_empty() {
                        map.insert(name.to_lowercase(), PipOutdated { version, latest });
                    }
                }
            }
        }
    }
    map
}

/// brew outdated --json has { "formulae": [...], "casks": [...] }
struct BrewOutdated {
    installed: String,
    current: String,
}

fn fetch_brew_outdated() -> HashMap<String, BrewOutdated> {
    let mut map = HashMap::new();
    let output = Command::new("brew")
        .args(["outdated", "--json"])
        .output();
    if let Ok(out) = output {
        if out.status.success() {
            let stdout = String::from_utf8_lossy(&out.stdout);
            if let Ok(json) = serde_json::from_str::<serde_json::Value>(&stdout) {
                // Parse formulae
                if let Some(formulae) = json.get("formulae").and_then(|v| v.as_array()) {
                    for item in formulae {
                        let name = item
                            .get("name")
                            .and_then(|v| v.as_str())
                            .unwrap_or("")
                            .to_string();
                        let installed = item
                            .get("installed_versions")
                            .and_then(|v| v.as_array())
                            .and_then(|a| a.first())
                            .and_then(|v| v.as_str())
                            .unwrap_or("")
                            .to_string();
                        let current = item
                            .get("current_version")
                            .and_then(|v| v.as_str())
                            .unwrap_or("")
                            .to_string();
                        if !name.is_empty() {
                            map.insert(name, BrewOutdated { installed, current });
                        }
                    }
                }
                // Parse casks
                if let Some(casks) = json.get("casks").and_then(|v| v.as_array()) {
                    for item in casks {
                        let name = item
                            .get("name")
                            .and_then(|v| v.as_str())
                            .unwrap_or("")
                            .to_string();
                        let installed = item
                            .get("installed_versions")
                            .and_then(|v| v.as_str())
                            .unwrap_or("")
                            .to_string();
                        let current = item
                            .get("current_version")
                            .and_then(|v| v.as_str())
                            .unwrap_or("")
                            .to_string();
                        if !name.is_empty() {
                            map.insert(name, BrewOutdated { installed, current });
                        }
                    }
                }
            }
        }
    }
    map
}

/// gh extension list → tab-separated text, no --json flag
fn fetch_gh_extensions() -> HashMap<String, String> {
    let mut map = HashMap::new();
    let output = Command::new("gh")
        .args(["extension", "list"])
        .output();
    if let Ok(out) = output {
        if out.status.success() {
            let stdout = String::from_utf8_lossy(&out.stdout);
            for line in stdout.lines() {
                let parts: Vec<&str> = line.split('\t').collect();
                if parts.len() >= 2 {
                    // format: "gh-copilot\tgithub/gh-copilot\tv1.2.3"
                    let name = parts[0].trim().to_string();
                    let version = if parts.len() >= 3 {
                        parts[2].trim().trim_start_matches('v').to_string()
                    } else {
                        String::new()
                    };
                    map.insert(name, version);
                }
            }
        }
    }
    map
}

fn which_binary(binary: &str) -> Option<String> {
    if binary.is_empty() {
        return None;
    }
    let output = Command::new("which").arg(binary).output().ok()?;
    if output.status.success() {
        let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if !path.is_empty() {
            return Some(path);
        }
    }
    None
}

fn get_version(binary: &str) -> Option<String> {
    if binary.is_empty() {
        return None;
    }
    let output = Command::new(binary).arg("--version").output().ok()?;
    // Check both stdout and stderr -- some tools output to stderr
    let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
    let raw = if !stdout.is_empty() { stdout } else { stderr };
    if raw.is_empty() {
        return None;
    }
    Some(extract_version(&raw))
}

/// Extract a semver-like version from a string (e.g. "claude v1.2.3" → "1.2.3")
fn extract_version(s: &str) -> String {
    // Try to find a semver-like pattern
    for word in s.split_whitespace() {
        let trimmed = word.trim_start_matches('v').trim_start_matches('V');
        if trimmed
            .chars()
            .next()
            .map_or(false, |c| c.is_ascii_digit())
            && trimmed.contains('.')
        {
            return trimmed.to_string();
        }
    }
    // Fallback: return first line trimmed
    s.lines().next().unwrap_or(s).to_string()
}

pub fn scan() -> AiToolsReport {
    let registry = tool_registry();

    // Phase 1: Run batch commands in parallel
    let npm_handle = std::thread::spawn(fetch_npm_outdated);
    let pip_handle = std::thread::spawn(fetch_pip_outdated);
    let brew_handle = std::thread::spawn(fetch_brew_outdated);
    let gh_handle = std::thread::spawn(fetch_gh_extensions);

    let npm_outdated = npm_handle.join().unwrap_or_default();
    let pip_outdated = pip_handle.join().unwrap_or_default();
    let brew_outdated = brew_handle.join().unwrap_or_default();
    let gh_extensions = gh_handle.join().unwrap_or_default();

    // Phase 2: Resolve each tool
    let tools: Vec<AiToolInfo> = registry
        .into_iter()
        .map(|spec| {
            let binary_path = which_binary(spec.binary);

            // For GhExtension, check if the extension is installed
            let is_gh_extension = matches!(spec.install_method, InstallMethod::GhExtension);
            let gh_installed = if is_gh_extension {
                gh_extensions.contains_key(spec.package_name)
            } else {
                false
            };

            let installed = binary_path.is_some() || gh_installed;

            let version = if is_gh_extension && gh_installed {
                let v = gh_extensions.get(spec.package_name).cloned();
                v.filter(|s| !s.is_empty())
            } else if installed {
                get_version(spec.binary)
            } else {
                None
            };

            // Cross-reference with batch outdated results
            let (latest_version, update_available) = match spec.install_method {
                InstallMethod::Npm => {
                    if let Some(info) = npm_outdated.get(spec.package_name) {
                        (Some(info.latest.clone()), info.current != info.latest)
                    } else {
                        (None, false)
                    }
                }
                InstallMethod::Pip => {
                    let key = spec.package_name.to_lowercase();
                    if let Some(info) = pip_outdated.get(&key) {
                        (Some(info.latest.clone()), info.version != info.latest)
                    } else {
                        (None, false)
                    }
                }
                InstallMethod::BrewCask => {
                    if let Some(info) = brew_outdated.get(spec.package_name) {
                        (
                            Some(info.current.clone()),
                            info.installed != info.current,
                        )
                    } else {
                        (None, false)
                    }
                }
                InstallMethod::GhExtension => {
                    // gh extensions don't have a standard outdated check
                    (None, false)
                }
                InstallMethod::SelfManaged => {
                    // Self-managed tools: skip update check
                    (None, false)
                }
            };

            AiToolInfo {
                name: spec.name.to_string(),
                binary: spec.binary.to_string(),
                installed,
                version,
                latest_version,
                update_available,
                install_method: spec.install_method,
                package_name: spec.package_name.to_string(),
                binary_path,
                install_hint: spec.install_hint.to_string(),
            }
        })
        .collect();

    AiToolsReport {
        tools,
        scanned_at: chrono::Local::now().to_rfc3339(),
    }
}
