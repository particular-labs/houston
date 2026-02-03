use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct McpServer {
    pub name: String,
    pub command: String,
    pub args: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SettingEntry {
    pub key: String,
    pub value: String,
    pub value_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClaudeConfig {
    pub installed: bool,
    pub config_path: String,
    pub has_mcp_servers: bool,
    pub mcp_servers: Vec<McpServer>,
    pub project_count: usize,
    pub has_settings: bool,
    pub settings: Vec<SettingEntry>,
}

fn get_claude_dir() -> PathBuf {
    dirs::home_dir()
        .unwrap_or_else(|| PathBuf::from("~"))
        .join(".claude")
}

pub fn scan() -> ClaudeConfig {
    let claude_dir = get_claude_dir();
    let installed = claude_dir.exists();

    if !installed {
        return ClaudeConfig {
            installed: false,
            config_path: claude_dir.to_string_lossy().to_string(),
            has_mcp_servers: false,
            mcp_servers: Vec::new(),
            project_count: 0,
            has_settings: false,
            settings: Vec::new(),
        };
    }

    // Read MCP servers from settings
    let settings_path = claude_dir.join("settings.json");
    let mut mcp_servers = Vec::new();
    let mut has_settings = false;
    let mut settings = Vec::new();

    if settings_path.exists() {
        has_settings = true;
        if let Ok(content) = fs::read_to_string(&settings_path) {
            if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
                // Parse MCP servers
                if let Some(servers) = json.get("mcpServers").and_then(|s| s.as_object()) {
                    for (name, config) in servers {
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

                        mcp_servers.push(McpServer {
                            name: name.clone(),
                            command,
                            args,
                        });
                    }
                }

                // Collect structured settings
                for (key, value) in json.as_object().into_iter().flatten() {
                    if key != "mcpServers" {
                        let (val_str, val_type) = match value {
                            serde_json::Value::Bool(b) => (b.to_string(), "boolean"),
                            serde_json::Value::String(s) => (s.clone(), "string"),
                            serde_json::Value::Number(n) => (n.to_string(), "number"),
                            serde_json::Value::Array(_) => (
                                serde_json::to_string_pretty(value).unwrap_or_default(),
                                "array",
                            ),
                            serde_json::Value::Object(_) => (
                                serde_json::to_string_pretty(value).unwrap_or_default(),
                                "object",
                            ),
                            serde_json::Value::Null => ("null".to_string(), "null"),
                        };
                        settings.push(SettingEntry {
                            key: key.clone(),
                            value: val_str,
                            value_type: val_type.to_string(),
                        });
                    }
                }
            }
        }
    }

    // Count projects directory
    let projects_dir = claude_dir.join("projects");
    let project_count = if projects_dir.exists() {
        fs::read_dir(&projects_dir)
            .map(|entries| {
                entries
                    .filter_map(|e| e.ok())
                    .filter(|e| e.path().is_dir())
                    .count()
            })
            .unwrap_or(0)
    } else {
        0
    };

    let has_mcp_servers = !mcp_servers.is_empty();

    ClaudeConfig {
        installed,
        config_path: claude_dir.to_string_lossy().to_string(),
        has_mcp_servers,
        mcp_servers,
        project_count,
        has_settings,
        settings,
    }
}
