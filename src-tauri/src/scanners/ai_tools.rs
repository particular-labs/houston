use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use std::process::Command;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum InstallMethod {
    Npm,
    Pip,
    Brew,
    BrewCask,
    GhExtension,
    SelfManaged,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ToolType {
    Cli,
    App,
    Both,
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
    pub tool_type: ToolType,
    pub app_name: Option<String>,
    pub app_installed: bool,
    pub app_path: Option<String>,
    pub app_version: Option<String>,
    pub config_dir: Option<String>,
    pub has_ai: bool,
    pub ai_features: Vec<String>,
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
    tool_type: ToolType,
    app_bundle: Option<&'static str>,
    config_dir_name: Option<&'static str>,
    config_dir_alt: Option<&'static str>,
    has_ai: bool,
    ai_features: &'static [&'static str],
    app_bundle_alt: Option<&'static str>,
}

fn tool_registry() -> Vec<ToolSpec> {
    vec![
        ToolSpec {
            name: "Claude Code",
            binary: "claude",
            package_name: "@anthropic-ai/claude-code",
            install_method: InstallMethod::Npm,
            install_hint: "npm i -g @anthropic-ai/claude-code",
            tool_type: ToolType::Cli,
            app_bundle: None,
            config_dir_name: Some(".claude"),
            config_dir_alt: None,
            has_ai: true,
            ai_features: &["Agent", "Chat", "MCP"],
            app_bundle_alt: None,
        },
        ToolSpec {
            name: "Claude Desktop",
            binary: "",
            package_name: "",
            install_method: InstallMethod::SelfManaged,
            install_hint: "https://claude.ai/download",
            tool_type: ToolType::App,
            app_bundle: Some("Claude.app"),
            config_dir_name: Some("Library/Application Support/Claude"),
            config_dir_alt: None,
            has_ai: true,
            ai_features: &["Chat", "MCP", "Artifacts"],
            app_bundle_alt: None,
        },
        ToolSpec {
            name: "OpenAI Codex CLI",
            binary: "codex",
            package_name: "@openai/codex",
            install_method: InstallMethod::Npm,
            install_hint: "npm i -g @openai/codex",
            tool_type: ToolType::Cli,
            app_bundle: None,
            config_dir_name: None,
            config_dir_alt: None,
            has_ai: true,
            ai_features: &["Agent", "Code Generation"],
            app_bundle_alt: None,
        },
        ToolSpec {
            name: "Gemini CLI",
            binary: "gemini",
            package_name: "@google/gemini-cli",
            install_method: InstallMethod::Npm,
            install_hint: "npm i -g @google/gemini-cli",
            tool_type: ToolType::Cli,
            app_bundle: None,
            config_dir_name: None,
            config_dir_alt: None,
            has_ai: true,
            ai_features: &["Agent", "Chat"],
            app_bundle_alt: None,
        },
        ToolSpec {
            name: "Aider",
            binary: "aider",
            package_name: "aider-chat",
            install_method: InstallMethod::Pip,
            install_hint: "pip install aider-chat",
            tool_type: ToolType::Cli,
            app_bundle: None,
            config_dir_name: None,
            config_dir_alt: None,
            has_ai: true,
            ai_features: &["Agent", "Chat", "Code Edit"],
            app_bundle_alt: None,
        },
        ToolSpec {
            name: "Amazon Q Developer",
            binary: "q",
            package_name: "kiro-cli",
            install_method: InstallMethod::BrewCask,
            install_hint: "brew install --cask kiro-cli",
            tool_type: ToolType::Cli,
            app_bundle: None,
            config_dir_name: None,
            config_dir_alt: None,
            has_ai: true,
            ai_features: &["Agent", "Chat", "Code Completion"],
            app_bundle_alt: None,
        },
        ToolSpec {
            name: "GitHub Copilot CLI",
            binary: "",
            package_name: "gh-copilot",
            install_method: InstallMethod::GhExtension,
            install_hint: "gh extension install github/gh-copilot",
            tool_type: ToolType::Cli,
            app_bundle: None,
            config_dir_name: None,
            config_dir_alt: None,
            has_ai: true,
            ai_features: &["CLI Suggestions"],
            app_bundle_alt: None,
        },
        ToolSpec {
            name: "Amp",
            binary: "amp",
            package_name: "",
            install_method: InstallMethod::SelfManaged,
            install_hint: "https://ampcode.com",
            tool_type: ToolType::Cli,
            app_bundle: None,
            config_dir_name: None,
            config_dir_alt: None,
            has_ai: true,
            ai_features: &["Agent", "Chat"],
            app_bundle_alt: None,
        },
        ToolSpec {
            name: "Cursor",
            binary: "cursor",
            package_name: "",
            install_method: InstallMethod::SelfManaged,
            install_hint: "https://cursor.com",
            tool_type: ToolType::Both,
            app_bundle: Some("Cursor.app"),
            config_dir_name: Some("Library/Application Support/Cursor"),
            config_dir_alt: None,
            has_ai: true,
            ai_features: &["Copilot++", "Chat", "Agent"],
            app_bundle_alt: None,
        },
        ToolSpec {
            name: "Windsurf",
            binary: "windsurf",
            package_name: "",
            install_method: InstallMethod::SelfManaged,
            install_hint: "https://windsurf.com",
            tool_type: ToolType::Both,
            app_bundle: Some("Windsurf.app"),
            config_dir_name: Some("Library/Application Support/Windsurf"),
            config_dir_alt: None,
            has_ai: true,
            ai_features: &["Cascade", "Chat", "Autocomplete"],
            app_bundle_alt: None,
        },
        ToolSpec {
            name: "Zed",
            binary: "zed",
            package_name: "",
            install_method: InstallMethod::SelfManaged,
            install_hint: "https://zed.dev",
            tool_type: ToolType::Both,
            app_bundle: Some("Zed.app"),
            config_dir_name: Some("Library/Application Support/Zed"),
            config_dir_alt: None,
            has_ai: true,
            ai_features: &["AI Assistant", "Inline Completion"],
            app_bundle_alt: None,
        },
        // IDEs & Editors
        ToolSpec {
            name: "VS Code",
            binary: "code",
            package_name: "visual-studio-code",
            install_method: InstallMethod::BrewCask,
            install_hint: "brew install --cask visual-studio-code",
            tool_type: ToolType::Both,
            app_bundle: Some("Visual Studio Code.app"),
            config_dir_name: Some("Library/Application Support/Code"),
            config_dir_alt: None,
            has_ai: true,
            ai_features: &["Copilot", "Chat", "Inline Completion"],
            app_bundle_alt: None,
        },
        ToolSpec {
            name: "IntelliJ IDEA",
            binary: "idea",
            package_name: "",
            install_method: InstallMethod::SelfManaged,
            install_hint: "https://www.jetbrains.com/idea/",
            tool_type: ToolType::Both,
            app_bundle: Some("IntelliJ IDEA.app"),
            config_dir_name: None,
            config_dir_alt: None,
            has_ai: true,
            ai_features: &["AI Assistant", "Chat", "Inline Completion"],
            app_bundle_alt: Some("IntelliJ IDEA CE.app"),
        },
        ToolSpec {
            name: "WebStorm",
            binary: "webstorm",
            package_name: "",
            install_method: InstallMethod::SelfManaged,
            install_hint: "https://www.jetbrains.com/webstorm/",
            tool_type: ToolType::Both,
            app_bundle: Some("WebStorm.app"),
            config_dir_name: None,
            config_dir_alt: None,
            has_ai: true,
            ai_features: &["AI Assistant", "Chat", "Inline Completion"],
            app_bundle_alt: None,
        },
        ToolSpec {
            name: "PyCharm",
            binary: "pycharm",
            package_name: "",
            install_method: InstallMethod::SelfManaged,
            install_hint: "https://www.jetbrains.com/pycharm/",
            tool_type: ToolType::Both,
            app_bundle: Some("PyCharm.app"),
            config_dir_name: None,
            config_dir_alt: None,
            has_ai: true,
            ai_features: &["AI Assistant", "Chat", "Inline Completion"],
            app_bundle_alt: Some("PyCharm CE.app"),
        },
        ToolSpec {
            name: "Android Studio",
            binary: "",
            package_name: "",
            install_method: InstallMethod::SelfManaged,
            install_hint: "https://developer.android.com/studio",
            tool_type: ToolType::App,
            app_bundle: Some("Android Studio.app"),
            config_dir_name: None,
            config_dir_alt: None,
            has_ai: true,
            ai_features: &["Gemini", "Chat", "Code Completion"],
            app_bundle_alt: None,
        },
        ToolSpec {
            name: "Neovim",
            binary: "nvim",
            package_name: "neovim",
            install_method: InstallMethod::Brew,
            install_hint: "brew install neovim",
            tool_type: ToolType::Cli,
            app_bundle: None,
            config_dir_name: Some(".config/nvim"),
            config_dir_alt: None,
            has_ai: false,
            ai_features: &[],
            app_bundle_alt: None,
        },
        ToolSpec {
            name: "Warp",
            binary: "",
            package_name: "",
            install_method: InstallMethod::SelfManaged,
            install_hint: "https://www.warp.dev",
            tool_type: ToolType::App,
            app_bundle: Some("Warp.app"),
            config_dir_name: None,
            config_dir_alt: None,
            has_ai: true,
            ai_features: &["Warp AI", "Command Suggestions"],
            app_bundle_alt: None,
        },
        ToolSpec {
            name: "Sublime Text",
            binary: "subl",
            package_name: "",
            install_method: InstallMethod::SelfManaged,
            install_hint: "https://www.sublimetext.com",
            tool_type: ToolType::Both,
            app_bundle: Some("Sublime Text.app"),
            config_dir_name: None,
            config_dir_alt: None,
            has_ai: false,
            ai_features: &[],
            app_bundle_alt: None,
        },
        ToolSpec {
            name: "Nova",
            binary: "",
            package_name: "",
            install_method: InstallMethod::SelfManaged,
            install_hint: "https://nova.app",
            tool_type: ToolType::App,
            app_bundle: Some("Nova.app"),
            config_dir_name: None,
            config_dir_alt: None,
            has_ai: false,
            ai_features: &[],
            app_bundle_alt: None,
        },
    ]
}

/// Check if an app is installed (platform-specific)
fn check_app_installed(bundle: &str) -> Option<String> {
    #[cfg(target_os = "macos")]
    {
        let path = format!("/Applications/{}", bundle);
        if std::path::Path::new(&path).exists() {
            return Some(path);
        }
    }

    #[cfg(target_os = "windows")]
    {
        // Check common Windows install locations
        let name = bundle.trim_end_matches(".app");
        let locations = [
            format!("C:\\Program Files\\{}", name),
            format!("C:\\Program Files (x86)\\{}", name),
        ];
        // Also check user's local appdata
        if let Ok(local_app_data) = std::env::var("LOCALAPPDATA") {
            let user_path = format!("{}\\Programs\\{}", local_app_data, name);
            if std::path::Path::new(&user_path).exists() {
                return Some(user_path);
            }
        }
        for loc in &locations {
            if std::path::Path::new(loc).exists() {
                return Some(loc.clone());
            }
        }
    }

    #[cfg(target_os = "linux")]
    {
        // On Linux, apps are typically just binaries; skip .app bundle check
        let _ = bundle;
    }

    None
}

/// Read app version (macOS: Info.plist, other platforms: None)
fn get_app_version(app_path: &str) -> Option<String> {
    #[cfg(target_os = "macos")]
    {
        let plist_path = format!("{}/Contents/Info", app_path);
        let output = Command::new("defaults")
            .args(["read", &plist_path, "CFBundleShortVersionString"])
            .output()
            .ok()?;
        if output.status.success() {
            let version = String::from_utf8_lossy(&output.stdout).trim().to_string();
            if !version.is_empty() {
                return Some(version);
            }
        }
    }

    #[cfg(not(target_os = "macos"))]
    {
        let _ = app_path;
    }

    None
}

/// Resolve a config directory path from the home directory
fn resolve_config_dir(home: &str, primary: Option<&str>, _alt: Option<&str>) -> Option<String> {
    if let Some(dir_name) = primary {
        let path = PathBuf::from(home).join(dir_name);
        if path.exists() {
            return Some(path.to_string_lossy().to_string());
        }
    }
    None
}

struct NpmOutdated {
    current: String,
    latest: String,
}

fn fetch_npm_outdated() -> HashMap<String, NpmOutdated> {
    let mut map = HashMap::new();
    let json = super::outdated_cache::npm_outdated_json();
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
    map
}

struct PipOutdated {
    version: String,
    latest: String,
}

fn fetch_pip_outdated() -> HashMap<String, PipOutdated> {
    let mut map = HashMap::new();
    let json = super::outdated_cache::pip_outdated_json();
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
    map
}

struct BrewOutdated {
    installed: String,
    current: String,
}

fn fetch_brew_outdated() -> HashMap<String, BrewOutdated> {
    let mut map = HashMap::new();
    let json = super::outdated_cache::brew_outdated_json();
    if json.is_null() {
        return map;
    }
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
    map
}

/// gh extension list → tab-separated text, no --json flag
fn fetch_gh_extensions() -> HashMap<String, String> {
    let mut map = HashMap::new();
    let output = Command::new("gh").args(["extension", "list"]).output();
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
    #[cfg(unix)]
    let cmd = "which";
    #[cfg(windows)]
    let cmd = "where.exe";

    let output = Command::new(cmd).arg(binary).output().ok()?;
    if output.status.success() {
        let out = String::from_utf8_lossy(&output.stdout);
        let path = out.lines().next()?.trim().to_string();
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
        if trimmed.chars().next().map_or(false, |c| c.is_ascii_digit()) && trimmed.contains('.') {
            return trimmed.to_string();
        }
    }
    // Fallback: return first line trimmed
    s.lines().next().unwrap_or(s).to_string()
}

/// Returns the (command, args) needed to update the given tool, if updatable.
pub fn get_update_command(tool_name: &str) -> Option<(String, Vec<String>)> {
    let registry = tool_registry();
    let spec = registry.iter().find(|s| s.name == tool_name)?;
    if spec.package_name.is_empty() {
        return None;
    }
    match spec.install_method {
        InstallMethod::Npm => Some((
            "npm".to_string(),
            vec![
                "update".to_string(),
                "-g".to_string(),
                spec.package_name.to_string(),
            ],
        )),
        InstallMethod::Pip => Some((
            "pip3".to_string(),
            vec![
                "install".to_string(),
                "--upgrade".to_string(),
                spec.package_name.to_string(),
            ],
        )),
        InstallMethod::Brew => Some((
            "brew".to_string(),
            vec!["upgrade".to_string(), spec.package_name.to_string()],
        )),
        InstallMethod::BrewCask => Some((
            "brew".to_string(),
            vec![
                "upgrade".to_string(),
                "--cask".to_string(),
                spec.package_name.to_string(),
            ],
        )),
        _ => None,
    }
}

// --- MCP Server Discovery ---

struct McpConfigSpec {
    config_path: String,
    json_key: &'static str,
}

fn get_mcp_config_spec(tool_name: &str) -> Option<McpConfigSpec> {
    let home = dirs::home_dir()?;

    #[cfg(target_os = "macos")]
    let claude_desktop_path = "Library/Application Support/Claude/claude_desktop_config.json";
    #[cfg(target_os = "windows")]
    let claude_desktop_path = "AppData/Roaming/Claude/claude_desktop_config.json";
    #[cfg(target_os = "linux")]
    let claude_desktop_path = ".config/Claude/claude_desktop_config.json";

    #[cfg(target_os = "macos")]
    let cursor_config_path = ".cursor/mcp.json";
    #[cfg(target_os = "windows")]
    let cursor_config_path = ".cursor/mcp.json";
    #[cfg(target_os = "linux")]
    let cursor_config_path = ".cursor/mcp.json";

    let (relative_path, json_key) = match tool_name {
        "Claude Code" => (".claude/settings.json", "mcpServers"),
        "Claude Desktop" => (claude_desktop_path, "mcpServers"),
        "Cursor" => (cursor_config_path, "mcpServers"),
        "Windsurf" => (".codeium/windsurf/mcp_config.json", "mcpServers"),
        "Zed" => (".config/zed/settings.json", "context_servers"),
        "VS Code" => (".vscode/mcp.json", "servers"),
        _ => return None,
    };
    Some(McpConfigSpec {
        config_path: home.join(relative_path).to_string_lossy().to_string(),
        json_key,
    })
}

pub fn scan_mcp_servers(tool_name: &str) -> Vec<crate::scanners::claude::McpServer> {
    let spec = match get_mcp_config_spec(tool_name) {
        Some(s) => s,
        None => return Vec::new(),
    };

    let path = std::path::Path::new(&spec.config_path);
    if !path.exists() {
        return Vec::new();
    }

    let content = match std::fs::read_to_string(path) {
        Ok(c) => c,
        Err(_) => return Vec::new(),
    };

    let json: serde_json::Value = match serde_json::from_str(&content) {
        Ok(v) => v,
        Err(_) => return Vec::new(),
    };

    let servers = match json.get(spec.json_key).and_then(|s| s.as_object()) {
        Some(s) => s,
        None => return Vec::new(),
    };

    servers
        .iter()
        .map(|(name, config)| {
            let command = config
                .get("command")
                .and_then(|c| c.as_str())
                .unwrap_or("")
                .to_string();
            let args = config
                .get("args")
                .and_then(|a| a.as_array())
                .map(|arr| {
                    arr.iter()
                        .filter_map(|v| v.as_str().map(|s| s.to_string()))
                        .collect()
                })
                .unwrap_or_default();
            crate::scanners::claude::McpServer {
                name: name.clone(),
                command,
                args,
            }
        })
        .collect()
}

pub fn scan() -> AiToolsReport {
    let registry = tool_registry();
    let home = dirs::home_dir()
        .map(|p| p.to_string_lossy().to_string())
        .unwrap_or_default();

    // Phase 1: Run batch commands in parallel
    let npm_handle = std::thread::spawn(fetch_npm_outdated);
    let pip_handle = std::thread::spawn(fetch_pip_outdated);
    let brew_handle = std::thread::spawn(fetch_brew_outdated);
    let gh_handle = std::thread::spawn(fetch_gh_extensions);

    let npm_outdated = npm_handle.join().unwrap_or_default();
    let pip_outdated = pip_handle.join().unwrap_or_default();
    let brew_outdated = brew_handle.join().unwrap_or_default();
    let gh_extensions = gh_handle.join().unwrap_or_default();

    // Phase 2: Resolve each tool in parallel
    use std::sync::Arc;
    let npm_outdated = Arc::new(npm_outdated);
    let pip_outdated = Arc::new(pip_outdated);
    let brew_outdated = Arc::new(brew_outdated);
    let gh_extensions = Arc::new(gh_extensions);

    let handles: Vec<_> = registry
        .into_iter()
        .map(|spec| {
            let home = home.clone();
            let npm_outdated = Arc::clone(&npm_outdated);
            let pip_outdated = Arc::clone(&pip_outdated);
            let brew_outdated = Arc::clone(&brew_outdated);
            let gh_extensions = Arc::clone(&gh_extensions);
            std::thread::spawn(move || {
                // CLI detection
                let binary_path = which_binary(spec.binary);

                // For GhExtension, check if the extension is installed
                let is_gh_extension = matches!(spec.install_method, InstallMethod::GhExtension);
                let gh_installed = if is_gh_extension {
                    gh_extensions.contains_key(spec.package_name)
                } else {
                    false
                };

                let cli_found = binary_path.is_some() || gh_installed;

                let version = if is_gh_extension && gh_installed {
                    let v = gh_extensions.get(spec.package_name).cloned();
                    v.filter(|s| !s.is_empty())
                } else if cli_found {
                    get_version(spec.binary)
                } else {
                    None
                };

                // App detection (check primary bundle, then alternate)
                let app_path = spec
                    .app_bundle
                    .and_then(check_app_installed)
                    .or_else(|| spec.app_bundle_alt.and_then(check_app_installed));
                let app_installed = app_path.is_some();
                let app_version = app_path.as_deref().and_then(get_app_version);
                let app_name = spec.app_bundle.map(|b| b.to_string());

                // installed = depends on tool_type
                let installed = match spec.tool_type {
                    ToolType::Cli => cli_found,
                    ToolType::App => app_installed,
                    ToolType::Both => cli_found || app_installed,
                };

                // Resolve config directory
                let config_dir =
                    resolve_config_dir(&home, spec.config_dir_name, spec.config_dir_alt);

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
                    InstallMethod::Brew => {
                        if let Some(info) = brew_outdated.get(spec.package_name) {
                            (Some(info.current.clone()), info.installed != info.current)
                        } else {
                            (None, false)
                        }
                    }
                    InstallMethod::BrewCask => {
                        if let Some(info) = brew_outdated.get(spec.package_name) {
                            (Some(info.current.clone()), info.installed != info.current)
                        } else {
                            (None, false)
                        }
                    }
                    InstallMethod::GhExtension => (None, false),
                    InstallMethod::SelfManaged => (None, false),
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
                    tool_type: spec.tool_type,
                    app_name,
                    app_installed,
                    app_path,
                    app_version,
                    config_dir,
                    has_ai: spec.has_ai,
                    ai_features: spec.ai_features.iter().map(|s| s.to_string()).collect(),
                }
            })
        })
        .collect();

    let tools: Vec<AiToolInfo> = handles
        .into_iter()
        .filter_map(|h| h.join().ok())
        .collect();

    AiToolsReport {
        tools,
        scanned_at: chrono::Local::now().to_rfc3339(),
    }
}
