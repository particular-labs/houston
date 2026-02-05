use serde::{Deserialize, Serialize};
use std::process::Command;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PackageInfo {
    pub name: String,
    pub version: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PackageList {
    pub npm_global: Vec<PackageInfo>,
    pub brew: Vec<PackageInfo>,
    pub pip: Vec<PackageInfo>,
    pub cargo: Vec<PackageInfo>,
    pub scoop: Vec<PackageInfo>,
    pub chocolatey: Vec<PackageInfo>,
}

fn scan_npm_global() -> Vec<PackageInfo> {
    let output = Command::new("npm")
        .args(["list", "-g", "--depth=0", "--json"])
        .output();

    match output {
        Ok(o) if o.status.success() => {
            let stdout = String::from_utf8_lossy(&o.stdout);
            if let Ok(json) = serde_json::from_str::<serde_json::Value>(&stdout) {
                if let Some(deps) = json.get("dependencies").and_then(|d| d.as_object()) {
                    return deps
                        .iter()
                        .map(|(name, info)| PackageInfo {
                            name: name.clone(),
                            version: info
                                .get("version")
                                .and_then(|v| v.as_str())
                                .unwrap_or("unknown")
                                .to_string(),
                        })
                        .collect();
                }
            }
            Vec::new()
        }
        _ => Vec::new(),
    }
}

fn scan_brew() -> Vec<PackageInfo> {
    // Homebrew exists on macOS and Linux, but not Windows
    if cfg!(target_os = "windows") {
        return Vec::new();
    }

    let output = Command::new("brew").args(["list", "--versions"]).output();

    match output {
        Ok(o) if o.status.success() => {
            let stdout = String::from_utf8_lossy(&o.stdout);
            stdout
                .lines()
                .filter_map(|line| {
                    let parts: Vec<&str> = line.splitn(2, ' ').collect();
                    if parts.len() == 2 {
                        Some(PackageInfo {
                            name: parts[0].to_string(),
                            version: parts[1].trim().to_string(),
                        })
                    } else {
                        None
                    }
                })
                .collect()
        }
        _ => Vec::new(),
    }
}

fn scan_pip() -> Vec<PackageInfo> {
    let output = Command::new("pip3")
        .args(["list", "--format=json"])
        .output();

    match output {
        Ok(o) if o.status.success() => {
            let stdout = String::from_utf8_lossy(&o.stdout);
            if let Ok(packages) = serde_json::from_str::<Vec<serde_json::Value>>(&stdout) {
                return packages
                    .iter()
                    .filter_map(|pkg| {
                        let name = pkg.get("name")?.as_str()?.to_string();
                        let version = pkg.get("version")?.as_str()?.to_string();
                        Some(PackageInfo { name, version })
                    })
                    .collect();
            }
            Vec::new()
        }
        _ => Vec::new(),
    }
}

fn scan_cargo() -> Vec<PackageInfo> {
    let output = Command::new("cargo").args(["install", "--list"]).output();

    match output {
        Ok(o) if o.status.success() => {
            let stdout = String::from_utf8_lossy(&o.stdout);
            stdout
                .lines()
                .filter(|line| !line.starts_with(' '))
                .filter_map(|line| {
                    // Format: "package_name v0.1.0:"
                    let parts: Vec<&str> = line.splitn(2, ' ').collect();
                    if parts.len() == 2 {
                        Some(PackageInfo {
                            name: parts[0].to_string(),
                            version: parts[1]
                                .trim_end_matches(':')
                                .trim_start_matches('v')
                                .to_string(),
                        })
                    } else {
                        None
                    }
                })
                .collect()
        }
        _ => Vec::new(),
    }
}

fn scan_scoop() -> Vec<PackageInfo> {
    if !cfg!(target_os = "windows") {
        return Vec::new();
    }

    // `scoop list` outputs a table; parse lines after the header separator
    let output = Command::new("scoop").args(["list"]).output();

    match output {
        Ok(o) if o.status.success() => {
            let stdout = String::from_utf8_lossy(&o.stdout);
            let mut started = false;
            stdout
                .lines()
                .filter_map(|line| {
                    let trimmed = line.trim();
                    if trimmed.starts_with("----") || trimmed.starts_with("Name") {
                        started = true;
                        return None;
                    }
                    if !started || trimmed.is_empty() {
                        return None;
                    }
                    let parts: Vec<&str> = trimmed.split_whitespace().collect();
                    if parts.len() >= 2 {
                        Some(PackageInfo {
                            name: parts[0].to_string(),
                            version: parts[1].to_string(),
                        })
                    } else {
                        None
                    }
                })
                .collect()
        }
        _ => Vec::new(),
    }
}

fn scan_chocolatey() -> Vec<PackageInfo> {
    if !cfg!(target_os = "windows") {
        return Vec::new();
    }

    let output = Command::new("choco")
        .args(["list", "--local-only"])
        .output();

    match output {
        Ok(o) if o.status.success() => {
            let stdout = String::from_utf8_lossy(&o.stdout);
            stdout
                .lines()
                .filter_map(|line| {
                    let trimmed = line.trim();
                    // Skip summary line like "42 packages installed."
                    if trimmed.contains("packages installed") || trimmed.is_empty() {
                        return None;
                    }
                    let parts: Vec<&str> = trimmed.splitn(2, ' ').collect();
                    if parts.len() == 2 {
                        Some(PackageInfo {
                            name: parts[0].to_string(),
                            version: parts[1].trim().to_string(),
                        })
                    } else {
                        None
                    }
                })
                .collect()
        }
        _ => Vec::new(),
    }
}

pub fn scan() -> PackageList {
    let npm = std::thread::spawn(scan_npm_global);
    let brew = std::thread::spawn(scan_brew);
    let pip = std::thread::spawn(scan_pip);
    let cargo = std::thread::spawn(scan_cargo);
    let scoop = std::thread::spawn(scan_scoop);
    let choco = std::thread::spawn(scan_chocolatey);

    PackageList {
        npm_global: npm.join().unwrap_or_default(),
        brew: brew.join().unwrap_or_default(),
        pip: pip.join().unwrap_or_default(),
        cargo: cargo.join().unwrap_or_default(),
        scoop: scoop.join().unwrap_or_default(),
        chocolatey: choco.join().unwrap_or_default(),
    }
}
