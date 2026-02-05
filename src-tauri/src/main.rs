// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

/// Source the user's login shell environment so the built .app bundle
/// sees the same PATH, env vars, and binaries as a terminal session.
/// `fix_path_env` only partially restores PATH; this loads everything
/// the shell profile sets (nvm, pyenv, rbenv, GOPATH, custom vars, etc).
///
/// Only runs on Unix (macOS/Linux) — Windows GUI apps already inherit
/// the full user environment from the registry.
#[cfg(unix)]
fn load_shell_env() {
    // fix_path_env as a baseline
    let _ = fix_path_env::fix();

    // Detect the user's login shell
    let shell = std::env::var("SHELL").unwrap_or_else(|_| "/bin/zsh".to_string());

    // Ask the shell to run as an interactive login shell and print its env
    let output = std::process::Command::new(&shell)
        .args(["-ilc", "env"])
        .output();

    let output = match output {
        Ok(o) if o.status.success() => o,
        _ => return, // Fallback: keep whatever fix_path_env gave us
    };

    let stdout = String::from_utf8_lossy(&output.stdout);
    for line in stdout.lines() {
        // env output is KEY=VALUE (value may contain '=')
        if let Some((key, value)) = line.split_once('=') {
            // Skip empty keys and a few that shouldn't be overridden
            if key.is_empty() || key == "_" || key == "SHLVL" || key == "PWD" || key == "OLDPWD" {
                continue;
            }
            std::env::set_var(key, value);
        }
    }
}

fn main() {
    #[cfg(unix)]
    load_shell_env();

    houston_lib::run()
}
