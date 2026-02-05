use serde::{Deserialize, Serialize};
use std::process::Command;
use sysinfo::System;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemInfo {
    pub os_name: String,
    pub os_version: String,
    pub kernel_version: String,
    pub architecture: String,
    pub hostname: String,
    pub shell: String,
    pub shell_version: String,
    pub cpu_brand: String,
    pub memory_gb: String,
    pub username: String,
    pub home_dir: String,
    pub binary_architecture: String,
    pub architecture_mismatch: bool,
}

fn detect_shell() -> (String, String) {
    #[cfg(unix)]
    {
        let shell_path = std::env::var("SHELL").unwrap_or_else(|_| "/bin/sh".into());
        let shell = shell_path
            .split('/')
            .last()
            .unwrap_or("unknown")
            .to_string();

        let version = Command::new(&shell_path)
            .arg("--version")
            .output()
            .map(|o| {
                let stdout = String::from_utf8_lossy(&o.stdout).trim().to_string();
                if stdout.is_empty() {
                    String::from_utf8_lossy(&o.stderr).trim().to_string()
                } else {
                    stdout
                }
            })
            .unwrap_or_default();

        let version = version.lines().next().unwrap_or("").to_string();
        (shell, version)
    }

    #[cfg(windows)]
    {
        let comspec = std::env::var("COMSPEC").unwrap_or_else(|_| "cmd.exe".into());
        let shell = if comspec.to_lowercase().contains("powershell") {
            "powershell".to_string()
        } else if comspec.to_lowercase().contains("pwsh") {
            "pwsh".to_string()
        } else {
            "cmd".to_string()
        };

        let version = if shell == "cmd" {
            // cmd doesn't have a clean version output; use ver
            Command::new("cmd")
                .args(["/C", "ver"])
                .output()
                .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
                .unwrap_or_default()
        } else {
            Command::new("powershell")
                .args(["-NoProfile", "-Command", "$PSVersionTable.PSVersion.ToString()"])
                .output()
                .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
                .unwrap_or_default()
        };

        (shell, version)
    }
}

#[cfg(target_os = "macos")]
fn detect_rosetta(binary_arch: &str) -> bool {
    if binary_arch == "x86_64" {
        Command::new("sysctl")
            .args(["-n", "hw.optional.arm64"])
            .output()
            .map(|o| String::from_utf8_lossy(&o.stdout).trim() == "1")
            .unwrap_or(false)
    } else {
        false
    }
}

#[cfg(not(target_os = "macos"))]
fn detect_rosetta(_binary_arch: &str) -> bool {
    false
}

pub fn scan() -> SystemInfo {
    let os_name = System::name().unwrap_or_else(|| "Unknown".into());
    let os_version = System::os_version().unwrap_or_else(|| "Unknown".into());
    let kernel_version = System::kernel_version().unwrap_or_else(|| "Unknown".into());
    let hostname = System::host_name().unwrap_or_else(|| "Unknown".into());
    let architecture = std::env::consts::ARCH.to_string();

    let mut sys = System::new();
    sys.refresh_cpu_all();
    sys.refresh_memory();

    let cpu_brand = sys
        .cpus()
        .first()
        .map(|c| c.brand().to_string())
        .unwrap_or_else(|| "Unknown".into());
    let total_mem = sys.total_memory();
    let memory_gb = format!("{} GB", total_mem / 1_073_741_824);

    let (shell, shell_version) = detect_shell();

    let username = std::env::var("USER")
        .or_else(|_| std::env::var("USERNAME"))
        .unwrap_or_else(|_| "unknown".into());

    let home_dir = dirs::home_dir()
        .map(|p| p.to_string_lossy().to_string())
        .unwrap_or_else(|| "~".into());

    let binary_architecture = std::env::consts::ARCH.to_string();
    let architecture_mismatch = detect_rosetta(&binary_architecture);

    SystemInfo {
        os_name,
        os_version,
        kernel_version,
        architecture,
        hostname,
        shell,
        shell_version,
        cpu_brand,
        memory_gb,
        username,
        home_dir,
        binary_architecture,
        architecture_mismatch,
    }
}
