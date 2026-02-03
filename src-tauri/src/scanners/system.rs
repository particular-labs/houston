use serde::{Deserialize, Serialize};
use std::process::Command;

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
}

fn run_cmd(cmd: &str, args: &[&str]) -> String {
    Command::new(cmd)
        .args(args)
        .output()
        .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
        .unwrap_or_default()
}

pub fn scan() -> SystemInfo {
    let os_name = if cfg!(target_os = "macos") {
        "macOS".to_string()
    } else if cfg!(target_os = "linux") {
        "Linux".to_string()
    } else {
        "Unknown".to_string()
    };

    let os_version = if cfg!(target_os = "macos") {
        run_cmd("sw_vers", &["-productVersion"])
    } else {
        run_cmd("uname", &["-r"])
    };

    let kernel_version = run_cmd("uname", &["-r"]);
    let architecture = run_cmd("uname", &["-m"]);
    let hostname = run_cmd("hostname", &[]);

    let shell_path = std::env::var("SHELL").unwrap_or_else(|_| "/bin/zsh".to_string());
    let shell = shell_path
        .split('/')
        .last()
        .unwrap_or("unknown")
        .to_string();

    let shell_version = Command::new(&shell_path)
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

    // Extract just the version number from shell version string
    let shell_version = shell_version
        .lines()
        .next()
        .unwrap_or("")
        .to_string();

    let cpu_brand = if cfg!(target_os = "macos") {
        run_cmd("sysctl", &["-n", "machdep.cpu.brand_string"])
    } else {
        "Unknown".to_string()
    };

    let memory_gb = if cfg!(target_os = "macos") {
        let bytes = run_cmd("sysctl", &["-n", "hw.memsize"]);
        bytes
            .parse::<u64>()
            .map(|b| format!("{} GB", b / 1_073_741_824))
            .unwrap_or_else(|_| "Unknown".to_string())
    } else {
        "Unknown".to_string()
    };

    let username = std::env::var("USER").unwrap_or_else(|_| "unknown".to_string());
    let home_dir = dirs::home_dir()
        .map(|p| p.to_string_lossy().to_string())
        .unwrap_or_else(|| "~".to_string());

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
    }
}
