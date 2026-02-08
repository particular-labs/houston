use serde::Serialize;
use std::collections::HashMap;
use std::process::Command;

#[derive(Debug, Clone, Serialize)]
pub struct DevServer {
    pub pid: u32,
    pub port: u16,
    pub process_name: String,
    pub framework: Option<String>,
    pub project_path: Option<String>,
    pub uptime_secs: Option<u64>,
}

#[derive(Debug, Clone, Serialize)]
pub struct DevServerReport {
    pub servers: Vec<DevServer>,
    pub scanned_at: String,
}

pub fn scan(known_project_paths: &[String]) -> DevServerReport {
    let servers = discover_servers(known_project_paths);
    DevServerReport {
        servers,
        scanned_at: chrono::Local::now().to_rfc3339(),
    }
}

fn discover_servers(known_project_paths: &[String]) -> Vec<DevServer> {
    // Use lsof on macOS/Linux to find listening TCP processes
    let output = if cfg!(target_os = "windows") {
        Command::new("cmd")
            .args(["/C", "netstat -ano | findstr LISTENING"])
            .output()
    } else {
        Command::new("lsof")
            .args(["-iTCP", "-sTCP:LISTEN", "-nP", "-Fn", "-Fp", "-Fi"])
            .output()
    };

    let output = match output {
        Ok(o) if o.status.success() => String::from_utf8_lossy(&o.stdout).to_string(),
        _ => return Vec::new(),
    };

    if cfg!(target_os = "windows") {
        parse_netstat(&output, known_project_paths)
    } else {
        parse_lsof(&output, known_project_paths)
    }
}

fn parse_lsof(output: &str, known_project_paths: &[String]) -> Vec<DevServer> {
    let mut servers: HashMap<u32, DevServer> = HashMap::new();
    let mut current_pid: Option<u32> = None;

    for line in output.lines() {
        if line.starts_with('p') {
            // PID line
            if let Ok(pid) = line[1..].parse::<u32>() {
                current_pid = Some(pid);
            }
        } else if line.starts_with('n') {
            // Name/address line, e.g., n*:3000 or n127.0.0.1:8080
            if let Some(pid) = current_pid {
                if let Some(port) = extract_port_from_lsof_name(&line[1..]) {
                    // Skip system ports and common non-dev ports
                    if port < 1024 || port == 5353 || port == 7000 || port == 49152 {
                        continue;
                    }
                    // Only add if not already seen for this PID+port combo
                    if !servers.contains_key(&pid) || servers.get(&pid).map_or(true, |s| s.port != port) {
                        let process_name = get_process_name(pid);
                        if !is_dev_server_process(&process_name) {
                            continue;
                        }
                        let cwd = get_process_cwd(pid);
                        let project_path = cwd.as_ref().and_then(|dir| {
                            match_to_project(dir, known_project_paths)
                        });
                        let framework = detect_framework_from_process(&process_name, project_path.as_deref());

                        servers.insert(pid, DevServer {
                            pid,
                            port,
                            process_name,
                            framework,
                            project_path,
                            uptime_secs: get_process_uptime(pid),
                        });
                    }
                }
            }
        }
    }

    servers.into_values().collect()
}

fn parse_netstat(output: &str, _known_project_paths: &[String]) -> Vec<DevServer> {
    let mut servers = Vec::new();
    for line in output.lines() {
        let parts: Vec<&str> = line.split_whitespace().collect();
        if parts.len() < 5 {
            continue;
        }
        // TCP  0.0.0.0:3000  0.0.0.0:0  LISTENING  12345
        if let (Some(addr), Some(pid_str)) = (parts.get(1), parts.last()) {
            if let (Some(port), Ok(pid)) = (
                addr.rsplit(':').next().and_then(|p| p.parse::<u16>().ok()),
                pid_str.parse::<u32>(),
            ) {
                if port < 1024 {
                    continue;
                }
                servers.push(DevServer {
                    pid,
                    port,
                    process_name: String::from("unknown"),
                    framework: None,
                    project_path: None,
                    uptime_secs: None,
                });
            }
        }
    }
    servers
}

fn extract_port_from_lsof_name(name: &str) -> Option<u16> {
    // Format: *:3000 or 127.0.0.1:3000 or [::1]:3000
    name.rsplit(':').next()?.parse::<u16>().ok()
}

fn get_process_name(pid: u32) -> String {
    let output = Command::new("ps")
        .args(["-p", &pid.to_string(), "-o", "comm="])
        .output();
    match output {
        Ok(o) if o.status.success() => {
            String::from_utf8_lossy(&o.stdout).trim().to_string()
        }
        _ => "unknown".to_string(),
    }
}

fn is_dev_server_process(name: &str) -> bool {
    let name_lower = name.to_lowercase();
    // Common dev server process names
    matches!(name_lower.as_str(),
        "node" | "npm" | "npx" | "pnpm" | "yarn" | "bun" |
        "python" | "python3" | "uvicorn" | "gunicorn" | "flask" | "django" |
        "ruby" | "rails" | "puma" | "thin" |
        "go" | "air" |
        "cargo" | "rustc" |
        "java" | "gradle" | "mvn" |
        "php" | "artisan" |
        "next-server" | "vite" | "esbuild" | "webpack" |
        "deno" | "tsx"
    ) || name_lower.contains("node") || name_lower.contains("python") || name_lower.contains("ruby")
}

fn get_process_cwd(pid: u32) -> Option<String> {
    // macOS: Use lsof -p PID to get cwd
    if cfg!(target_os = "macos") {
        let output = Command::new("lsof")
            .args(["-p", &pid.to_string(), "-Fn", "-a", "-d", "cwd"])
            .output()
            .ok()?;
        if output.status.success() {
            let text = String::from_utf8_lossy(&output.stdout);
            for line in text.lines() {
                if line.starts_with('n') && line.len() > 1 {
                    return Some(line[1..].to_string());
                }
            }
        }
    }
    // Linux: Read /proc/{pid}/cwd symlink
    #[cfg(target_os = "linux")]
    {
        if let Ok(path) = std::fs::read_link(format!("/proc/{}/cwd", pid)) {
            return Some(path.to_string_lossy().to_string());
        }
    }
    None
}

fn match_to_project(cwd: &str, known_project_paths: &[String]) -> Option<String> {
    // Check if cwd matches or is a subdirectory of a known project
    for project_path in known_project_paths {
        if cwd.starts_with(project_path.as_str()) {
            return Some(project_path.clone());
        }
    }
    None
}

fn detect_framework_from_process(process_name: &str, project_path: Option<&str>) -> Option<String> {
    // Try to detect framework from the project path first
    if let Some(path) = project_path {
        let path = std::path::Path::new(path);

        // Check for Next.js
        if path.join(".next").exists() || path.join("next.config.js").exists() || path.join("next.config.mjs").exists() || path.join("next.config.ts").exists() {
            return Some("Next.js".to_string());
        }
        // Vite
        if path.join("vite.config.ts").exists() || path.join("vite.config.js").exists() {
            return Some("Vite".to_string());
        }
        // Nuxt
        if path.join("nuxt.config.ts").exists() || path.join("nuxt.config.js").exists() {
            return Some("Nuxt".to_string());
        }
        // SvelteKit
        if path.join("svelte.config.js").exists() || path.join("svelte.config.ts").exists() {
            return Some("SvelteKit".to_string());
        }
        // Django
        if path.join("manage.py").exists() {
            return Some("Django".to_string());
        }
        // Flask
        if path.join("app.py").exists() || path.join("wsgi.py").exists() {
            if process_name.contains("python") || process_name == "flask" || process_name == "gunicorn" {
                return Some("Flask".to_string());
            }
        }
        // Rails
        if path.join("Gemfile").exists() && path.join("config").join("routes.rb").exists() {
            return Some("Rails".to_string());
        }
        // Remix
        if path.join("remix.config.js").exists() || path.join("remix.config.ts").exists() {
            return Some("Remix".to_string());
        }
        // Astro
        if path.join("astro.config.mjs").exists() || path.join("astro.config.ts").exists() {
            return Some("Astro".to_string());
        }
    }

    // Fallback: guess from process name
    match process_name {
        name if name.contains("next") => Some("Next.js".to_string()),
        "uvicorn" => Some("FastAPI".to_string()),
        "gunicorn" => Some("Python".to_string()),
        "flask" => Some("Flask".to_string()),
        "rails" | "puma" => Some("Rails".to_string()),
        _ => None,
    }
}

fn get_process_uptime(pid: u32) -> Option<u64> {
    // Use ps to get elapsed time
    let output = Command::new("ps")
        .args(["-p", &pid.to_string(), "-o", "etime="])
        .output()
        .ok()?;
    if !output.status.success() {
        return None;
    }
    let etime = String::from_utf8_lossy(&output.stdout).trim().to_string();
    parse_etime(&etime)
}

fn parse_etime(etime: &str) -> Option<u64> {
    // Formats: "SS", "MM:SS", "HH:MM:SS", "D-HH:MM:SS"
    let parts: Vec<&str> = etime.split('-').collect();
    let (days, time_part) = if parts.len() == 2 {
        (parts[0].parse::<u64>().unwrap_or(0), parts[1])
    } else {
        (0, etime)
    };

    let segments: Vec<u64> = time_part
        .split(':')
        .filter_map(|s| s.trim().parse().ok())
        .collect();

    match segments.len() {
        1 => Some(days * 86400 + segments[0]),
        2 => Some(days * 86400 + segments[0] * 60 + segments[1]),
        3 => Some(days * 86400 + segments[0] * 3600 + segments[1] * 60 + segments[2]),
        _ => None,
    }
}

pub fn stop_dev_server(pid: u32) -> Result<(), String> {
    // Send SIGTERM first
    #[cfg(unix)]
    {
        let status = Command::new("kill")
            .args(["-TERM", &pid.to_string()])
            .status()
            .map_err(|e| e.to_string())?;
        if !status.success() {
            return Err(format!("Failed to send SIGTERM to PID {}", pid));
        }
        // Wait 5 seconds, then SIGKILL if still running
        std::thread::sleep(std::time::Duration::from_secs(5));
        let check = Command::new("kill")
            .args(["-0", &pid.to_string()])
            .status();
        if let Ok(s) = check {
            if s.success() {
                let _ = Command::new("kill")
                    .args(["-KILL", &pid.to_string()])
                    .status();
            }
        }
    }
    #[cfg(windows)]
    {
        let status = Command::new("taskkill")
            .args(["/PID", &pid.to_string(), "/F"])
            .status()
            .map_err(|e| e.to_string())?;
        if !status.success() {
            return Err(format!("Failed to kill PID {}", pid));
        }
    }
    Ok(())
}

pub fn start_dev_server(project_path: &str, command: Option<&str>) -> Result<DevServer, String> {
    let cmd = command.unwrap_or("npm run dev");
    let parts: Vec<&str> = cmd.split_whitespace().collect();
    if parts.is_empty() {
        return Err("Empty command".to_string());
    }

    let child = Command::new(parts[0])
        .args(&parts[1..])
        .current_dir(project_path)
        .stdin(std::process::Stdio::null())
        .stdout(std::process::Stdio::null())
        .stderr(std::process::Stdio::null())
        .spawn()
        .map_err(|e| format!("Failed to start: {}", e))?;

    let pid = child.id();

    Ok(DevServer {
        pid,
        port: 0, // Will be detected on next scan
        process_name: parts[0].to_string(),
        framework: None,
        project_path: Some(project_path.to_string()),
        uptime_secs: Some(0),
    })
}
