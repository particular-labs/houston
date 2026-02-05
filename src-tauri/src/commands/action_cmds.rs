use crate::state::AppState;
use std::process::Command;
use tauri::State;

#[tauri::command]
pub fn open_in_terminal(path: String) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
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
    // Get preferred editor from settings
    let preferred_editor = {
        let db = state.db.lock().unwrap();
        db.get_setting("default_editor").ok().flatten()
    };

    // If a specific editor is configured (not "auto"), try it first
    if let Some(ref editor) = preferred_editor {
        if editor != "auto" {
            if Command::new(editor).arg(&path).spawn().is_ok() {
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
pub fn open_claude_code(path: String) -> Result<(), String> {
    Command::new("claude")
        .current_dir(&path)
        .spawn()
        .map_err(|e| format!("Failed to open Claude Code: {}", e))?;
    Ok(())
}
