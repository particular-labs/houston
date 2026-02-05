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
    pub binary_architecture: String,
    pub architecture_mismatch: bool,
}

fn run_cmd(cmd: &str, args: &[&str]) -> String {
    Command::new(cmd)
        .args(args)
        .output()
        .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
        .unwrap_or_default()
}

pub fn scan() -> SystemInfo {
    // Pure-Rust values (no process spawns needed)
    let os_name = if cfg!(target_os = "macos") {
        "macOS".to_string()
    } else if cfg!(target_os = "linux") {
        "Linux".to_string()
    } else {
        "Unknown".to_string()
    };

    let shell_path = std::env::var("SHELL").unwrap_or_else(|_| "/bin/zsh".to_string());
    let shell = shell_path
        .split('/')
        .last()
        .unwrap_or("unknown")
        .to_string();

    let username = std::env::var("USER").unwrap_or_else(|_| "unknown".to_string());
    let home_dir = dirs::home_dir()
        .map(|p| p.to_string_lossy().to_string())
        .unwrap_or_else(|| "~".to_string());
    let binary_architecture = std::env::consts::ARCH.to_string();

    // Spawn all shell commands in parallel to avoid sequential spawn overhead
    let os_version_t = std::thread::spawn(|| {
        if cfg!(target_os = "macos") {
            run_cmd("sw_vers", &["-productVersion"])
        } else {
            run_cmd("uname", &["-r"])
        }
    });

    let kernel_t = std::thread::spawn(|| run_cmd("uname", &["-r"]));
    let arch_t = std::thread::spawn(|| run_cmd("uname", &["-m"]));
    let hostname_t = std::thread::spawn(|| run_cmd("hostname", &[]));

    let shell_path_clone = shell_path.clone();
    let shell_version_t = std::thread::spawn(move || {
        let output = Command::new(&shell_path_clone)
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
        // Extract just the first line
        output.lines().next().unwrap_or("").to_string()
    });

    let cpu_t = std::thread::spawn(|| {
        if cfg!(target_os = "macos") {
            run_cmd("sysctl", &["-n", "machdep.cpu.brand_string"])
        } else {
            "Unknown".to_string()
        }
    });

    let memory_t = std::thread::spawn(|| {
        if cfg!(target_os = "macos") {
            let bytes = run_cmd("sysctl", &["-n", "hw.memsize"]);
            bytes
                .parse::<u64>()
                .map(|b| format!("{} GB", b / 1_073_741_824))
                .unwrap_or_else(|_| "Unknown".to_string())
        } else {
            "Unknown".to_string()
        }
    });

    // Detect real hardware architecture (uname -m lies under Rosetta)
    let bin_arch = binary_architecture.clone();
    let arm64_t = std::thread::spawn(move || {
        if cfg!(target_os = "macos") && bin_arch == "x86_64" {
            run_cmd("sysctl", &["-n", "hw.optional.arm64"]) == "1"
        } else {
            false
        }
    });

    // Collect all results
    let os_version = os_version_t.join().unwrap_or_else(|_| String::new());
    let kernel_version = kernel_t.join().unwrap_or_else(|_| String::new());
    let architecture = arch_t.join().unwrap_or_else(|_| String::new());
    let hostname = hostname_t.join().unwrap_or_else(|_| String::new());
    let shell_version = shell_version_t.join().unwrap_or_else(|_| String::new());
    let cpu_brand = cpu_t.join().unwrap_or_else(|_| String::new());
    let memory_gb = memory_t.join().unwrap_or_else(|_| String::new());
    let architecture_mismatch = arm64_t.join().unwrap_or_else(|_| false);

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
