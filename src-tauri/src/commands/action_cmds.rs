use crate::state::AppState;
use std::path::Path;
use std::process::Command;
use tauri::State;

/// Validates that a path exists and is a directory, returning its canonical form.
/// This prevents command injection by ensuring the path is a real filesystem directory.
fn validate_path(path: &str) -> Result<std::path::PathBuf, String> {
    let path_obj = Path::new(path);
    if !path_obj.exists() {
        return Err("Path does not exist".to_string());
    }
    if !path_obj.is_dir() {
        return Err("Path must be a directory".to_string());
    }
    path_obj
        .canonicalize()
        .map_err(|e| format!("Invalid path: {}", e))
}

#[tauri::command]
pub fn open_in_terminal(state: State<'_, AppState>, path: String) -> Result<(), String> {
    let validated_path = validate_path(&path)?;
    let path = validated_path.to_string_lossy().to_string();

    let preferred = {
        let db = state.db.lock().unwrap();
        db.get_setting("default_terminal").ok().flatten()
    };
    let terminal = preferred.as_deref().unwrap_or("auto");

    #[cfg(target_os = "macos")]
    {
        if terminal != "auto" {
            let result = match terminal {
                "iTerm2" => Command::new("open").args(["-a", "iTerm", &path]).spawn(),
                "Warp" => Command::new("open").args(["-a", "Warp", &path]).spawn(),
                "Ghostty" => Command::new("open").args(["-a", "Ghostty", &path]).spawn(),
                "kitty" => Command::new("kitty").args(["--directory", &path]).spawn(),
                "Alacritty" => Command::new("alacritty").args(["--working-directory", &path]).spawn(),
                "WezTerm" => Command::new("wezterm").args(["start", "--cwd", &path]).spawn(),
                "Hyper" => Command::new("open").args(["-a", "Hyper", &path]).spawn(),
                _ => Command::new("open").args(["-a", "Terminal", &path]).spawn(),
            };
            if result.is_ok() {
                return Ok(());
            }
            // Fall through to default Terminal if preferred fails
        }
        Command::new("open")
            .args(["-a", "Terminal", &path])
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    #[cfg(target_os = "linux")]
    {
        // Try common terminal emulators
        let terminals = ["gnome-terminal", "konsole", "xterm"];
        let mut success = false;
        for term in &terminals {
            if Command::new(term)
                .arg(&format!("--working-directory={}", path))
                .spawn()
                .is_ok()
            {
                success = true;
                break;
            }
        }
        if !success {
            return Err("No terminal emulator found".to_string());
        }
    }

    #[cfg(target_os = "windows")]
    {
        Command::new("cmd")
            .args(["/C", "start", "cmd", "/K", &format!("cd /d {}", path)])
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[tauri::command]
pub fn open_in_editor(state: State<'_, AppState>, path: String) -> Result<(), String> {
    let validated_path = validate_path(&path)?;
    let path = validated_path.to_string_lossy().to_string();

    // Get preferred editor from settings
    let preferred_editor = {
        let db = state.db.lock().unwrap();
        db.get_setting("default_editor").ok().flatten()
    };

    // If a specific editor is configured (not "auto"), try it first
    if let Some(ref editor) = preferred_editor {
        if editor != "auto" {
            // Map tool names to binary commands
            let binary = match editor.as_str() {
                "VS Code" => "code",
                "Cursor" => "cursor",
                "Windsurf" => "windsurf",
                "Zed" => "zed",
                "Sublime Text" => "subl",
                "Neovim" => "nvim",
                "WebStorm" => "webstorm",
                "PyCharm" => "pycharm",
                "IntelliJ IDEA" => "idea",
                other => other, // fallback: treat as binary name directly
            };
            if Command::new(binary).arg(&path).spawn().is_ok() {
                return Ok(());
            }
            // Fall through to auto-detection if preferred editor fails
        }
    }

    // Auto-detection: Try common editors in order
    let editors = ["code", "cursor", "zed", "subl", "nvim", "vim", "emacs"];

    for editor in &editors {
        if Command::new(editor).arg(&path).spawn().is_ok() {
            return Ok(());
        }
    }

    // Platform-specific fallbacks
    #[cfg(target_os = "windows")]
    {
        let win_editors = ["notepad++", "notepad"];
        for editor in &win_editors {
            if Command::new(editor).arg(&path).spawn().is_ok() {
                return Ok(());
            }
        }
    }

    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
        return Ok(());
    }

    #[cfg(target_os = "linux")]
    {
        Command::new("xdg-open")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
        return Ok(());
    }

    #[allow(unreachable_code)]
    Err("No editor found".to_string())
}

#[tauri::command]
pub fn open_in_ai_tool(state: State<'_, AppState>, path: String) -> Result<(), String> {
    let validated_path = validate_path(&path)?;
    let path_str = validated_path.to_string_lossy().to_string();

    let preferred = {
        let db = state.db.lock().unwrap();
        db.get_setting("default_ai_tool").ok().flatten()
    };
    let tool = preferred.as_deref().unwrap_or("auto");

    let result = match tool {
        "Claude Code" => Command::new("claude").current_dir(&validated_path).spawn(),
        "OpenAI Codex CLI" => Command::new("codex").current_dir(&validated_path).spawn(),
        "Gemini CLI" => Command::new("gemini").current_dir(&validated_path).spawn(),
        "Aider" => Command::new("aider").current_dir(&validated_path).spawn(),
        "Amp" => Command::new("amp").current_dir(&validated_path).spawn(),
        "Amazon Q Developer" => Command::new("q").current_dir(&validated_path).spawn(),
        "Cursor" => Command::new("cursor").arg(&path_str).spawn(),
        "Windsurf" => Command::new("windsurf").arg(&path_str).spawn(),
        _ => {
            // "auto": try CLI tools in order
            for bin in &["claude", "codex", "gemini", "aider", "amp"] {
                if Command::new(bin).current_dir(&validated_path).spawn().is_ok() {
                    return Ok(());
                }
            }
            return Err("No AI coding tool found. Install one or set a preference in Settings.".into());
        }
    };

    result.map(|_| ()).map_err(|e| format!("Failed to open AI tool: {}", e))
}
