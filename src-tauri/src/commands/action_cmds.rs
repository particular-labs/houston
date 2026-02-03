use std::process::Command;

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

    Ok(())
}

#[tauri::command]
pub fn open_in_editor(path: String) -> Result<(), String> {
    // Try VS Code first, then Cursor, then fall back
    let editors = ["code", "cursor", "zed", "subl"];

    for editor in &editors {
        if Command::new(editor).arg(&path).spawn().is_ok() {
            return Ok(());
        }
    }

    // macOS fallback: open with default app
    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
        return Ok(());
    }

    #[cfg(not(target_os = "macos"))]
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
